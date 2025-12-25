import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { sendOTPEmail, generateOTP } from "./services/email";

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
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt,
        },
        isNewUser: !user.onboardingCompleted,
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
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt,
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
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
