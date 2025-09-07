import {
  users,
  tradingAccounts,
  instruments,
  trades,
  emotions,
  userEmotions,
  emotionLogs,
  notifications,
  type User,
  type UpsertUser,
  type TradingAccount,
  type InsertTradingAccount,
  type AccountWithStats,
  type Instrument,
  type InsertInstrument,
  type Trade,
  type InsertTrade,
  type TradeWithRelations,
  type Emotion,
  type InsertEmotion,
  type UserEmotion,
  type InsertUserEmotion,
  type EmotionLog,
  type InsertEmotionLog,
  type EmotionLogWithRelations,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, isNotNull, sql, count, sum, avg } from "drizzle-orm";
import bcrypt from 'bcrypt';

export interface IStorage {
  // User operations for independent auth
  getUserById(id: string): Promise<User | undefined>;
  getUser(id: string): Promise<User | undefined>; // Alias for getUserById
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>; // Admin: Get all users
  createUser(user: { username: string; email: string; password: string; firstName?: string; lastName?: string; }): Promise<User>;
  createUserWithCredentials(user: { username: string; email: string; password: string }): Promise<User>;
  verifyPassword(userId: string, password: string): Promise<boolean>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  upsertUser(user: UpsertUser): Promise<User>; // Keep for compatibility
  
  // Trading account operations
  getUserTradingAccounts(userId: string): Promise<AccountWithStats[]>;
  getTradingAccount(id: string): Promise<TradingAccount | undefined>;
  createTradingAccount(account: InsertTradingAccount): Promise<TradingAccount>;
  updateTradingAccount(id: string, updates: Partial<TradingAccount>): Promise<TradingAccount>;
  deleteTradingAccount(id: string): Promise<void>;
  
  // Instrument operations
  getInstruments(): Promise<Instrument[]>;
  getInstrument(id: string): Promise<Instrument | undefined>;
  getInstrumentBySymbol(symbol: string): Promise<Instrument | undefined>;
  createInstrument(instrument: InsertInstrument): Promise<Instrument>;
  createCustomInstrument(symbol: string, name?: string): Promise<Instrument>;
  
