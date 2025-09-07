import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for independent auth system
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isPublicProfile: boolean("is_public_profile").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  isSuspended: boolean("is_suspended").notNull().default(false),
  suspensionReason: text("suspension_reason"),
  plan: varchar("plan").notNull().default('free'), // 'free' | 'plus' | 'pro'
  // User preferences for initial setup
  preferredTradeInput: varchar("preferred_trade_input").default('modal'), // 'modal' | 'carousel'
  defaultTradeVisibility: varchar("default_trade_visibility").default('private'), // 'public' | 'private'
  preferredTheme: varchar("preferred_theme").default('system'), // 'light' | 'dark' | 'system'
  hasCompletedOnboarding: boolean("has_completed_onboarding").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trading accounts
export const tradingAccounts = pgTable("trading_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  accountType: varchar("account_type").notNull(), // 'forex', 'crypto', 'futures', 'stocks', 'commodities', 'bonds', 'options', 'indices'
  initialCapital: decimal("initial_capital", { precision: 15, scale: 2 }).notNull(),
  currentCapital: decimal("current_capital", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency").notNull().default('USD'),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trading instruments
export const instruments = pgTable("instruments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: varchar("symbol").notNull().unique(),
  name: varchar("name").notNull(),
  tickValue: decimal("tick_value", { precision: 10, scale: 2 }).notNull(),
  tickSize: decimal("tick_size", { precision: 10, scale: 4 }).notNull(),
  multiplier: integer("multiplier").notNull().default(1),
  isCustom: boolean("is_custom").notNull().default(false), // Allow custom tickers
});

// Trades
export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accountId: varchar("account_id").references(() => tradingAccounts.id).notNull(),
  instrumentId: varchar("instrument_id").references(() => instruments.id),
  customInstrument: varchar("custom_instrument"), // For custom tickers like LMND
  direction: varchar("direction").notNull(), // 'long' | 'short'
  entryPrice: decimal("entry_price", { precision: 15, scale: 4 }),
  exitPrice: decimal("exit_price", { precision: 15, scale: 4 }),
  lotSize: integer("lot_size").notNull(),
  pnl: decimal("pnl", { precision: 18, scale: 2 }),
  customPnl: decimal("custom_pnl", { precision: 18, scale: 2 }), // Manual P&L entry
  tradeType: varchar("trade_type"), // 'scalp' | 'day' | 'swing'
  status: varchar("status").notNull().default('open'), // 'open' | 'closed'
  result: varchar("result"), // 'profit' | 'loss' | 'breakeven' - auto-calculated
  visibility: varchar("visibility").notNull().default('private'), // 'public' | 'private'
  notes: text("notes"),
  imageUrl: varchar("image_url"), // Trade screenshot
  entryTime: timestamp("entry_time").defaultNow(),
  exitTime: timestamp("exit_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Predefined emotions
export const emotions = pgTable("emotions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  icon: varchar("icon").notNull(), // Lucide icon name
  category: varchar("category").notNull(), // 'positive' | 'negative' | 'neutral'
  isDefault: boolean("is_default").notNull().default(true),
});

// User custom emotions
export const userEmotions = pgTable("user_emotions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  icon: varchar("icon").notNull(), // Lucide icon name
  category: varchar("category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Emotion logs
export const emotionLogs = pgTable("emotion_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  tradeId: varchar("trade_id").references(() => trades.id),
  emotionId: varchar("emotion_id").references(() => emotions.id),
  userEmotionId: varchar("user_emotion_id").references(() => userEmotions.id),
  notes: text("notes"),
  intensity: integer("intensity").default(5), // 1-10 scale
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table for admin dashboard
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // 'info', 'warning', 'error', 'success'
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  userId: varchar("user_id").references(() => users.id), // Optional - can be system-wide notifications
  createdAt: timestamp("created_at").defaultNow(),
});


// Relations
export const usersRelations = relations(users, ({ many }) => ({
  trades: many(trades),
  tradingAccounts: many(tradingAccounts),
  userEmotions: many(userEmotions),
  emotionLogs: many(emotionLogs),
  notifications: many(notifications),
}));

export const tradingAccountsRelations = relations(tradingAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [tradingAccounts.userId],
    references: [users.id],
  }),
  trades: many(trades),
}));

