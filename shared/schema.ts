import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  age: text("age"),
  gender: text("gender"),
  bio: text("bio"),
  photos: jsonb("photos").$type<string[]>().default([]),
  coffeePreferences: jsonb("coffee_preferences").$type<string[]>().default([]),
  interests: jsonb("interests").$type<string[]>().default([]),
  availability: jsonb("availability").$type<{ day: string; time: string }[]>().default([]),
  role: text("role").$type<'host' | 'guest' | 'admin'>(),
  locationLatitude: text("location_latitude"),
  locationLongitude: text("location_longitude"),
  verified: boolean("verified").default(false),
  verificationPhoto: text("verification_photo"),
  verificationStatus: text("verification_status").$type<'none' | 'pending' | 'approved' | 'rejected'>().default('none'),
  verificationRejectedReason: text("verification_rejected_reason"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  isProtected: boolean("is_protected").default(false),
  stripeCustomerId: text("stripe_customer_id"),
  walletBalance: integer("wallet_balance").default(0),
  hostRate: integer("host_rate"),
  rating: real("rating"),
  ratingCount: integer("rating_count").default(0),
  darkMode: boolean("dark_mode").default(false),
  pushToken: text("push_token"),
  notificationsEnabled: boolean("notifications_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const otpCodes = pgTable("otp_codes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Swipes table - tracks who swiped on whom
export const swipes = pgTable("swipes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  swiperId: varchar("swiper_id").notNull().references(() => users.id),
  swipedId: varchar("swiped_id").notNull().references(() => users.id),
  direction: text("direction").$type<'like' | 'pass'>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Matches table - created when two users mutually like each other
export const matches = pgTable("matches", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull().references(() => users.id),
  user2Id: varchar("user2_id").notNull().references(() => users.id),
  status: text("status").$type<'active' | 'unmatched' | 'blocked'>().default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table - chat messages between matched users
export const messages = pgTable("messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull().references(() => matches.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wallet transactions table - tracks all wallet credits and debits
export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  type: text("type").$type<'credit' | 'debit'>().notNull(),
  source: text("source").$type<'stripe' | 'date_fee' | 'refund' | 'adjustment'>().notNull(),
  description: text("description"),
  relatedDateId: varchar("related_date_id"),
  stripeSessionId: text("stripe_session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Coffee dates table - scheduled coffee dates between matched users
export const coffeeDates = pgTable("coffee_dates", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull().references(() => matches.id),
  proposedBy: varchar("proposed_by").notNull().references(() => users.id),
  guestId: varchar("guest_id").notNull().references(() => users.id),
  hostId: varchar("host_id").notNull().references(() => users.id),
  scheduledDate: timestamp("scheduled_date").notNull(),
  cafeName: text("cafe_name"),
  cafeAddress: text("cafe_address"),
  cafeLatitude: text("cafe_latitude"),
  cafeLongitude: text("cafe_longitude"),
  status: text("status").$type<'proposed' | 'accepted' | 'declined' | 'confirmed' | 'completed' | 'cancelled'>().default('proposed'),
  guestConfirmed: boolean("guest_confirmed").default(false),
  hostConfirmed: boolean("host_confirmed").default(false),
  paymentStatus: text("payment_status").$type<'pending' | 'paid' | 'refunded'>().default('pending'),
  paymentAmount: integer("payment_amount"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSessionId: text("stripe_session_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
  role: true,
});

export const insertOtpSchema = createInsertSchema(otpCodes).pick({
  email: true,
  code: true,
  expiresAt: true,
});

export const insertSwipeSchema = createInsertSchema(swipes).pick({
  swiperId: true,
  swipedId: true,
  direction: true,
});

export const insertMatchSchema = createInsertSchema(matches).pick({
  user1Id: true,
  user2Id: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  matchId: true,
  senderId: true,
  content: true,
});

export const insertCoffeeDateSchema = createInsertSchema(coffeeDates).pick({
  matchId: true,
  proposedBy: true,
  guestId: true,
  hostId: true,
  scheduledDate: true,
  cafeName: true,
  cafeAddress: true,
  cafeLatitude: true,
  cafeLongitude: true,
  notes: true,
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).pick({
  userId: true,
  amount: true,
  type: true,
  source: true,
  description: true,
  relatedDateId: true,
  stripeSessionId: true,
});

// Blocked users table - tracks who blocked whom
export const blockedUsers = pgTable("blocked_users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  blockerId: varchar("blocker_id").notNull().references(() => users.id),
  blockedId: varchar("blocked_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// User reports table - stores user reports for moderation
export const userReports = pgTable("user_reports", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull().references(() => users.id),
  reportedId: varchar("reported_id").notNull().references(() => users.id),
  reason: text("reason").$type<'inappropriate' | 'harassment' | 'fake_profile' | 'spam' | 'other'>().notNull(),
  description: text("description"),
  status: text("status").$type<'pending' | 'reviewed' | 'resolved' | 'dismissed'>().default('pending'),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reviews table - host ratings after coffee dates
export const reviews = pgTable("reviews", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  coffeeDateId: varchar("coffee_date_id").notNull().references(() => coffeeDates.id),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id),
  reviewedId: varchar("reviewed_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Push tokens table - stores device push notification tokens
export const pushTokens = pgTable("push_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull(),
  platform: text("platform").$type<'ios' | 'android' | 'web'>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Typing status table - tracks who is currently typing
export const typingStatus = pgTable("typing_status", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull().references(() => matches.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  isTyping: boolean("is_typing").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Verification requests table - tracks verification submissions
export const verificationRequests = pgTable("verification_requests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  selfiePhoto: text("selfie_photo").notNull(),
  status: text("status").$type<'pending' | 'approved' | 'rejected'>().default('pending'),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  rejectedReason: text("rejected_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// User filters table - stores discovery preferences
export const userFilters = pgTable("user_filters", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  minAge: integer("min_age").default(18),
  maxAge: integer("max_age").default(99),
  maxDistance: integer("max_distance").default(50),
  interests: jsonb("interests").$type<string[]>().default([]),
  availabilityDays: jsonb("availability_days").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBlockedUserSchema = createInsertSchema(blockedUsers).pick({
  blockerId: true,
  blockedId: true,
});

export const insertUserReportSchema = createInsertSchema(userReports).pick({
  reporterId: true,
  reportedId: true,
  reason: true,
  description: true,
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  coffeeDateId: true,
  reviewerId: true,
  reviewedId: true,
  rating: true,
  comment: true,
});

export const insertPushTokenSchema = createInsertSchema(pushTokens).pick({
  userId: true,
  token: true,
  platform: true,
});

export const insertUserFiltersSchema = createInsertSchema(userFilters).pick({
  userId: true,
  minAge: true,
  maxAge: true,
  maxDistance: true,
  interests: true,
  availabilityDays: true,
});

export const insertVerificationRequestSchema = createInsertSchema(verificationRequests).pick({
  userId: true,
  selfiePhoto: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertSwipe = z.infer<typeof insertSwipeSchema>;
export type Swipe = typeof swipes.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertCoffeeDate = z.infer<typeof insertCoffeeDateSchema>;
export type CoffeeDate = typeof coffeeDates.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type BlockedUser = typeof blockedUsers.$inferSelect;
export type InsertBlockedUser = z.infer<typeof insertBlockedUserSchema>;
export type UserReport = typeof userReports.$inferSelect;
export type InsertUserReport = z.infer<typeof insertUserReportSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = z.infer<typeof insertPushTokenSchema>;
export type TypingStatus = typeof typingStatus.$inferSelect;
export type UserFilters = typeof userFilters.$inferSelect;
export type InsertUserFilters = z.infer<typeof insertUserFiltersSchema>;
export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type InsertVerificationRequest = z.infer<typeof insertVerificationRequestSchema>;
