import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { sendOTPEmail, generateOTP } from "./services/email";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";

// Coffee date price in cents ($25)
const COFFEE_DATE_PRICE = 2500;
// Platform fee percentage (25%)
const PLATFORM_FEE_PERCENT = 25;

const otpSendAttempts = new Map<string, { count: number; resetAt: number }>();
const otpVerifyAttempts = new Map<string, { count: number; resetAt: number; lockoutUntil?: number }>();

const OTP_SEND_LIMIT = 5;
const OTP_SEND_WINDOW = 60 * 60 * 1000;
const OTP_VERIFY_LIMIT = 5;
const OTP_VERIFY_WINDOW = 15 * 60 * 1000;
const OTP_LOCKOUT_DURATION = 30 * 60 * 1000;

function checkSendRateLimit(email: string): { allowed: boolean; retryAfter?: number } {
  const key = email.toLowerCase();
  const now = Date.now();
  const record = otpSendAttempts.get(key);

  if (!record || now > record.resetAt) {
    otpSendAttempts.set(key, { count: 1, resetAt: now + OTP_SEND_WINDOW });
    return { allowed: true };
  }

  if (record.count >= OTP_SEND_LIMIT) {
    return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
  }

  record.count++;
  return { allowed: true };
}

function checkVerifyRateLimit(email: string): { allowed: boolean; retryAfter?: number } {
  const key = email.toLowerCase();
  const now = Date.now();
  const record = otpVerifyAttempts.get(key);

  if (record?.lockoutUntil && now < record.lockoutUntil) {
    return { allowed: false, retryAfter: Math.ceil((record.lockoutUntil - now) / 1000) };
  }

  if (!record || now > record.resetAt) {
    otpVerifyAttempts.set(key, { count: 1, resetAt: now + OTP_VERIFY_WINDOW });
    return { allowed: true };
  }

  if (record.count >= OTP_VERIFY_LIMIT) {
    record.lockoutUntil = now + OTP_LOCKOUT_DURATION;
    return { allowed: false, retryAfter: Math.ceil(OTP_LOCKOUT_DURATION / 1000) };
  }

  record.count++;
  return { allowed: true };
}