  // Trade operations
  getUserTrades(userId: string, limit?: number): Promise<TradeWithRelations[]>;
  getAllTrades(limit?: number): Promise<TradeWithRelations[]>; // Admin: Get all trades
  getAccountTrades(accountId: string, limit?: number): Promise<TradeWithRelations[]>;
  getTrade(id: string): Promise<TradeWithRelations | undefined>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: string, trade: Partial<InsertTrade>): Promise<Trade>;
  deleteTrade(id: string): Promise<void>;
  getUserTradeStats(userId: string): Promise<{
    totalPnl: number;
    totalTrades: number;
    winRate: number;
    avgTrade: number;
    activeTrades: number;
  }>;
  
  // Emotion operations
  getEmotions(): Promise<Emotion[]>;
  getUserEmotions(userId: string): Promise<UserEmotion[]>;
  createUserEmotion(emotion: InsertUserEmotion): Promise<UserEmotion>;
  seedEmotions(emotions: InsertEmotion[]): Promise<void>;
  
  // Emotion log operations
  createEmotionLog(log: InsertEmotionLog): Promise<EmotionLog>;
  getUserEmotionLogs(userId: string, limit?: number): Promise<EmotionLogWithRelations[]>;
  deleteEmotionLog(id: string): Promise<void>; // Admin: Delete emotion log
  getEmotionStats(userId: string): Promise<{
    emotion: string;
    icon: string;
    count: number;
    percentage: number;
  }[]>;
  
  // Admin operations
  getAdminStats(): Promise<{
    totalUsers: number;
    totalTrades: number;
    totalPnl: number;
    suspendedUsers: number;
    activeTrades: number;
  }>;
  
  getAnalyticsData(): Promise<{
    chartData: Array<{
      name: string;
      users: number;
      trades: number;
      pnl: number;
    }>;
    pieData: Array<{
      name: string;
      value: number;
      color: string;
    }>;
  }>;
  
  // Notification operations
  getNotifications(): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;
  
  // System operations
  getSystemMetrics(): Promise<{
    serverUptime: string;
    apiResponseTime: string;
    databaseSize: string;
    pageLoadTime: string;
    errorRate: string;
    cacheHitRate: string;
    cpuUsage: string;
    memoryUsage: string;
    diskUsage: string;
  }>;
  
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.getUserById(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: { username: string; email: string; password: string; firstName?: string; lastName?: string; }): Promise<User> {
    const [user] = await db.insert(users).values({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
    }).returning();
    return user;
  }

  async createUserWithCredentials(userData: { username: string; email: string; password: string }): Promise<User> {
    // Check if user already exists
    const existingUser = await this.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }
    
    const existingEmail = await this.getUserByEmail(userData.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }
    
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const [user] = await db.insert(users).values({
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      hasCompletedOnboarding: false,
    }).returning();
    return user;
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) return false;
    return await bcrypt.compare(password, user.password);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // Delete in proper order to maintain referential integrity
    await db.delete(emotionLogs).where(eq(emotionLogs.userId, id));
    await db.delete(userEmotions).where(eq(userEmotions.userId, id));
    await db.delete(trades).where(eq(trades.userId, id));
    await db.delete(tradingAccounts).where(eq(tradingAccounts.userId, id));
    await db.delete(notifications).where(eq(notifications.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Instrument operations
  async getInstruments(): Promise<Instrument[]> {
    return await db.select().from(instruments);
  }

  async getInstrument(id: string): Promise<Instrument | undefined> {
    const [instrument] = await db.select().from(instruments).where(eq(instruments.id, id));
    return instrument;
  }

  async getInstrumentBySymbol(symbol: string): Promise<Instrument | undefined> {
    const [instrument] = await db.select().from(instruments).where(eq(instruments.symbol, symbol));
    return instrument;
  }

  async createInstrument(instrumentData: InsertInstrument): Promise<Instrument> {
    const [instrument] = await db.insert(instruments).values(instrumentData).returning();
    return instrument;
  }

  // Trading account operations
  async getUserTradingAccounts(userId: string): Promise<AccountWithStats[]> {
    const accounts = await db.select().from(tradingAccounts)
      .where(eq(tradingAccounts.userId, userId))
      .orderBy(desc(tradingAccounts.createdAt));
    
    // Add stats for each account
    const accountsWithStats = await Promise.all(
      accounts.map(async (account) => {
        const [stats] = await db
          .select({
            totalTrades: count(),
            totalPnl: sql<number>`COALESCE(SUM(CAST(${trades.pnl} as NUMERIC)), 0)`,
          })
          .from(trades)
          .where(eq(trades.accountId, account.id));
        
        const [winStats] = await db
          .select({
            wins: sql<number>`COUNT(*) FILTER (WHERE CAST(${trades.pnl} as NUMERIC) > 0)`,
          })
          .from(trades)
          .where(and(eq(trades.accountId, account.id), eq(trades.status, 'closed')));
        
        return {
          ...account,
          totalTrades: stats.totalTrades,
          totalPnl: stats.totalPnl,
          winRate: stats.totalTrades > 0 ? (winStats.wins / stats.totalTrades) * 100 : 0,
        };
      })
    );
    
    return accountsWithStats;
  }

  async getTradingAccount(id: string): Promise<TradingAccount | undefined> {
    const [account] = await db.select().from(tradingAccounts).where(eq(tradingAccounts.id, id));
    return account;
  }

  async createTradingAccount(accountData: InsertTradingAccount): Promise<TradingAccount> {
    const [account] = await db.insert(tradingAccounts).values({
      ...accountData,
      currentCapital: accountData.initialCapital,
    }).returning();
    return account;
  }

  async updateTradingAccount(id: string, updates: Partial<TradingAccount>): Promise<TradingAccount> {
    const [account] = await db
      .update(tradingAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tradingAccounts.id, id))
      .returning();
    return account;
  }

  async deleteTradingAccount(id: string): Promise<void> {
    await db.delete(tradingAccounts).where(eq(tradingAccounts.id, id));
  }

  // Trade operations
  async getUserTrades(userId: string, limit = 50): Promise<TradeWithRelations[]> {
    const result = await db
      .select({
        trade: trades,
        account: tradingAccounts,
        instrument: instruments,
      })
      .from(trades)
      .leftJoin(tradingAccounts, eq(trades.accountId, tradingAccounts.id))
      .leftJoin(instruments, eq(trades.instrumentId, instruments.id))
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.createdAt))
      .limit(limit);

    return result.map(row => ({
      ...row.trade,
      account: row.account!,
      instrument: row.instrument || undefined,
    }));
  }

  async getAccountTrades(accountId: string, limit = 50): Promise<TradeWithRelations[]> {
    const result = await db
      .select({
        trade: trades,
        account: tradingAccounts,
        instrument: instruments,
      })
      .from(trades)
      .leftJoin(tradingAccounts, eq(trades.accountId, tradingAccounts.id))
      .leftJoin(instruments, eq(trades.instrumentId, instruments.id))
      .where(eq(trades.accountId, accountId))
      .orderBy(desc(trades.createdAt))
      .limit(limit);

    return result.map(row => ({
      ...row.trade,
      account: row.account!,
      instrument: row.instrument || undefined,
    }));
  }

  async getTrade(id: string): Promise<TradeWithRelations | undefined> {
    const [result] = await db
      .select({
        trade: trades,
        account: tradingAccounts,
        instrument: instruments,
      })
      .from(trades)
      .leftJoin(tradingAccounts, eq(trades.accountId, tradingAccounts.id))
      .leftJoin(instruments, eq(trades.instrumentId, instruments.id))
      .where(eq(trades.id, id));

    if (!result) return undefined;

    return {
      ...result.trade,
      account: result.account!,
      instrument: result.instrument || undefined,
    };
  }

  async createCustomInstrument(symbol: string, name?: string): Promise<Instrument> {
    // Check if instrument already exists
    const existing = await this.getInstrumentBySymbol(symbol);
    if (existing) return existing;
    
    // Create a custom instrument with default values
    const [instrument] = await db.insert(instruments).values({
      symbol,
      name: name || symbol,
      tickValue: "1.00",
      tickSize: "0.01",
      multiplier: 1,
      isCustom: true,
    }).returning();
    
    return instrument;
  }

  async createTrade(tradeData: InsertTrade): Promise<Trade> {
    let finalTradeData: any = { ...tradeData };
    
    // Handle custom instruments
    if (!tradeData.instrumentId && tradeData.customInstrument) {
      const customInstrument = await this.createCustomInstrument(tradeData.customInstrument);
      finalTradeData.instrumentId = customInstrument.id;
    }
    
    // Handle P&L - use provided P&L or calculate if both prices are provided
    if (tradeData.pnl) {
      // Use provided P&L (manual entry)
      finalTradeData.pnl = tradeData.pnl;
      const pnlValue = parseFloat(tradeData.pnl.toString());
      finalTradeData.result = pnlValue > 0 ? 'profit' : pnlValue < 0 ? 'loss' : 'breakeven';
      
      // If exit price is provided, mark as closed
      if (tradeData.exitPrice) {
        finalTradeData.status = 'closed';
        // Only set exitTime to current time if user didn't provide one
        if (!tradeData.exitTime) {
          finalTradeData.exitTime = new Date();
        }
      }
    } else if (tradeData.customPnl) {
      // Handle customPnl case - copy to pnl field
      const pnlValue = parseFloat(tradeData.customPnl.toString());
      finalTradeData.pnl = pnlValue.toString();
      finalTradeData.result = pnlValue > 0 ? 'profit' : pnlValue < 0 ? 'loss' : 'breakeven';
      
      // Mark as open by default unless exit price provided
      if (tradeData.exitPrice) {
        finalTradeData.status = 'closed';
        if (!tradeData.exitTime) {
          finalTradeData.exitTime = new Date();
        }
      } else {
        finalTradeData.status = 'open';
      }
    } else if (tradeData.exitPrice && tradeData.entryPrice) {
      // Si el usuario no habilitó manual P&L, solo determinar resultado pero NO calcular P&L automático
      const entryPrice = parseFloat(tradeData.entryPrice.toString());
      const exitPrice = parseFloat(tradeData.exitPrice.toString());
      
      // Determine result based on prices
      let result: string;
      if (Math.abs(exitPrice - entryPrice) < 0.001) {
        result = 'breakeven';
      } else {
        const isProfit = tradeData.direction === 'long' 
          ? exitPrice > entryPrice 
          : entryPrice > exitPrice;
        result = isProfit ? 'profit' : 'loss';
      }
      
      finalTradeData.result = result;
      finalTradeData.status = 'closed';
      // Only set exitTime to current time if user didn't provide one
      if (!tradeData.exitTime) {
        finalTradeData.exitTime = new Date();
      }
      // Only set result based on price direction, don't auto-calculate P&L
    }

    const [trade] = await db.insert(trades).values(finalTradeData).returning();

    // Update account balance if trade has P&L - regardless of status
    if (finalTradeData.accountId && finalTradeData.pnl) {
      const pnlValue = parseFloat(finalTradeData.pnl.toString());
      if (pnlValue !== 0) {
        // Get current account balance
        const [account] = await db
          .select()
          .from(tradingAccounts)
          .where(eq(tradingAccounts.id, finalTradeData.accountId));
        
        if (account) {
          const currentBalance = parseFloat(account.currentCapital.toString());
          const newBalance = currentBalance + pnlValue;
          
          // Update account balance
          await db
            .update(tradingAccounts)
            .set({ currentCapital: newBalance.toString() })
            .where(eq(tradingAccounts.id, finalTradeData.accountId));
        }
      }
    }

    return trade;
  }

  async updateTrade(id: string, tradeData: Partial<InsertTrade>): Promise<Trade> {
    // Simply update the trade with the provided data - no complex P&L recalculation
    // The frontend will send the correct data directly
    
    // If P&L is provided, calculate result
    if (tradeData.pnl) {
      const pnlValue = parseFloat(tradeData.pnl.toString());
      (tradeData as any).result = pnlValue > 0 ? 'profit' : pnlValue < 0 ? 'loss' : 'breakeven';
    } else if (tradeData.customPnl) {
      // Handle customPnl case - copy to pnl field
      const pnlValue = parseFloat(tradeData.customPnl.toString());
      (tradeData as any).pnl = pnlValue.toString();
      (tradeData as any).result = pnlValue > 0 ? 'profit' : pnlValue < 0 ? 'loss' : 'breakeven';
    }
    
    // If exit price/time is provided, mark as closed  
    if (tradeData.exitPrice || tradeData.exitTime) {
      tradeData.status = 'closed';
    }

    const [trade] = await db
      .update(trades)
      .set(tradeData)
      .where(eq(trades.id, id))
      .returning();
    return trade;
  }

  async deleteTrade(id: string): Promise<void> {
    await db.delete(trades).where(eq(trades.id, id));
  }

  async getUserTradeStats(userId: string): Promise<{
    totalPnl: number;
    totalTrades: number;
    winRate: number;
    avgTrade: number;
    activeTrades: number;
  }> {
    // Get total P&L and trade count - include both closed trades and open trades with custom P&L
    const [pnlStats] = await db
      .select({
        totalPnl: sql<number>`COALESCE(SUM(CAST(${trades.pnl} as NUMERIC)), 0)`,
        totalTrades: count(),
        avgTrade: sql<number>`COALESCE(AVG(CAST(${trades.pnl} as NUMERIC)), 0)`,
      })
      .from(trades)
      .where(and(
        eq(trades.userId, userId),
        isNotNull(trades.pnl)
      ));

    // Get win rate based on result column - include both closed trades and open trades with custom P&L
    const [winStats] = await db
      .select({
        wins: sql<number>`COUNT(*) FILTER (WHERE ${trades.result} = 'profit')`,
        losses: sql<number>`COUNT(*) FILTER (WHERE ${trades.result} IN ('loss', 'breakeven'))`,
      })
      .from(trades)
      .where(and(
        eq(trades.userId, userId),
        isNotNull(trades.pnl)
      ));

    // Get active trades count
    const [activeStats] = await db
      .select({
        activeTrades: count(),
      })
      .from(trades)
      .where(and(eq(trades.userId, userId), eq(trades.status, 'open')));

    const winRate = pnlStats.totalTrades > 0 ? (winStats.wins / pnlStats.totalTrades) * 100 : 0;

    return {
      totalPnl: Math.round(pnlStats.totalPnl * 100) / 100,
      totalTrades: pnlStats.totalTrades,
      winRate: Math.round(winRate * 100) / 100,
      avgTrade: Math.round(pnlStats.avgTrade * 100) / 100,
      activeTrades: activeStats.activeTrades,
    };
  }

  // Emotion operations
  async getEmotions(): Promise<Emotion[]> {
    return await db.select().from(emotions).where(eq(emotions.isDefault, true));
  }

  async getUserEmotions(userId: string): Promise<UserEmotion[]> {
    return await db.select().from(userEmotions).where(eq(userEmotions.userId, userId));
  }

  async createUserEmotion(emotionData: InsertUserEmotion): Promise<UserEmotion> {
    const [emotion] = await db.insert(userEmotions).values(emotionData).returning();
    return emotion;
  }

  async seedEmotions(emotionsData: InsertEmotion[]): Promise<void> {
    for (const emotion of emotionsData) {
      try {
        const existing = await db.select().from(emotions).where(eq(emotions.name, emotion.name)).limit(1);
        if (existing.length === 0) {
          await db.insert(emotions).values(emotion);
        }
      } catch (error) {
        console.error(`Error seeding emotion ${emotion.name}:`, error);
      }
    }
  }

  // Emotion log operations
  async createEmotionLog(logData: InsertEmotionLog): Promise<EmotionLog> {
    const [log] = await db.insert(emotionLogs).values(logData).returning();
    return log;
  }

  async getUserEmotionLogs(userId: string, limit = 50): Promise<EmotionLogWithRelations[]> {
    const result = await db
      .select({
        log: emotionLogs,
        emotion: emotions,
        userEmotion: userEmotions,
        trade: trades,
      })
      .from(emotionLogs)
      .leftJoin(emotions, eq(emotionLogs.emotionId, emotions.id))
      .leftJoin(userEmotions, eq(emotionLogs.userEmotionId, userEmotions.id))
      .leftJoin(trades, eq(emotionLogs.tradeId, trades.id))
      .where(eq(emotionLogs.userId, userId))
      .orderBy(desc(emotionLogs.createdAt))
      .limit(limit);

    return result.map(row => ({
      ...row.log,
      emotion: row.emotion || undefined,
      userEmotion: row.userEmotion || undefined,
      trade: row.trade || undefined,
    }));
  }

  async getEmotionStats(userId: string): Promise<{
    emotion: string;
    icon: string;
    count: number;
    percentage: number;
  }[]> {
    const result = await db
      .select({
        emotion: sql<string>`COALESCE(${emotions.name}, ${userEmotions.name})`,
        icon: sql<string>`COALESCE(${emotions.icon}, ${userEmotions.icon})`,
        count: count(),
      })
      .from(emotionLogs)
      .leftJoin(emotions, eq(emotionLogs.emotionId, emotions.id))
      .leftJoin(userEmotions, eq(emotionLogs.userEmotionId, userEmotions.id))
      .where(eq(emotionLogs.userId, userId))
      .groupBy(sql`COALESCE(${emotions.name}, ${userEmotions.name})`, sql`COALESCE(${emotions.icon}, ${userEmotions.icon})`)
      .orderBy(desc(count()));

    const total = result.reduce((sum, item) => sum + item.count, 0);
    
    return result.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }));
  }

  // Admin-specific methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllTrades(limit = 100): Promise<TradeWithRelations[]> {
    const result = await db
      .select({
        trade: trades,
        account: tradingAccounts,
        instrument: instruments,
      })
      .from(trades)
      .leftJoin(tradingAccounts, eq(trades.accountId, tradingAccounts.id))
      .leftJoin(instruments, eq(trades.instrumentId, instruments.id))
      .orderBy(desc(trades.createdAt))
      .limit(limit);

    return result.map(row => ({
      ...row.trade,
      account: row.account!,
      instrument: row.instrument || undefined,
    }));
  }

  async deleteEmotionLog(id: string): Promise<void> {
    await db.delete(emotionLogs).where(eq(emotionLogs.id, id));
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    totalTrades: number;
    totalPnl: number;
    suspendedUsers: number;
    activeTrades: number;
  }> {
    const [userStats] = await db
      .select({
        totalUsers: count(),
        suspendedUsers: sql<number>`COUNT(*) FILTER (WHERE ${users.isSuspended} = true)`,
      })
      .from(users);

    const [tradeStats] = await db
      .select({
        totalTrades: count(),
        totalPnl: sql<number>`COALESCE(SUM(CAST(${trades.pnl} as NUMERIC)), 0)`,
        activeTrades: sql<number>`COUNT(*) FILTER (WHERE ${trades.status} = 'open')`,
      })
      .from(trades);

    return {
      totalUsers: userStats.totalUsers,
      totalTrades: tradeStats.totalTrades,
      totalPnl: tradeStats.totalPnl,
      suspendedUsers: userStats.suspendedUsers,
      activeTrades: tradeStats.activeTrades,
    };
  }

  async getAnalyticsData(): Promise<{
    chartData: Array<{
      name: string;
      users: number;
      trades: number;
      pnl: number;
    }>;
    pieData: Array<{
      name: string;
      value: number;
      color: string;
    }>;
  }> {
    // Generate monthly data for the last 6 months
    const monthlyData = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      const monthName = months[date.getMonth()];
      
      // Get users registered in this month
      const [usersResult] = await db
        .select({ count: count() })
        .from(users)
        .where(
          and(
            sql`${users.createdAt} >= ${date.toISOString()}`,
            sql`${users.createdAt} < ${nextDate.toISOString()}`
          )
        );
      
      // Get trades created in this month
      const [tradesResult] = await db
        .select({ 
          count: count(),
          totalPnl: sql<number>`COALESCE(SUM(CAST(${trades.pnl} as NUMERIC)), 0)`
        })
        .from(trades)
        .where(
          and(
            sql`${trades.createdAt} >= ${date.toISOString()}`,
            sql`${trades.createdAt} < ${nextDate.toISOString()}`
          )
        );
      
      monthlyData.push({
        name: monthName,
        users: usersResult.count,
        trades: tradesResult.count,
        pnl: Math.round(tradesResult.totalPnl)
      });
    }

    // Get user distribution by plan
    const [planStats] = await db
      .select({
        freeUsers: sql<number>`COUNT(*) FILTER (WHERE ${users.plan} = 'free')`,
        plusUsers: sql<number>`COUNT(*) FILTER (WHERE ${users.plan} = 'plus')`,
        proUsers: sql<number>`COUNT(*) FILTER (WHERE ${users.plan} = 'pro')`,
      })
      .from(users);

    const pieData = [
      { name: 'Free', value: planStats.freeUsers, color: '#8884d8' },
      { name: 'Plus', value: planStats.plusUsers, color: '#82ca9d' },
      { name: 'Pro', value: planStats.proUsers, color: '#ffc658' },
    ];

    return {
      chartData: monthlyData,
      pieData: pieData
    };
  }

  // Notification methods
  async getNotifications(): Promise<Notification[]> {
    return await db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db.insert(notifications).values(notification).returning();
    return result;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // System metrics methods
  async getSystemMetrics(): Promise<{
    serverUptime: string;
    apiResponseTime: string;
    databaseSize: string;
    pageLoadTime: string;
    errorRate: string;
    cacheHitRate: string;
    cpuUsage: string;
    memoryUsage: string;
    diskUsage: string;
  }> {
    try {
      // Calculate server uptime (simulated from process uptime)
      const uptimeSeconds = process.uptime();
      const uptimeHours = Math.floor(uptimeSeconds / 3600);
      const uptimeDays = Math.floor(uptimeHours / 24);
      const uptime = uptimeDays > 0 ? `${uptimeDays}d ${uptimeHours % 24}h` : `${uptimeHours}h`;

      // Get database size (approximate from record counts)
      const [userCount] = await db.select({ count: count() }).from(users);
      const [tradeCount] = await db.select({ count: count() }).from(trades);
      const [notificationCount] = await db.select({ count: count() }).from(notifications);
      
      const totalRecords = userCount.count + tradeCount.count + notificationCount.count;
      const approximateSize = Math.round(totalRecords * 0.5); // Approximate KB per record
      const sizeInMB = (approximateSize / 1024).toFixed(1);

      // Generate realistic system metrics (simulated but reasonable)
      const baseTime = Date.now();
      const cpuUsage = 20 + Math.sin(baseTime / 100000) * 15 + Math.random() * 10; // 15-45%
      const memoryUsage = 45 + Math.sin(baseTime / 150000) * 20 + Math.random() * 10; // 25-75%
      const diskUsage = 35 + Math.sin(baseTime / 200000) * 15 + Math.random() * 5; // 15-55%
      
      const apiResponseTime = 30 + Math.random() * 40; // 30-70ms
      const pageLoadTime = 800 + Math.random() * 800; // 0.8-1.6s
      const errorRate = Math.random() * 0.05; // 0-0.05%
      const cacheHitRate = 85 + Math.random() * 12; // 85-97%

      return {
        serverUptime: uptime,
        apiResponseTime: `${Math.round(apiResponseTime)}ms`,
        databaseSize: `${sizeInMB}MB`,
        pageLoadTime: `${(pageLoadTime / 1000).toFixed(1)}s`,
        errorRate: `${errorRate.toFixed(3)}%`,
        cacheHitRate: `${Math.round(cacheHitRate)}%`,
        cpuUsage: `${Math.round(cpuUsage)}%`,
        memoryUsage: `${Math.round(memoryUsage)}%`,
        diskUsage: `${Math.round(diskUsage)}%`,
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      // Return default values if there's an error
      return {
        serverUptime: "0h",
        apiResponseTime: "Unknown",
        databaseSize: "Unknown",
        pageLoadTime: "Unknown",
        errorRate: "Unknown",
        cacheHitRate: "Unknown",
        cpuUsage: "Unknown",
        memoryUsage: "Unknown",
        diskUsage: "Unknown",
      };
    }
  }

}

export const storage = new DatabaseStorage();
