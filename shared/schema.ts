import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core";
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
  role: text("role").$type<'host' | 'guest'>(),
  locationLatitude: text("location_latitude"),
  locationLongitude: text("location_longitude"),
  verified: boolean("verified").default(false),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  stripeCustomerId: text("stripe_customer_id"),
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
