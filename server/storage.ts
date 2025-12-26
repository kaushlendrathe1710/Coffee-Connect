import { 
  users, 
  otpCodes, 
  swipes, 
  matches, 
  messages,
  coffeeDates,
  walletTransactions,
  blockedUsers,
  userReports,
  reviews,
  pushTokens,
  typingStatus,
  userFilters,
  type User, 
  type InsertUser, 
  type OtpCode, 
  type InsertOtp,
  type Swipe,
  type InsertSwipe,
  type Match,
  type InsertMatch,
  type Message,
  type InsertMessage,
  type CoffeeDate,
  type InsertCoffeeDate,
  type WalletTransaction,
  type InsertWalletTransaction,
  type BlockedUser,
  type InsertBlockedUser,
  type UserReport,
  type InsertUserReport,
  type Review,
  type InsertReview,
  type PushToken,
  type InsertPushToken,
  type TypingStatus,
  type UserFilters,
  type InsertUserFilters
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt, lt, or, ne, notInArray, desc, asc, sql, gte, inArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  createOtp(otp: InsertOtp): Promise<OtpCode>;
  getValidOtp(email: string, code: string): Promise<OtpCode | undefined>;
  markOtpUsed(id: string): Promise<void>;
  deleteExpiredOtps(): Promise<void>;

  // Swipes
  createSwipe(swipe: { swiperId: string; swipedId: string; direction: 'like' | 'pass' }): Promise<Swipe>;
  getSwipe(swiperId: string, swipedId: string): Promise<Swipe | undefined>;
  hasSwipedOnUser(swiperId: string, swipedId: string): Promise<boolean>;

  // Matches
  createMatch(match: InsertMatch): Promise<Match>;
  getMatch(id: string): Promise<Match | undefined>;
  getMatchBetweenUsers(user1Id: string, user2Id: string): Promise<Match | undefined>;
  getMatchesForUser(userId: string): Promise<Match[]>;
  updateMatch(id: string, updates: Partial<Match>): Promise<Match | undefined>;

  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesForMatch(matchId: string): Promise<Message[]>;
  markMessagesAsRead(matchId: string, userId: string): Promise<void>;
  getUnreadCount(matchId: string, userId: string): Promise<number>;

  // Discovery
  getDiscoverableProfiles(userId: string, role: 'host' | 'guest'): Promise<User[]>;

  // Coffee Dates
  createCoffeeDate(date: InsertCoffeeDate): Promise<CoffeeDate>;
  getCoffeeDate(id: string): Promise<CoffeeDate | undefined>;
  getCoffeeDatesForUser(userId: string): Promise<CoffeeDate[]>;
  getUpcomingCoffeeDatesForUser(userId: string): Promise<CoffeeDate[]>;
  getCoffeeDatesForMatch(matchId: string): Promise<CoffeeDate[]>;
  updateCoffeeDate(id: string, updates: Partial<CoffeeDate>): Promise<CoffeeDate | undefined>;

  // Wallet
  getWalletBalance(userId: string): Promise<number>;
  updateWalletBalance(userId: string, newBalance: number): Promise<User | undefined>;
  createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction>;
  getWalletTransactions(userId: string): Promise<WalletTransaction[]>;
  getAffordableHosts(userId: string, walletBalance: number): Promise<User[]>;

  // Block/Report
  blockUser(blockerId: string, blockedId: string): Promise<BlockedUser>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  getBlockedUsers(userId: string): Promise<BlockedUser[]>;
  isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
  createReport(report: InsertUserReport): Promise<UserReport>;
  getReportsForUser(userId: string): Promise<UserReport[]>;
  getAllReports(): Promise<UserReport[]>;
  updateReport(id: string, updates: Partial<UserReport>): Promise<UserReport | undefined>;

  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getReviewsForUser(userId: string): Promise<Review[]>;
  getReviewForDate(coffeeDateId: string, reviewerId: string): Promise<Review | undefined>;
  updateUserRating(userId: string): Promise<void>;

  // Push Notifications
  savePushToken(token: InsertPushToken): Promise<PushToken>;
  getPushTokensForUser(userId: string): Promise<PushToken[]>;
  deletePushToken(token: string): Promise<void>;

  // Typing Status
  updateTypingStatus(matchId: string, userId: string, isTyping: boolean): Promise<TypingStatus>;
  getTypingStatus(matchId: string): Promise<TypingStatus[]>;

  // User Filters
  getUserFilters(userId: string): Promise<UserFilters | undefined>;
  saveUserFilters(filters: InsertUserFilters): Promise<UserFilters>;
  updateUserFilters(userId: string, updates: Partial<UserFilters>): Promise<UserFilters | undefined>;

  // Discovery with filters
  getFilteredProfiles(userId: string, userRole: 'host' | 'guest', filters?: UserFilters): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ email: insertUser.email.toLowerCase() })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async createOtp(otp: InsertOtp): Promise<OtpCode> {
    const [otpCode] = await db
      .insert(otpCodes)
      .values({ ...otp, email: otp.email.toLowerCase() })
      .returning();
    return otpCode;
  }

  async getValidOtp(email: string, code: string): Promise<OtpCode | undefined> {
    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.email, email.toLowerCase()),
          eq(otpCodes.code, code),
          eq(otpCodes.used, false),
          gt(otpCodes.expiresAt, new Date())
        )
      );
    return otp || undefined;
  }

  async markOtpUsed(id: string): Promise<void> {
    await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, id));
  }

  async deleteExpiredOtps(): Promise<void> {
    await db.delete(otpCodes).where(lt(otpCodes.expiresAt, new Date()));
  }

  // Swipe methods
  async createSwipe(swipe: { swiperId: string; swipedId: string; direction: 'like' | 'pass' }): Promise<Swipe> {
    const [newSwipe] = await db
      .insert(swipes)
      .values(swipe)
      .returning();
    return newSwipe;
  }

  async getSwipe(swiperId: string, swipedId: string): Promise<Swipe | undefined> {
    const [swipe] = await db
      .select()
      .from(swipes)
      .where(
        and(
          eq(swipes.swiperId, swiperId),
          eq(swipes.swipedId, swipedId)
        )
      );
    return swipe || undefined;
  }

  async hasSwipedOnUser(swiperId: string, swipedId: string): Promise<boolean> {
    const swipe = await this.getSwipe(swiperId, swipedId);
    return !!swipe;
  }

  // Match methods
  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db
      .insert(matches)
      .values(match)
      .returning();
    return newMatch;
  }

  async getMatch(id: string): Promise<Match | undefined> {
    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, id));
    return match || undefined;
  }

  async getMatchBetweenUsers(user1Id: string, user2Id: string): Promise<Match | undefined> {
    const [match] = await db
      .select()
      .from(matches)
      .where(
        or(
          and(eq(matches.user1Id, user1Id), eq(matches.user2Id, user2Id)),
          and(eq(matches.user1Id, user2Id), eq(matches.user2Id, user1Id))
        )
      );
    return match || undefined;
  }

  async getMatchesForUser(userId: string): Promise<Match[]> {
    return await db
      .select()
      .from(matches)
      .where(
        and(
          or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)),
          eq(matches.status, 'active')
        )
      )
      .orderBy(desc(matches.createdAt));
  }

  async updateMatch(id: string, updates: Partial<Match>): Promise<Match | undefined> {
    const [match] = await db
      .update(matches)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(matches.id, id))
      .returning();
    return match || undefined;
  }

  // Message methods
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getMessagesForMatch(matchId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.matchId, matchId))
      .orderBy(asc(messages.createdAt));
  }

  async markMessagesAsRead(matchId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(
        and(
          eq(messages.matchId, matchId),
          ne(messages.senderId, userId),
          eq(messages.read, false)
        )
      );
  }

  async getUnreadCount(matchId: string, userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(
        and(
          eq(messages.matchId, matchId),
          ne(messages.senderId, userId),
          eq(messages.read, false)
        )
      );
    return result[0]?.count || 0;
  }

  // Discovery - get profiles the user can swipe on
  async getDiscoverableProfiles(userId: string, userRole: 'host' | 'guest'): Promise<User[]> {
    // Get IDs of users already swiped on
    const swipedUsers = await db
      .select({ swipedId: swipes.swipedId })
      .from(swipes)
      .where(eq(swipes.swiperId, userId));

    const swipedIds = swipedUsers.map(s => s.swipedId);
    
    // Guests see Hosts, Hosts see Guests
    const targetRole = userRole === 'guest' ? 'host' : 'guest';

    // Build the query
    let query = db
      .select()
      .from(users)
      .where(
        and(
          ne(users.id, userId),
          eq(users.role, targetRole),
          eq(users.onboardingCompleted, true),
          swipedIds.length > 0 ? notInArray(users.id, swipedIds) : undefined
        )
      )
      .limit(20);

    return await query;
  }

  // Coffee Date methods
  async createCoffeeDate(date: InsertCoffeeDate): Promise<CoffeeDate> {
    const [newDate] = await db
      .insert(coffeeDates)
      .values(date)
      .returning();
    return newDate;
  }

  async getCoffeeDate(id: string): Promise<CoffeeDate | undefined> {
    const [date] = await db
      .select()
      .from(coffeeDates)
      .where(eq(coffeeDates.id, id));
    return date || undefined;
  }

  async getCoffeeDatesForUser(userId: string): Promise<CoffeeDate[]> {
    return await db
      .select()
      .from(coffeeDates)
      .where(
        or(
          eq(coffeeDates.guestId, userId),
          eq(coffeeDates.hostId, userId)
        )
      )
      .orderBy(desc(coffeeDates.scheduledDate));
  }

  async getUpcomingCoffeeDatesForUser(userId: string): Promise<CoffeeDate[]> {
    const now = new Date();
    return await db
      .select()
      .from(coffeeDates)
      .where(
        and(
          or(
            eq(coffeeDates.guestId, userId),
            eq(coffeeDates.hostId, userId)
          ),
          gte(coffeeDates.scheduledDate, now),
          or(
            eq(coffeeDates.status, 'proposed'),
            eq(coffeeDates.status, 'accepted'),
            eq(coffeeDates.status, 'confirmed')
          )
        )
      )
      .orderBy(asc(coffeeDates.scheduledDate));
  }

  async getCoffeeDatesForMatch(matchId: string): Promise<CoffeeDate[]> {
    return await db
      .select()
      .from(coffeeDates)
      .where(eq(coffeeDates.matchId, matchId))
      .orderBy(desc(coffeeDates.createdAt));
  }

  async updateCoffeeDate(id: string, updates: Partial<CoffeeDate>): Promise<CoffeeDate | undefined> {
    const [date] = await db
      .update(coffeeDates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(coffeeDates.id, id))
      .returning();
    return date || undefined;
  }

  // Wallet methods
  async getWalletBalance(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    return user?.walletBalance || 0;
  }

  async updateWalletBalance(userId: string, newBalance: number): Promise<User | undefined> {
    return await this.updateUser(userId, { walletBalance: newBalance });
  }

  async createWalletTransaction(transaction: InsertWalletTransaction): Promise<WalletTransaction> {
    const [newTransaction] = await db
      .insert(walletTransactions)
      .values({
        userId: transaction.userId,
        amount: transaction.amount,
        type: transaction.type as 'credit' | 'debit',
        source: transaction.source as 'stripe' | 'date_fee' | 'refund' | 'adjustment',
        description: transaction.description ?? undefined,
        relatedDateId: transaction.relatedDateId ?? undefined,
        stripeSessionId: transaction.stripeSessionId ?? undefined,
      })
      .returning();
    return newTransaction;
  }

  async getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
    return await db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt));
  }

  async getAffordableHosts(userId: string, walletBalance: number): Promise<User[]> {
    // Get IDs of users already swiped on
    const swipedUsers = await db
      .select({ swipedId: swipes.swipedId })
      .from(swipes)
      .where(eq(swipes.swiperId, userId));

    const swipedIds = swipedUsers.map(s => s.swipedId);

    // Get hosts whose rate is <= wallet balance (or have no rate set)
    let query = db
      .select()
      .from(users)
      .where(
        and(
          ne(users.id, userId),
          eq(users.role, 'host'),
          eq(users.onboardingCompleted, true),
          or(
            sql`${users.hostRate} IS NULL`,
            sql`${users.hostRate} <= ${walletBalance}`
          ),
          swipedIds.length > 0 ? notInArray(users.id, swipedIds) : undefined
        )
      )
      .limit(20);

    return await query;
  }

  // ==================== ADMIN METHODS ====================

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllMatches(): Promise<Match[]> {
    return await db.select().from(matches).orderBy(desc(matches.createdAt));
  }

  async getAllCoffeeDates(): Promise<CoffeeDate[]> {
    return await db.select().from(coffeeDates).orderBy(desc(coffeeDates.createdAt));
  }

  async getAllWalletTransactions(): Promise<WalletTransaction[]> {
    return await db.select().from(walletTransactions).orderBy(desc(walletTransactions.createdAt));
  }

  async getAllMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  async deleteUser(id: string): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user || user.isProtected) {
      return false;
    }
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getProtectedAdmin(email: string): Promise<User | undefined> {
    const [admin] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.email, email.toLowerCase()),
          eq(users.role, 'admin'),
          eq(users.isProtected, true)
        )
      );
    return admin || undefined;
  }

  async createOrGetProtectedAdmin(email: string, name: string): Promise<User> {
    const existing = await this.getUserByEmail(email);
    if (existing) {
      // Update to admin if not already
      if (existing.role !== 'admin' || !existing.isProtected) {
        const [updated] = await db
          .update(users)
          .set({ 
            role: 'admin', 
            isProtected: true, 
            name: name,
            onboardingCompleted: true,
            verified: true,
            updatedAt: new Date() 
          })
          .where(eq(users.id, existing.id))
          .returning();
        return updated;
      }
      return existing;
    }
    
    // Create new admin
    const [admin] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        name: name,
        role: 'admin',
        isProtected: true,
        onboardingCompleted: true,
        verified: true,
      })
      .returning();
    return admin;
  }

  async getPlatformStats(): Promise<{
    totalUsers: number;
    totalHosts: number;
    totalGuests: number;
    totalAdmins: number;
    totalMatches: number;
    totalDates: number;
    totalMessages: number;
    totalRevenue: number;
  }> {
    const allUsers = await db.select().from(users);
    const allMatches = await db.select().from(matches);
    const allDates = await db.select().from(coffeeDates);
    const allMessages = await db.select().from(messages);
    const allTransactions = await db.select().from(walletTransactions);

    const totalRevenue = allTransactions
      .filter(t => t.type === 'debit' && t.source === 'date_fee')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalUsers: allUsers.length,
      totalHosts: allUsers.filter(u => u.role === 'host').length,
      totalGuests: allUsers.filter(u => u.role === 'guest').length,
      totalAdmins: allUsers.filter(u => u.role === 'admin').length,
      totalMatches: allMatches.length,
      totalDates: allDates.length,
      totalMessages: allMessages.length,
      totalRevenue,
    };
  }

  // ==================== BLOCK/REPORT METHODS ====================

  async blockUser(blockerId: string, blockedId: string): Promise<BlockedUser> {
    const [blocked] = await db
      .insert(blockedUsers)
      .values({ blockerId, blockedId })
      .returning();
    
    // Also update any matches to blocked status
    await db
      .update(matches)
      .set({ status: 'blocked', updatedAt: new Date() })
      .where(
        or(
          and(eq(matches.user1Id, blockerId), eq(matches.user2Id, blockedId)),
          and(eq(matches.user1Id, blockedId), eq(matches.user2Id, blockerId))
        )
      );
    
    return blocked;
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await db
      .delete(blockedUsers)
      .where(
        and(
          eq(blockedUsers.blockerId, blockerId),
          eq(blockedUsers.blockedId, blockedId)
        )
      );
  }

  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    return await db
      .select()
      .from(blockedUsers)
      .where(eq(blockedUsers.blockerId, userId))
      .orderBy(desc(blockedUsers.createdAt));
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const [blocked] = await db
      .select()
      .from(blockedUsers)
      .where(
        and(
          eq(blockedUsers.blockerId, blockerId),
          eq(blockedUsers.blockedId, blockedId)
        )
      );
    return !!blocked;
  }

  async createReport(report: InsertUserReport): Promise<UserReport> {
    const [newReport] = await db
      .insert(userReports)
      .values({
        reporterId: report.reporterId,
        reportedId: report.reportedId,
        reason: report.reason as 'inappropriate' | 'harassment' | 'fake_profile' | 'spam' | 'other',
        description: report.description ?? undefined,
      })
      .returning();
    return newReport;
  }

  async getReportsForUser(userId: string): Promise<UserReport[]> {
    return await db
      .select()
      .from(userReports)
      .where(eq(userReports.reportedId, userId))
      .orderBy(desc(userReports.createdAt));
  }

  async getAllReports(): Promise<UserReport[]> {
    return await db
      .select()
      .from(userReports)
      .orderBy(desc(userReports.createdAt));
  }

  async updateReport(id: string, updates: Partial<UserReport>): Promise<UserReport | undefined> {
    const [report] = await db
      .update(userReports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userReports.id, id))
      .returning();
    return report || undefined;
  }

  // ==================== REVIEW METHODS ====================

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values({
        coffeeDateId: review.coffeeDateId,
        reviewerId: review.reviewerId,
        reviewedId: review.reviewedId,
        rating: review.rating,
        comment: review.comment ?? undefined,
      })
      .returning();
    
    // Update the user's average rating
    await this.updateUserRating(review.reviewedId);
    
    return newReview;
  }

  async getReviewsForUser(userId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.reviewedId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  async getReviewForDate(coffeeDateId: string, reviewerId: string): Promise<Review | undefined> {
    const [review] = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.coffeeDateId, coffeeDateId),
          eq(reviews.reviewerId, reviewerId)
        )
      );
    return review || undefined;
  }

  async updateUserRating(userId: string): Promise<void> {
    const userReviews = await this.getReviewsForUser(userId);
    if (userReviews.length === 0) return;
    
    const totalRating = userReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / userReviews.length;
    
    await db
      .update(users)
      .set({ 
        rating: avgRating, 
        ratingCount: userReviews.length,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  // ==================== PUSH NOTIFICATION METHODS ====================

  async savePushToken(token: InsertPushToken): Promise<PushToken> {
    // Upsert - update if exists, insert if not
    const existing = await db
      .select()
      .from(pushTokens)
      .where(
        and(
          eq(pushTokens.userId, token.userId),
          eq(pushTokens.token, token.token)
        )
      );
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(pushTokens)
        .set({ updatedAt: new Date() })
        .where(eq(pushTokens.id, existing[0].id))
        .returning();
      return updated;
    }
    
    const [newToken] = await db
      .insert(pushTokens)
      .values({
        userId: token.userId,
        token: token.token,
        platform: token.platform as 'ios' | 'android' | 'web',
      })
      .returning();
    return newToken;
  }

  async getPushTokensForUser(userId: string): Promise<PushToken[]> {
    return await db
      .select()
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));
  }

  async deletePushToken(token: string): Promise<void> {
    await db.delete(pushTokens).where(eq(pushTokens.token, token));
  }

  // ==================== TYPING STATUS METHODS ====================

  async updateTypingStatus(matchId: string, userId: string, isTyping: boolean): Promise<TypingStatus> {
    const existing = await db
      .select()
      .from(typingStatus)
      .where(
        and(
          eq(typingStatus.matchId, matchId),
          eq(typingStatus.userId, userId)
        )
      );
    
    if (existing.length > 0) {
      const [updated] = await db
        .update(typingStatus)
        .set({ isTyping, updatedAt: new Date() })
        .where(eq(typingStatus.id, existing[0].id))
        .returning();
      return updated;
    }
    
    const [newStatus] = await db
      .insert(typingStatus)
      .values({ matchId, userId, isTyping })
      .returning();
    return newStatus;
  }

  async getTypingStatus(matchId: string): Promise<TypingStatus[]> {
    return await db
      .select()
      .from(typingStatus)
      .where(eq(typingStatus.matchId, matchId));
  }

  // ==================== USER FILTERS METHODS ====================

  async getUserFilters(userId: string): Promise<UserFilters | undefined> {
    const [filters] = await db
      .select()
      .from(userFilters)
      .where(eq(userFilters.userId, userId));
    return filters || undefined;
  }

  async saveUserFilters(filters: InsertUserFilters): Promise<UserFilters> {
    const existing = await this.getUserFilters(filters.userId);
    
    if (existing) {
      return await this.updateUserFilters(filters.userId, filters) as UserFilters;
    }
    
    const [newFilters] = await db
      .insert(userFilters)
      .values({
        userId: filters.userId,
        minAge: filters.minAge ?? 18,
        maxAge: filters.maxAge ?? 99,
        maxDistance: filters.maxDistance ?? 50,
        interests: filters.interests ?? [],
        availabilityDays: filters.availabilityDays ?? [],
      })
      .returning();
    return newFilters;
  }

  async updateUserFilters(userId: string, updates: Partial<UserFilters>): Promise<UserFilters | undefined> {
    const [filters] = await db
      .update(userFilters)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userFilters.userId, userId))
      .returning();
    return filters || undefined;
  }

  // ==================== FILTERED DISCOVERY ====================

  async getFilteredProfiles(userId: string, userRole: 'host' | 'guest', filters?: UserFilters): Promise<User[]> {
    // Get IDs of users already swiped on
    const swipedUsers = await db
      .select({ swipedId: swipes.swipedId })
      .from(swipes)
      .where(eq(swipes.swiperId, userId));

    const swipedIds = swipedUsers.map(s => s.swipedId);
    
    // Get blocked user IDs
    const blockedByMe = await db
      .select({ blockedId: blockedUsers.blockedId })
      .from(blockedUsers)
      .where(eq(blockedUsers.blockerId, userId));
    
    const blockedMe = await db
      .select({ blockerId: blockedUsers.blockerId })
      .from(blockedUsers)
      .where(eq(blockedUsers.blockedId, userId));
    
    const blockedIds = [
      ...blockedByMe.map(b => b.blockedId),
      ...blockedMe.map(b => b.blockerId)
    ];
    
    const excludeIds = [...swipedIds, ...blockedIds, userId];
    
    // Guests see Hosts, Hosts see Guests
    const targetRole = userRole === 'guest' ? 'host' : 'guest';

    // Build the query with filters
    let query = db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, targetRole),
          eq(users.onboardingCompleted, true),
          excludeIds.length > 0 ? notInArray(users.id, excludeIds) : undefined,
          // Age filters
          filters?.minAge ? gte(sql`CAST(${users.age} AS INTEGER)`, filters.minAge) : undefined,
          filters?.maxAge ? sql`CAST(${users.age} AS INTEGER) <= ${filters.maxAge}` : undefined
        )
      )
      .limit(20);

    return await query;
  }

  // Mark messages as read with timestamp
  async markMessagesAsReadWithTimestamp(matchId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ read: true, readAt: new Date() })
      .where(
        and(
          eq(messages.matchId, matchId),
          ne(messages.senderId, userId),
          eq(messages.read, false)
        )
      );
  }
}

export const storage = new DatabaseStorage();