function resetVerifyAttempts(email: string) {
  otpVerifyAttempts.delete(email.toLowerCase());
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/send-otp", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const rateLimit = checkSendRateLimit(email);
      if (!rateLimit.allowed) {
        return res.status(429).json({
          error: "Too many requests. Please try again later.",
          retryAfter: rateLimit.retryAfter,
        });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await storage.createOtp({
        email: email.toLowerCase(),
        code: otp,
        expiresAt,
      });

      const sent = await sendOTPEmail(email, otp);

      if (!sent) {
        return res.status(500).json({ error: "Failed to send OTP email" });
      }

      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ error: "Email and code are required" });
      }

      // Demo login bypass for testing - only works in development mode
      const isDemoAccount = email.toLowerCase().endsWith('@demo.com') && process.env.NODE_ENV !== 'production';
      
      if (!isDemoAccount) {
        const rateLimit = checkVerifyRateLimit(email);
        if (!rateLimit.allowed) {
          return res.status(429).json({
            error: "Too many attempts. Your account is temporarily locked.",
            retryAfter: rateLimit.retryAfter,
          });
        }

        const validOtp = await storage.getValidOtp(email, code);

        if (!validOtp) {
          return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        await storage.markOtpUsed(validOtp.id);
        resetVerifyAttempts(email);
      } else {
        // For demo accounts, just verify code is 6 digits
        if (!/^\d{6}$/.test(code)) {
          return res.status(400).json({ error: "Invalid OTP format" });
        }
      }

      let user = await storage.getUserByEmail(email);

      if (!user) {
        user = await storage.createUser({ email: email.toLowerCase() });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
          bio: user.bio,
          photos: user.photos,
          coffeePreferences: user.coffeePreferences,
          interests: user.interests,
          availability: user.availability,
          role: user.role,
          location: user.locationLatitude && user.locationLongitude
            ? { latitude: parseFloat(user.locationLatitude), longitude: parseFloat(user.locationLongitude) }
            : null,
          verified: user.verified,
          isProtected: user.isProtected,
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt,
          walletBalance: user.walletBalance || 0,
          hostRate: user.hostRate || 0,
        },
        isNewUser: !user.onboardingCompleted && user.role !== 'admin',
      });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.location) {
        updates.locationLatitude = updates.location.latitude?.toString();
        updates.locationLongitude = updates.location.longitude?.toString();
        delete updates.location;
      }

      const user = await storage.updateUser(id, updates);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
          bio: user.bio,
          photos: user.photos,
          coffeePreferences: user.coffeePreferences,
          interests: user.interests,
          availability: user.availability,
          role: user.role,
          location: user.locationLatitude && user.locationLongitude
            ? { latitude: parseFloat(user.locationLatitude), longitude: parseFloat(user.locationLongitude) }
            : null,
          verified: user.verified,
          isProtected: user.isProtected,
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt,
          walletBalance: user.walletBalance || 0,
          hostRate: user.hostRate || 0,
        },
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          age: user.age,
          gender: user.gender,
          bio: user.bio,
          photos: user.photos,
          coffeePreferences: user.coffeePreferences,
          interests: user.interests,
          availability: user.availability,
          role: user.role,
          location: user.locationLatitude && user.locationLongitude
            ? { latitude: parseFloat(user.locationLatitude), longitude: parseFloat(user.locationLongitude) }
            : null,
          verified: user.verified,
          isProtected: user.isProtected,
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt,
          walletBalance: user.walletBalance || 0,
          hostRate: user.hostRate || 0,
        },
      });
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete user account (self-deletion)
  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.isProtected) {
        return res.status(403).json({ error: "Protected users cannot be deleted" });
      }

      await storage.deleteUser(id);
      res.json({ success: true, message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== DISCOVERY ROUTES ====================

  // Get discoverable profiles for swiping (now uses user's saved filters)
  app.get("/api/discover/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      const user = await storage.getUser(userId);
      if (!user || !user.role) {
        return res.status(400).json({ error: "User not found or role not set" });
      }

      // Admin users cannot use discovery - they manage the platform
      if (user.role === 'admin') {
        return res.json({ profiles: [] });
      }

      // Get user's filters and apply them
      const filters = await storage.getUserFilters(userId);
      const profiles = await storage.getFilteredProfiles(userId, user.role as 'host' | 'guest', filters || undefined);
      
      res.json({
        profiles: profiles.map(p => ({
          id: p.id,
          name: p.name,
          age: p.age,
          bio: p.bio,
          photos: p.photos,
          coffeePreferences: p.coffeePreferences,
          interests: p.interests,
          role: p.role,
          verified: p.verified,
          rating: p.rating,
          ratingCount: p.ratingCount,
          hostRate: p.hostRate,
          location: p.locationLatitude && p.locationLongitude
            ? { latitude: parseFloat(p.locationLatitude), longitude: parseFloat(p.locationLongitude) }
            : null,
        })),
      });
    } catch (error) {
      console.error("Error getting discoverable profiles:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== SWIPE ROUTES ====================

  // Record a swipe
  app.post("/api/swipe", async (req: Request, res: Response) => {
    try {
      const { swiperId, swipedId, direction } = req.body;

      if (!swiperId || !swipedId || !direction) {
        return res.status(400).json({ error: "swiperId, swipedId, and direction are required" });
      }

      if (direction !== 'like' && direction !== 'pass') {
        return res.status(400).json({ error: "direction must be 'like' or 'pass'" });
      }

      // Check if already swiped
      const existingSwipe = await storage.hasSwipedOnUser(swiperId, swipedId);
      if (existingSwipe) {
        return res.status(400).json({ error: "Already swiped on this user" });
      }

      // Record the swipe
      await storage.createSwipe({ swiperId, swipedId, direction });

      let match = null;

      // If it's a like, check for mutual match
      if (direction === 'like') {
        const reverseSwipe = await storage.getSwipe(swipedId, swiperId);
        
        if (reverseSwipe && reverseSwipe.direction === 'like') {
          // Mutual like - create a match!
          const existingMatch = await storage.getMatchBetweenUsers(swiperId, swipedId);
          
          if (!existingMatch) {
            match = await storage.createMatch({ user1Id: swiperId, user2Id: swipedId });
            
            // Get the matched user's profile
            const matchedUser = await storage.getUser(swipedId);
            if (matchedUser) {
              match = {
                ...match,
                matchedUser: {
                  id: matchedUser.id,
                  name: matchedUser.name,
                  photos: matchedUser.photos,
                },
              };
            }
          }
        }
      }

      res.json({
        success: true,
        isMatch: !!match,
        match,
      });
    } catch (error) {
      console.error("Error recording swipe:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== MATCHES ROUTES ====================

  // Get all matches for a user
  app.get("/api/matches/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      const matchRecords = await storage.getMatchesForUser(userId);
      
      // Enrich matches with user data and last message
      const enrichedMatches = await Promise.all(
        matchRecords.map(async (match) => {
          const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
          const otherUser = await storage.getUser(otherUserId);
          
          // Get messages for this match
          const matchMessages = await storage.getMessagesForMatch(match.id);
          const lastMessage = matchMessages[matchMessages.length - 1];
          const unreadCount = await storage.getUnreadCount(match.id, userId);
          
          return {
            id: match.id,
            matchedAt: match.createdAt,
            otherUser: otherUser ? {
              id: otherUser.id,
              name: otherUser.name,
              photos: otherUser.photos,
              bio: otherUser.bio,
              coffeePreferences: otherUser.coffeePreferences,
              role: otherUser.role,
              hostRate: otherUser.hostRate || 0,
            } : null,
            lastMessage: lastMessage ? {
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            } : null,
            unreadCount,
          };
        })
      );
      
      res.json({ matches: enrichedMatches });
    } catch (error) {
      console.error("Error getting matches:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== MESSAGES ROUTES ====================

  // Get messages for a match
  app.get("/api/messages/:matchId", async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const { userId } = req.query;
      
      const match = await storage.getMatch(matchId);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }

      // Verify user is part of this match
      if (userId && match.user1Id !== userId && match.user2Id !== userId) {
        return res.status(403).json({ error: "Not authorized to view these messages" });
      }

      const matchMessages = await storage.getMessagesForMatch(matchId);
      
      // Mark messages as read if userId is provided
      if (userId && typeof userId === 'string') {
        await storage.markMessagesAsRead(matchId, userId);
      }
      
      res.json({
        messages: matchMessages.map(m => ({
          id: m.id,
          content: m.content,
          senderId: m.senderId,
          read: m.read,
          createdAt: m.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Send a message
  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const { matchId, senderId, content } = req.body;

      if (!matchId || !senderId || !content) {
        return res.status(400).json({ error: "matchId, senderId, and content are required" });
      }

      const match = await storage.getMatch(matchId);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }

      // Verify sender is part of this match
      if (match.user1Id !== senderId && match.user2Id !== senderId) {
        return res.status(403).json({ error: "Not authorized to send messages in this match" });
      }

      const message = await storage.createMessage({ matchId, senderId, content });
      
      res.json({
        success: true,
        message: {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          read: message.read,
          createdAt: message.createdAt,
        },
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== COFFEE DATES ROUTES ====================

  // Get all coffee dates for a user
  app.get("/api/coffee-dates/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { upcoming } = req.query;
      
      const dates = upcoming === 'true' 
        ? await storage.getUpcomingCoffeeDatesForUser(userId)
        : await storage.getCoffeeDatesForUser(userId);
      
      // Enrich with user data
      const enrichedDates = await Promise.all(
        dates.map(async (date) => {
          const host = await storage.getUser(date.hostId);
          const guest = await storage.getUser(date.guestId);
          const match = await storage.getMatch(date.matchId);
          
          return {
            id: date.id,
            matchId: date.matchId,
            scheduledDate: date.scheduledDate,
            cafeName: date.cafeName,
            cafeAddress: date.cafeAddress,
            cafeLocation: date.cafeLatitude && date.cafeLongitude ? {
              latitude: parseFloat(date.cafeLatitude),
              longitude: parseFloat(date.cafeLongitude),
            } : null,
            status: date.status,
            paymentStatus: date.paymentStatus,
            paymentAmount: date.paymentAmount,
            notes: date.notes,
            proposedBy: date.proposedBy,
            host: host ? {
              id: host.id,
              name: host.name,
              photos: host.photos,
            } : null,
            guest: guest ? {
              id: guest.id,
              name: guest.name,
              photos: guest.photos,
            } : null,
            createdAt: date.createdAt,
          };
        })
      );
      
      res.json({ dates: enrichedDates });
    } catch (error) {
      console.error("Error getting coffee dates:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get coffee dates for a specific match
  app.get("/api/coffee-dates/match/:matchId", async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      
      const dates = await storage.getCoffeeDatesForMatch(matchId);
      
      res.json({
        dates: dates.map(date => ({
          id: date.id,
          scheduledDate: date.scheduledDate,
          cafeName: date.cafeName,
          cafeAddress: date.cafeAddress,
          status: date.status,
          paymentStatus: date.paymentStatus,
          proposedBy: date.proposedBy,
          createdAt: date.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error getting coffee dates for match:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create a coffee date proposal
  app.post("/api/coffee-dates", async (req: Request, res: Response) => {
    try {
      const { 
        matchId, 
        proposedBy, 
        scheduledDate, 
        cafeName, 
        cafeAddress,
        cafeLatitude,
        cafeLongitude,
        notes 
      } = req.body;

      if (!matchId || !proposedBy || !scheduledDate) {
        return res.status(400).json({ error: "matchId, proposedBy, and scheduledDate are required" });
      }

      // Get the match to determine host and guest
      const match = await storage.getMatch(matchId);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }

      // Verify proposer is part of this match
      if (match.user1Id !== proposedBy && match.user2Id !== proposedBy) {
        return res.status(403).json({ error: "Not authorized to propose a date for this match" });
      }

      // Get both users to determine roles
      const user1 = await storage.getUser(match.user1Id);
      const user2 = await storage.getUser(match.user2Id);
      
      if (!user1 || !user2) {
        return res.status(404).json({ error: "Match users not found" });
      }

      // Determine host and guest based on roles
      let hostId: string;
      let guestId: string;
      
      if (user1.role === 'host') {
        hostId = user1.id;
        guestId = user2.id;
      } else {
        hostId = user2.id;
        guestId = user1.id;
      }

      const coffeeDate = await storage.createCoffeeDate({
        matchId,
        proposedBy,
        hostId,
        guestId,
        scheduledDate: new Date(scheduledDate),
        cafeName,
        cafeAddress,
        cafeLatitude,
        cafeLongitude,
        notes,
      });

      res.json({
        success: true,
        date: {
          id: coffeeDate.id,
          matchId: coffeeDate.matchId,
          scheduledDate: coffeeDate.scheduledDate,
          cafeName: coffeeDate.cafeName,
          cafeAddress: coffeeDate.cafeAddress,
          status: coffeeDate.status,
          createdAt: coffeeDate.createdAt,
        },
      });
    } catch (error) {
      console.error("Error creating coffee date:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update coffee date status (accept, decline, confirm, cancel)
  app.patch("/api/coffee-dates/:dateId", async (req: Request, res: Response) => {
    try {
      const { dateId } = req.params;
      const { status, userId } = req.body;

      if (!status || !userId) {
        return res.status(400).json({ error: "status and userId are required" });
      }

      const validStatuses = ['accepted', 'declined', 'confirmed', 'cancelled', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
      }

      const coffeeDate = await storage.getCoffeeDate(dateId);
      if (!coffeeDate) {
        return res.status(404).json({ error: "Coffee date not found" });
      }

      // Verify user is part of this date
      if (coffeeDate.hostId !== userId && coffeeDate.guestId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this date" });
      }

      const updatedDate = await storage.updateCoffeeDate(dateId, { status });

      res.json({
        success: true,
        date: updatedDate,
      });
    } catch (error) {
      console.error("Error updating coffee date:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== WALLET ROUTES ====================

  // Get wallet balance and transaction history
  app.get("/api/wallet/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const transactions = await storage.getWalletTransactions(userId);
      
      res.json({
        balance: user.walletBalance || 0,
        transactions,
      });
    } catch (error) {
      console.error("Error getting wallet:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create wallet top-up checkout session
  app.post("/api/wallet/top-up", async (req: Request, res: Response) => {
    try {
      const { userId, amount } = req.body;

      if (!userId || !amount) {
        return res.status(400).json({ error: "userId and amount are required" });
      }

      // Amount is in INR paise (100 paise = 1 INR)
      const amountInPaise = parseInt(amount);
      if (isNaN(amountInPaise) || amountInPaise < 100) {
        return res.status(400).json({ error: "Minimum amount is 100 paise (1 INR)" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role !== 'guest') {
        return res.status(400).json({ error: "Only guests can top up wallet" });
      }

      const stripe = await getUncachableStripeClient();

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || undefined,
          metadata: { userId: user.id },
        });
        await storage.updateUser(user.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      // Get the base URL for success/cancel redirects
      const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || process.env.REPLIT_DEV_DOMAIN;
      if (!domain) {
        return res.status(500).json({ error: "Server configuration error: no domain available" });
      }
      const baseUrl = `https://${domain}`;

      // Create checkout session for wallet top-up
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: 'Wallet Top-Up',
                description: `Add ${(amountInPaise / 100).toFixed(0)} INR to your Coffee Date wallet`,
              },
              unit_amount: amountInPaise,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/wallet-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/wallet-cancel`,
        metadata: {
          userId,
          type: 'wallet_topup',
          amount: amountInPaise.toString(),
        },
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Error creating wallet top-up session:", error);
      res.status(500).json({ error: "Failed to create payment session" });
    }
  });

  // Confirm wallet top-up (called after redirect)
  app.post("/api/wallet/confirm-topup", async (req: Request, res: Response) => {
    try {
      const { sessionId, userId } = req.body;

      if (!sessionId || !userId) {
        return res.status(400).json({ error: "sessionId and userId are required" });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Verify this session belongs to this user
      if (session.metadata?.userId !== userId) {
        return res.status(403).json({ error: "Session does not belong to this user" });
      }

      if (session.metadata?.type !== 'wallet_topup') {
        return res.status(400).json({ error: "Invalid session type" });
      }

      if (session.payment_status !== 'paid') {
        return res.json({ success: false, status: session.payment_status });
      }

      const amount = parseInt(session.metadata?.amount || '0');
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if this session was already processed
      const existingTransactions = await storage.getWalletTransactions(userId);
      const alreadyProcessed = existingTransactions.some(t => t.stripeSessionId === sessionId);
      
      if (alreadyProcessed) {
        return res.json({ success: true, balance: user.walletBalance });
      }

      // Credit the wallet
      const newBalance = (user.walletBalance || 0) + amount;
      await storage.updateWalletBalance(userId, newBalance);

      // Record the transaction
      await storage.createWalletTransaction({
        userId,
        amount,
        type: 'credit',
        source: 'stripe',
        description: `Wallet top-up of ${(amount / 100).toFixed(0)} INR`,
        stripeSessionId: sessionId,
      });

      res.json({ success: true, balance: newBalance });
    } catch (error) {
      console.error("Error confirming wallet top-up:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // User confirms "Date is Set" - both guest and host must confirm before wallet is charged
  app.post("/api/coffee-dates/:dateId/confirm", async (req: Request, res: Response) => {
    try {
      const { dateId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      const coffeeDate = await storage.getCoffeeDate(dateId);
      if (!coffeeDate) {
        return res.status(404).json({ error: "Coffee date not found" });
      }

      // Already confirmed/paid
      if (coffeeDate.paymentStatus === 'paid') {
        return res.status(400).json({ error: "This date has already been confirmed and paid" });
      }

      // Only accepted dates can be confirmed
      if (coffeeDate.status !== 'accepted') {
        return res.status(400).json({ error: "Only accepted dates can be confirmed. Current status: " + coffeeDate.status });
      }

      const isGuest = coffeeDate.guestId === userId;
      const isHost = coffeeDate.hostId === userId;

      if (!isGuest && !isHost) {
        return res.status(403).json({ error: "You are not part of this date" });
      }

      // Update the confirmation status for this user
      const updates: any = {};
      if (isGuest) {
        updates.guestConfirmed = true;
      } else {
        updates.hostConfirmed = true;
      }

      await storage.updateCoffeeDate(dateId, updates);

      // Refetch to get updated data
      const updatedDate = await storage.getCoffeeDate(dateId);
      if (!updatedDate) {
        return res.status(404).json({ error: "Coffee date not found" });
      }

      // Check if BOTH have now confirmed
      if (updatedDate.guestConfirmed && updatedDate.hostConfirmed) {
        const host = await storage.getUser(updatedDate.hostId);
        const guest = await storage.getUser(updatedDate.guestId);

        if (!host || !guest) {
          return res.status(404).json({ error: "Users not found" });
        }

        // Get the host's rate
        const hostRate = host.hostRate || 0;
        if (hostRate <= 0) {
          return res.status(400).json({ error: "Host has not set a rate" });
        }

        // Check if guest has enough balance
        const guestBalance = guest.walletBalance || 0;
        if (guestBalance < hostRate) {
          // Revert the confirmation since payment can't be processed
          await storage.updateCoffeeDate(dateId, { 
            guestConfirmed: false 
          });
          return res.status(400).json({ 
            error: "Insufficient wallet balance",
            required: hostRate,
            available: guestBalance,
          });
        }

        // Deduct from guest's wallet
        const newGuestBalance = guestBalance - hostRate;
        await storage.updateWalletBalance(guest.id, newGuestBalance);

        // Record the transaction
        await storage.createWalletTransaction({
          userId: guest.id,
          amount: hostRate,
          type: 'debit',
          source: 'date_fee',
          description: `Coffee date with ${host.name}`,
          relatedDateId: dateId,
        });

        // Update the coffee date status
        await storage.updateCoffeeDate(dateId, {
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentAmount: hostRate,
        });

        return res.json({ 
          success: true, 
          bothConfirmed: true,
          paymentProcessed: true,
          amountCharged: hostRate,
          guestConfirmed: true,
          hostConfirmed: true,
        });
      }

      // Only one party has confirmed so far
      res.json({ 
        success: true, 
        bothConfirmed: false,
        guestConfirmed: updatedDate.guestConfirmed,
        hostConfirmed: updatedDate.hostConfirmed,
        waitingFor: updatedDate.guestConfirmed ? 'host' : 'guest',
      });
    } catch (error) {
      console.error("Error confirming date:", error);
      res.status(500).json({ error: "Failed to confirm date" });
    }
  });

  // Legacy endpoint - redirect to new confirm endpoint
  app.post("/api/wallet/charge-for-date", async (req: Request, res: Response) => {
    return res.status(410).json({ error: "This endpoint is deprecated. Use POST /api/coffee-dates/:dateId/confirm instead" });
  });

  // ==================== STRIPE PAYMENT ROUTES ====================

  // Get Stripe publishable key
  app.get("/api/stripe/config", async (req: Request, res: Response) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey, datePrice: COFFEE_DATE_PRICE });
    } catch (error) {
      console.error("Error getting Stripe config:", error);
      res.status(500).json({ error: "Failed to get payment configuration" });
    }
  });

  // Create checkout session for a coffee date
  app.post("/api/stripe/checkout", async (req: Request, res: Response) => {
    try {
      const { dateId, userId } = req.body;

      if (!dateId || !userId) {
        return res.status(400).json({ error: "dateId and userId are required" });
      }

      const coffeeDate = await storage.getCoffeeDate(dateId);
      if (!coffeeDate) {
        return res.status(404).json({ error: "Coffee date not found" });
      }

      // Only the guest can pay for the date
      if (coffeeDate.guestId !== userId) {
        return res.status(403).json({ error: "Only the guest can pay for the coffee date" });
      }

      // Date must be accepted before payment
      if (coffeeDate.status !== 'accepted') {
        return res.status(400).json({ error: "Date must be accepted before payment" });
      }

      // Already paid
      if (coffeeDate.paymentStatus === 'paid') {
        return res.status(400).json({ error: "This date has already been paid for" });
      }

      const guest = await storage.getUser(coffeeDate.guestId);
      const host = await storage.getUser(coffeeDate.hostId);

      if (!guest || !host) {
        return res.status(404).json({ error: "Users not found" });
      }

      const stripe = await getUncachableStripeClient();

      // Create or get Stripe customer for guest
      let customerId = guest.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: guest.email,
          name: guest.name || undefined,
          metadata: { userId: guest.id },
        });
        await storage.updateUser(guest.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      // Get the base URL for success/cancel redirects
      const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || process.env.REPLIT_DEV_DOMAIN;
      if (!domain) {
        return res.status(500).json({ error: "Server configuration error: no domain available" });
      }
      const baseUrl = `https://${domain}`;

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Coffee Date with ${host.name}`,
                description: coffeeDate.cafeName 
                  ? `${coffeeDate.cafeName} on ${new Date(coffeeDate.scheduledDate).toLocaleDateString()}`
                  : `Scheduled for ${new Date(coffeeDate.scheduledDate).toLocaleDateString()}`,
              },
              unit_amount: COFFEE_DATE_PRICE,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/payment-success?dateId=${dateId}`,
        cancel_url: `${baseUrl}/payment-cancel?dateId=${dateId}`,
        metadata: {
          dateId,
          guestId: coffeeDate.guestId,
          hostId: coffeeDate.hostId,
        },
      });

      // Store the session ID on the coffee date
      await storage.updateCoffeeDate(dateId, { 
        stripeSessionId: session.id,
        paymentAmount: COFFEE_DATE_PRICE,
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create payment session" });
    }
  });

  // Confirm payment was successful (called after redirect)
  app.post("/api/stripe/confirm-payment", async (req: Request, res: Response) => {
    try {
      const { dateId, userId } = req.body;

      if (!dateId || !userId) {
        return res.status(400).json({ error: "dateId and userId are required" });
      }

      const coffeeDate = await storage.getCoffeeDate(dateId);
      if (!coffeeDate) {
        return res.status(404).json({ error: "Coffee date not found" });
      }

      // Verify user is part of this date
      if (coffeeDate.guestId !== userId && coffeeDate.hostId !== userId) {
        return res.status(403).json({ error: "Not authorized to confirm this payment" });
      }

      if (!coffeeDate.stripeSessionId) {
        return res.status(400).json({ error: "No payment session found for this date" });
      }

      // Already paid - return success
      if (coffeeDate.paymentStatus === 'paid') {
        return res.json({ success: true, status: 'paid' });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(coffeeDate.stripeSessionId);

      // Verify session metadata matches the date
      if (session.metadata?.dateId !== dateId) {
        return res.status(400).json({ error: "Session does not match this date" });
      }

      if (session.payment_status === 'paid') {
        await storage.updateCoffeeDate(dateId, {
          paymentStatus: 'paid',
          status: 'confirmed',
          stripePaymentIntentId: session.payment_intent as string,
        });

        res.json({ success: true, status: 'paid' });
      } else {
        res.json({ success: false, status: session.payment_status });
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // ==================== ADMIN ROUTES ====================

  // Protected super admin email
  const SUPER_ADMIN_EMAIL = 'kaushlendra.k12@fms.edu';

  // Initialize super admin on server start
  (async () => {
    try {
      await storage.createOrGetProtectedAdmin(SUPER_ADMIN_EMAIL, 'Super Admin');
      console.log('Super admin initialized:', SUPER_ADMIN_EMAIL);
    } catch (error) {
      console.error('Failed to initialize super admin:', error);
    }
  })();

  // Middleware to check if user is admin with enhanced security
  // Note: For production, this should use JWT/session-based auth
  const requireAdmin = async (req: Request, res: Response, next: Function) => {
    const adminId = req.headers['x-admin-id'] as string;
    const adminEmail = req.headers['x-admin-email'] as string;
    
    if (!adminId || !adminEmail) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }
    
    const admin = await storage.getUser(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Additional verification: email must match stored email
    if (admin.email.toLowerCase() !== adminEmail.toLowerCase()) {
      return res.status(403).json({ error: 'Authentication mismatch' });
    }
    
    (req as any).admin = admin;
    next();
  };

  // Get platform stats
  app.get("/api/admin/stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getPlatformStats();
      res.json({ stats });
    } catch (error) {
      console.error("Error getting admin stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all users
  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json({
        users: allUsers.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          age: u.age,
          role: u.role,
          verified: u.verified,
          isProtected: u.isProtected,
          walletBalance: u.walletBalance,
          hostRate: u.hostRate,
          createdAt: u.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error getting all users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all matches
  app.get("/api/admin/matches", requireAdmin, async (req: Request, res: Response) => {
    try {
      const allMatches = await storage.getAllMatches();
      const enrichedMatches = await Promise.all(
        allMatches.map(async (match) => {
          const user1 = await storage.getUser(match.user1Id);
          const user2 = await storage.getUser(match.user2Id);
          return {
            id: match.id,
            user1: user1 ? { id: user1.id, name: user1.name, email: user1.email } : null,
            user2: user2 ? { id: user2.id, name: user2.name, email: user2.email } : null,
            status: match.status,
            createdAt: match.createdAt,
          };
        })
      );
      res.json({ matches: enrichedMatches });
    } catch (error) {
      console.error("Error getting all matches:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all coffee dates
  app.get("/api/admin/dates", requireAdmin, async (req: Request, res: Response) => {
    try {
      const allDates = await storage.getAllCoffeeDates();
      const enrichedDates = await Promise.all(
        allDates.map(async (date) => {
          const host = await storage.getUser(date.hostId);
          const guest = await storage.getUser(date.guestId);
          return {
            id: date.id,
            host: host ? { id: host.id, name: host.name, email: host.email } : null,
            guest: guest ? { id: guest.id, name: guest.name, email: guest.email } : null,
            scheduledDate: date.scheduledDate,
            cafeName: date.cafeName,
            status: date.status,
            paymentStatus: date.paymentStatus,
            paymentAmount: date.paymentAmount,
            createdAt: date.createdAt,
          };
        })
      );
      res.json({ dates: enrichedDates });
    } catch (error) {
      console.error("Error getting all dates:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get all transactions
  app.get("/api/admin/transactions", requireAdmin, async (req: Request, res: Response) => {
    try {
      const allTransactions = await storage.getAllWalletTransactions();
      const enrichedTransactions = await Promise.all(
        allTransactions.map(async (t) => {
          const user = await storage.getUser(t.userId);
          return {
            id: t.id,
            user: user ? { id: user.id, name: user.name, email: user.email } : null,
            amount: t.amount,
            type: t.type,
            source: t.source,
            description: t.description,
            createdAt: t.createdAt,
          };
        })
      );
      res.json({ transactions: enrichedTransactions });
    } catch (error) {
      console.error("Error getting all transactions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete a user (protected users cannot be deleted)
  app.delete("/api/admin/users/:userId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const deleted = await storage.deleteUser(userId);
      if (!deleted) {
        return res.status(400).json({ error: "Cannot delete this user (protected or not found)" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update user role
  app.patch("/api/admin/users/:userId/role", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['host', 'guest', 'admin'].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.isProtected && role !== 'admin') {
        return res.status(400).json({ error: "Cannot change role of protected admin" });
      }

      const updated = await storage.updateUser(userId, { role });
      res.json({ success: true, user: updated });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Verify/unverify user
  app.patch("/api/admin/users/:userId/verify", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { verified } = req.body;

      const updated = await storage.updateUser(userId, { verified: !!verified });
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, user: updated });
    } catch (error) {
      console.error("Error updating user verification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== BLOCK/REPORT ROUTES ====================

  // Block a user
  app.post("/api/users/:userId/block", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { blockedId } = req.body;

      if (!blockedId) {
        return res.status(400).json({ error: "blockedId is required" });
      }

      const blocked = await storage.blockUser(userId, blockedId);
      res.json({ success: true, blocked });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ error: "Failed to block user" });
    }
  });

  // Unblock a user
  app.delete("/api/users/:userId/block/:blockedId", async (req: Request, res: Response) => {
    try {
      const { userId, blockedId } = req.params;

      await storage.unblockUser(userId, blockedId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ error: "Failed to unblock user" });
    }
  });

  // Get blocked users
  app.get("/api/users/:userId/blocked", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const blockedUsers = await storage.getBlockedUsers(userId);
      const enrichedBlocked = await Promise.all(
        blockedUsers.map(async (b) => {
          const user = await storage.getUser(b.blockedId);
          return {
            id: b.id,
            blockedUser: user ? { id: user.id, name: user.name, photos: user.photos } : null,
            createdAt: b.createdAt,
          };
        })
      );

      res.json({ blockedUsers: enrichedBlocked });
    } catch (error) {
      console.error("Error getting blocked users:", error);
      res.status(500).json({ error: "Failed to get blocked users" });
    }
  });

  // Report a user
  app.post("/api/reports", async (req: Request, res: Response) => {
    try {
      const { reporterId, reportedId, reason, description } = req.body;

      if (!reporterId || !reportedId || !reason) {
        return res.status(400).json({ error: "reporterId, reportedId, and reason are required" });
      }

      const validReasons = ['inappropriate', 'harassment', 'fake_profile', 'spam', 'other'];
      if (!validReasons.includes(reason)) {
        return res.status(400).json({ error: "Invalid reason" });
      }

      const report = await storage.createReport({ reporterId, reportedId, reason, description });
      res.json({ success: true, report });
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ error: "Failed to create report" });
    }
  });

  // Admin: Get all reports
  app.get("/api/admin/reports", requireAdmin, async (req: Request, res: Response) => {
    try {
      const reports = await storage.getAllReports();
      const enrichedReports = await Promise.all(
        reports.map(async (r) => {
          const reporter = await storage.getUser(r.reporterId);
          const reported = await storage.getUser(r.reportedId);
          return {
            id: r.id,
            reporter: reporter ? { id: reporter.id, name: reporter.name, email: reporter.email } : null,
            reported: reported ? { id: reported.id, name: reported.name, email: reported.email } : null,
            reason: r.reason,
            description: r.description,
            status: r.status,
            adminNotes: r.adminNotes,
            createdAt: r.createdAt,
          };
        })
      );
      res.json({ reports: enrichedReports });
    } catch (error) {
      console.error("Error getting reports:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Update report status
  app.patch("/api/admin/reports/:reportId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const { status, adminNotes } = req.body;

      const updated = await storage.updateReport(reportId, { status, adminNotes });
      if (!updated) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json({ success: true, report: updated });
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== VERIFICATION ROUTES ====================

  // Submit verification request (user takes selfie)
  app.post("/api/verification/submit", async (req: Request, res: Response) => {
    try {
      const { userId, selfiePhoto } = req.body;

      if (!userId || !selfiePhoto) {
        return res.status(400).json({ error: "userId and selfiePhoto are required" });
      }

      // Check if user already has a pending verification
      const existingRequest = await storage.getVerificationRequestForUser(userId);
      if (existingRequest && existingRequest.status === 'pending') {
        return res.status(400).json({ error: "You already have a pending verification request" });
      }

      // Create verification request
      const request = await storage.createVerificationRequest({
        userId,
        selfiePhoto,
      });

      // Update user's verification status
      await storage.updateUser(userId, {
        verificationPhoto: selfiePhoto,
        verificationStatus: 'pending',
      });

      res.json({ success: true, request });
    } catch (error) {
      console.error("Error submitting verification:", error);
      res.status(500).json({ error: "Failed to submit verification request" });
    }
  });

  // Get verification status for a user
  app.get("/api/verification/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const request = await storage.getVerificationRequestForUser(userId);

      res.json({
        verified: user.verified,
        verificationStatus: user.verificationStatus || 'none',
        verificationPhoto: user.verificationPhoto,
        rejectedReason: user.verificationRejectedReason,
        latestRequest: request ? {
          id: request.id,
          status: request.status,
          rejectedReason: request.rejectedReason,
          createdAt: request.createdAt,
          reviewedAt: request.reviewedAt,
        } : null,
      });
    } catch (error) {
      console.error("Error getting verification status:", error);
      res.status(500).json({ error: "Failed to get verification status" });
    }
  });

  // Admin: Get pending verification requests
  app.get("/api/admin/verifications", requireAdmin, async (req: Request, res: Response) => {
    try {
      const requests = await storage.getPendingVerificationRequests();
      const enrichedRequests = await Promise.all(
        requests.map(async (r) => {
          const user = await storage.getUser(r.userId);
          return {
            id: r.id,
            user: user ? {
              id: user.id,
              name: user.name,
              email: user.email,
              photos: user.photos,
            } : null,
            selfiePhoto: r.selfiePhoto,
            status: r.status,
            createdAt: r.createdAt,
          };
        })
      );
      res.json({ verifications: enrichedRequests });
    } catch (error) {
      console.error("Error getting verifications:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin: Review verification request
  app.patch("/api/admin/verifications/:requestId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const { status, rejectedReason } = req.body;
      const adminId = req.headers['x-admin-id'] as string;

      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Valid status (approved/rejected) is required" });
      }

      const request = await storage.getVerificationRequest(requestId);
      if (!request) {
        return res.status(404).json({ error: "Verification request not found" });
      }

      // Update verification request
      const updated = await storage.updateVerificationRequest(requestId, {
        status,
        rejectedReason: status === 'rejected' ? rejectedReason : null,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      });

      // Update user's verification status
      await storage.updateUser(request.userId, {
        verified: status === 'approved',
        verificationStatus: status,
        verificationRejectedReason: status === 'rejected' ? rejectedReason : null,
      });

      res.json({ success: true, verification: updated });
    } catch (error) {
      console.error("Error reviewing verification:", error);
      res.status(500).json({ error: "Failed to review verification" });
    }
  });

  // ==================== REVIEW ROUTES ====================

  // Create a review for a completed date
  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      const { coffeeDateId, reviewerId, reviewedId, rating, comment } = req.body;

      if (!coffeeDateId || !reviewerId || !reviewedId || rating === undefined) {
        return res.status(400).json({ error: "coffeeDateId, reviewerId, reviewedId, and rating are required" });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      // Check if date exists and is completed
      const coffeeDate = await storage.getCoffeeDate(coffeeDateId);
      if (!coffeeDate) {
        return res.status(404).json({ error: "Coffee date not found" });
      }

      if (coffeeDate.status !== 'completed' && coffeeDate.status !== 'confirmed') {
        return res.status(400).json({ error: "Can only review completed dates" });
      }

      // Check if already reviewed
      const existingReview = await storage.getReviewForDate(coffeeDateId, reviewerId);
      if (existingReview) {
        return res.status(400).json({ error: "You have already reviewed this date" });
      }

      const review = await storage.createReview({ coffeeDateId, reviewerId, reviewedId, rating, comment });
      res.json({ success: true, review });
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Get reviews for a user
  app.get("/api/users/:userId/reviews", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const reviews = await storage.getReviewsForUser(userId);
      const enrichedReviews = await Promise.all(
        reviews.map(async (r) => {
          const reviewer = await storage.getUser(r.reviewerId);
          return {
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            reviewer: reviewer ? { id: reviewer.id, name: reviewer.name, photos: reviewer.photos } : null,
            createdAt: r.createdAt,
          };
        })
      );

      // Get user's average rating
      const user = await storage.getUser(userId);

      res.json({ 
        reviews: enrichedReviews,
        averageRating: user?.rating || null,
        totalReviews: user?.ratingCount || 0,
      });
    } catch (error) {
      console.error("Error getting reviews:", error);
      res.status(500).json({ error: "Failed to get reviews" });
    }
  });

  // ==================== DISCOVERY FILTERS ROUTES ====================

  // Get user's discovery filters
  app.get("/api/filters/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const filters = await storage.getUserFilters(userId);
      res.json({ filters: filters || { minAge: 18, maxAge: 99, maxDistance: 50, interests: [], availabilityDays: [] } });
    } catch (error) {
      console.error("Error getting filters:", error);
      res.status(500).json({ error: "Failed to get filters" });
    }
  });

  // Save/update user's discovery filters
  app.post("/api/filters/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { minAge, maxAge, maxDistance, interests, availabilityDays } = req.body;

      const filters = await storage.saveUserFilters({
        userId,
        minAge,
        maxAge,
        maxDistance,
        interests,
        availabilityDays,
      });

      res.json({ success: true, filters });
    } catch (error) {
      console.error("Error saving filters:", error);
      res.status(500).json({ error: "Failed to save filters" });
    }
  });

  // Get filtered discovery profiles
  app.get("/api/discover-filtered/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const user = await storage.getUser(userId);
      if (!user || !user.role) {
        return res.status(404).json({ error: "User not found or role not set" });
      }

      const filters = await storage.getUserFilters(userId);
      const profiles = await storage.getFilteredProfiles(userId, user.role as 'host' | 'guest', filters || undefined);

      res.json({
        profiles: profiles.map((p) => ({
          id: p.id,
          name: p.name,
          age: p.age,
          bio: p.bio,
          photos: p.photos,
          coffeePreferences: p.coffeePreferences,
          interests: p.interests,
          availability: p.availability,
          role: p.role,
          verified: p.verified,
          rating: p.rating,
          ratingCount: p.ratingCount,
          hostRate: p.hostRate,
          location: p.locationLatitude && p.locationLongitude
            ? { latitude: parseFloat(p.locationLatitude), longitude: parseFloat(p.locationLongitude) }
            : null,
        })),
      });
    } catch (error) {
      console.error("Error getting filtered profiles:", error);
      res.status(500).json({ error: "Failed to get profiles" });
    }
  });

  // ==================== PUSH NOTIFICATION ROUTES ====================

  // Register push token
  app.post("/api/push-tokens", async (req: Request, res: Response) => {
    try {
      const { userId, token, platform } = req.body;

      if (!userId || !token || !platform) {
        return res.status(400).json({ error: "userId, token, and platform are required" });
      }

      const savedToken = await storage.savePushToken({ userId, token, platform });
      res.json({ success: true, token: savedToken });
    } catch (error) {
      console.error("Error saving push token:", error);
      res.status(500).json({ error: "Failed to save push token" });
    }
  });

  // Delete push token (logout)
  app.delete("/api/push-tokens/:token", async (req: Request, res: Response) => {
    try {
      const { token } = req.params;

      await storage.deletePushToken(token);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting push token:", error);
      res.status(500).json({ error: "Failed to delete push token" });
    }
  });

  // ==================== TYPING STATUS ROUTES ====================

  // Update typing status
  app.post("/api/matches/:matchId/typing", async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const { userId, isTyping } = req.body;

      if (!userId || isTyping === undefined) {
        return res.status(400).json({ error: "userId and isTyping are required" });
      }

      const status = await storage.updateTypingStatus(matchId, userId, isTyping);
      res.json({ success: true, status });
    } catch (error) {
      console.error("Error updating typing status:", error);
      res.status(500).json({ error: "Failed to update typing status" });
    }
  });

  // Get typing status for a match
  app.get("/api/matches/:matchId/typing", async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;

      const statuses = await storage.getTypingStatus(matchId);
      res.json({ typingStatuses: statuses });
    } catch (error) {
      console.error("Error getting typing status:", error);
      res.status(500).json({ error: "Failed to get typing status" });
    }
  });

  // Mark messages as read with timestamp
  app.post("/api/messages/:matchId/read", async (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }

      await storage.markMessagesAsReadWithTimestamp(matchId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });

  // ==================== DARK MODE ROUTE ====================

  // Toggle dark mode
  app.patch("/api/users/:userId/dark-mode", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { darkMode } = req.body;

      const updated = await storage.updateUser(userId, { darkMode: !!darkMode });
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ success: true, darkMode: updated.darkMode });
    } catch (error) {
      console.error("Error updating dark mode:", error);
      res.status(500).json({ error: "Failed to update dark mode setting" });
    }
  });

  // ==================== PROFILE PREVIEW ROUTE ====================

  // Get profile preview (how others see your profile)
  app.get("/api/users/:userId/preview", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Return profile data as others would see it
      res.json({
        profile: {
          id: user.id,
          name: user.name,
          age: user.age,
          bio: user.bio,
          photos: user.photos,
          coffeePreferences: user.coffeePreferences,
          interests: user.interests,
          availability: user.availability,
          role: user.role,
          verified: user.verified,
          rating: user.rating,
          ratingCount: user.ratingCount,
          hostRate: user.hostRate,
        },
      });
    } catch (error) {
      console.error("Error getting profile preview:", error);
      res.status(500).json({ error: "Failed to get profile preview" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