export const tradesRelations = relations(trades, ({ one, many }) => ({
  user: one(users, {
    fields: [trades.userId],
    references: [users.id],
  }),
  account: one(tradingAccounts, {
    fields: [trades.accountId],
    references: [tradingAccounts.id],
  }),
  instrument: one(instruments, {
    fields: [trades.instrumentId],
    references: [instruments.id],
  }),
  emotionLogs: many(emotionLogs),
}));

export const instrumentsRelations = relations(instruments, ({ many }) => ({
  trades: many(trades),
}));

export const emotionsRelations = relations(emotions, ({ many }) => ({
  emotionLogs: many(emotionLogs),
}));

export const userEmotionsRelations = relations(userEmotions, ({ one, many }) => ({
  user: one(users, {
    fields: [userEmotions.userId],
    references: [users.id],
  }),
  emotionLogs: many(emotionLogs),
}));

export const emotionLogsRelations = relations(emotionLogs, ({ one }) => ({
  user: one(users, {
    fields: [emotionLogs.userId],
    references: [users.id],
  }),
  trade: one(trades, {
    fields: [emotionLogs.tradeId],
    references: [trades.id],
  }),
  emotion: one(emotions, {
    fields: [emotionLogs.emotionId],
    references: [emotions.id],
  }),
  userEmotion: one(userEmotions, {
    fields: [emotionLogs.userEmotionId],
    references: [userEmotions.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Auth schemas
export const registerUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isPublicProfile: true,
}).extend({
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginUserSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertTradingAccountSchema = createInsertSchema(tradingAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentCapital: true,
});

export const insertInstrumentSchema = createInsertSchema(instruments).omit({
  id: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  createdAt: true,
  result: true,
}).extend({
  // Allow Date objects or strings for timestamps
  entryTime: z.union([z.date(), z.string()]).optional(),
  exitTime: z.union([z.date(), z.string()]).optional(),
  // Allow numbers or strings for price fields
  entryPrice: z.union([z.string(), z.number()]).optional().transform((val) => val?.toString()),
  exitPrice: z.union([z.string(), z.number()]).optional().transform((val) => val?.toString()),
  customPnl: z.union([z.string(), z.number()]).optional().transform((val) => val?.toString()),
  pnl: z.union([z.string(), z.number()]).optional().transform((val) => val?.toString()),
  // Flag to indicate if user wants manual P&L (disables auto-calculation)
  useManualPnl: z.boolean().optional(),
});

export const insertEmotionSchema = createInsertSchema(emotions).omit({
  id: true,
});

export const insertUserEmotionSchema = createInsertSchema(userEmotions).omit({
  id: true,
  createdAt: true,
});

export const insertEmotionLogSchema = createInsertSchema(emotionLogs).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});


// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

// User without sensitive data
export type SafeUser = Omit<User, 'password'>;
export type TradingAccount = typeof tradingAccounts.$inferSelect;
export type InsertTradingAccount = z.infer<typeof insertTradingAccountSchema>;
export type Instrument = typeof instruments.$inferSelect;
export type InsertInstrument = z.infer<typeof insertInstrumentSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Emotion = typeof emotions.$inferSelect;
export type InsertEmotion = z.infer<typeof insertEmotionSchema>;
export type UserEmotion = typeof userEmotions.$inferSelect;
export type InsertUserEmotion = z.infer<typeof insertUserEmotionSchema>;
export type EmotionLog = typeof emotionLogs.$inferSelect;
export type InsertEmotionLog = z.infer<typeof insertEmotionLogSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Extended types with relations
export type TradeWithRelations = Trade & {
  account: TradingAccount;
  instrument?: Instrument;
  emotionLogs?: (EmotionLog & {
    emotion?: Emotion;
    userEmotion?: UserEmotion;
  })[];
};

export type EmotionLogWithRelations = EmotionLog & {
  emotion?: Emotion;
  userEmotion?: UserEmotion;
  trade?: Trade;
};

export type AccountWithStats = TradingAccount & {
  totalTrades?: number;
  totalPnl?: number;
  winRate?: number;
};
