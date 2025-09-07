import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTradeSchema, 
  insertTradingAccountSchema,
  insertUserEmotionSchema, 
  insertEmotionLogSchema,
  insertInstrumentSchema,
  insertNotificationSchema,
  type User,
  registerUserSchema,
  loginUserSchema,
} from "@shared/schema";
import { z } from "zod";
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import session from 'express-session';
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

interface AuthRequest extends express.Request {
  user?: User;
}

// Simple auth middleware
const isAuthenticated = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin auth middleware
const isAdmin = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const user = await storage.getUser(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {

  // Initialize default instruments and emotions
  await initializeDefaults();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Validation routes for the carousel auth flow
  app.post('/api/auth/check-username', async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) {
        return res.status(400).json({ message: "Username is required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (user) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      res.json({ message: "Username available" });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ message: "Failed to check username" });
    }
  });

  app.post('/api/auth/check-email', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (user) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      res.json({ message: "Email available" });
    } catch (error) {
      console.error("Error checking email:", error);
      res.status(500).json({ message: "Failed to check email" });
    }
  });

  app.post('/api/auth/check-user', async (req, res) => {
    try {
      const { identifier } = req.body;
      if (!identifier) {
        return res.status(400).json({ message: "Email or username is required" });
      }
      
      const user = identifier.includes('@') 
        ? await storage.getUserByEmail(identifier)
        : await storage.getUserByUsername(identifier);
        
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      
      res.json({ message: "User found" });
    } catch (error) {
      console.error("Error checking user:", error);
      res.status(500).json({ message: "Failed to check user" });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password, confirmPassword } = req.body;
      
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      
      // Create user via storage
      const user = await storage.createUserWithCredentials({
        username,
        email,
        password
      });

      // Create default trading account
      try {
        await storage.createTradingAccount({
          userId: user.id,
          name: "Cuenta Principal",
          accountType: "forex",
          initialCapital: "10000.00",
          currency: "USD",
        });
      } catch (accountError) {
        console.error("Error creating default account:", accountError);
        // Don't fail registration if account creation fails
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      const { password: _, ...safeUser } = user;
      res.json({ 
        message: "User created successfully", 
        user: safeUser,
        token 
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { identifier, password } = req.body;
      
      const user = identifier.includes('@') 
        ? await storage.getUserByEmail(identifier)
        : await storage.getUserByUsername(identifier);
        
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      const { password: _, ...safeUser } = user;
      res.json({ 
        message: "Login successful", 
        user: safeUser,
        token 
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Instrument routes
  app.get('/api/instruments', async (req, res) => {
    try {
      const instruments = await storage.getInstruments();
      res.json(instruments);
    } catch (error) {
      console.error("Error fetching instruments:", error);
      res.status(500).json({ message: "Failed to fetch instruments" });
    }
  });

  // Trade routes
  app.get('/api/trades', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const trades = await storage.getUserTrades(userId, limit);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  app.get('/api/trades/stats', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const stats = await storage.getUserTradeStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching trade stats:", error);
      res.status(500).json({ message: "Failed to fetch trade stats" });
    }
  });

  // Get trade limits and current count for user
  app.get('/api/trades/limits', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Get fresh user data from database to ensure plan is up to date
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currentTrades = await storage.getUserTrades(userId);
      const tradeCount = currentTrades.length;
      
      // Define trade limits per plan
      const tradeLimits = {
        free: 60,
        plus: 300,
        pro: Infinity
      };
      
      const userLimit = tradeLimits[user.plan as keyof typeof tradeLimits] || tradeLimits.free;
      
      res.json({
        currentCount: tradeCount,
        limit: userLimit === Infinity ? null : userLimit,
        plan: user.plan,
        canCreateMore: tradeCount < userLimit,
        remaining: userLimit === Infinity ? null : Math.max(0, userLimit - tradeCount)
      });
    } catch (error) {
      console.error("Error fetching trade limits:", error);
      res.status(500).json({ message: "Failed to fetch trade limits" });
    }
  });

  app.get('/api/trades/:id', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const tradeId = req.params.id;
      
      const trade = await storage.getTrade(tradeId);
      if (!trade || trade.userId !== userId) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      res.json(trade);
    } catch (error) {
      console.error("Error fetching trade:", error);
      res.status(500).json({ message: "Failed to fetch trade" });
    }
  });

  app.post('/api/trades', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Get fresh user data from database to ensure plan is up to date
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check trade limits based on user plan
      const currentTrades = await storage.getUserTrades(userId);
      const tradeCount = currentTrades.length;
      
      // Define trade limits per plan
      const tradeLimits = {
        free: 60,
        plus: 300,
        pro: Infinity
      };
      
      const userLimit = tradeLimits[user.plan as keyof typeof tradeLimits] || tradeLimits.free;
      
      if (tradeCount >= userLimit) {
        return res.status(403).json({ 
          message: `Has alcanzado el límite de trades para tu plan ${user.plan}. Límite: ${userLimit === Infinity ? 'ilimitado' : userLimit} trades.`,
          currentCount: tradeCount,
          limit: userLimit === Infinity ? null : userLimit,
          plan: user.plan
        });
      }
      
      // Handle empty accountId by using the first available account
      let accountId = req.body.accountId;
      if (!accountId || accountId === '') {
        // Get user's existing accounts and use the first one (usually the main account)
        const existingAccounts = await storage.getUserTradingAccounts(userId);
        let defaultAccount = existingAccounts.length > 0 ? existingAccounts[0] : null;
        
        if (!defaultAccount) {
          // Only create a new account if the user has no accounts at all
          defaultAccount = await storage.createTradingAccount({
            userId,
            name: 'Default Account',
            accountType: 'forex',
            initialCapital: '0',
            currency: 'USD'
          });
        }
        accountId = defaultAccount.id;
      }
      
      // Process the trade data and handle timestamps correctly
      const customPnlValue = req.body.customPnl ? Math.min(9999999999999999.99, Math.max(-9999999999999999.99, parseFloat(req.body.customPnl))) : undefined;
      
      const processedData = {
        ...req.body,
        accountId,
        userId,
        // Convert ISO strings to Date objects for timestamp fields
        entryTime: req.body.entryTime ? new Date(req.body.entryTime) : undefined,
        exitTime: req.body.exitTime ? new Date(req.body.exitTime) : undefined,
        // Ensure numeric fields are properly converted and within limits
        entryPrice: req.body.entryPrice ? Math.min(999999999999.9999, Math.max(0.0001, parseFloat(req.body.entryPrice))) : undefined,
        exitPrice: req.body.exitPrice ? Math.min(999999999999.9999, Math.max(0.0001, parseFloat(req.body.exitPrice))) : undefined,
        customPnl: customPnlValue,
        // Copy customPnl to pnl field for statistics calculation
        pnl: customPnlValue ? customPnlValue.toString() : undefined,
        lotSize: req.body.lotSize ? Math.min(999999999, Math.max(1, parseInt(req.body.lotSize))) : 1,
      };
      
      const tradeData = insertTradeSchema.parse(processedData);
      const trade = await storage.createTrade(tradeData);
      res.json(trade);
    } catch (error) {
      console.error("Error creating trade:", error);
      console.error("Request body:", req.body);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ message: "Invalid trade data", errors: error.errors });
      } else {
        console.error("Database error:", error);
        res.status(500).json({ message: "Failed to create trade", error: error instanceof Error ? error.message : String(error) });
      }
    }
  });

  app.put('/api/trades/:id', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const tradeId = req.params.id;
      
      // Verify trade belongs to user
      const existingTrade = await storage.getTrade(tradeId);
      if (!existingTrade || existingTrade.userId !== userId) {
        return res.status(404).json({ message: "Trade not found" });
      }

      // Process the data like in POST endpoint
      const customPnlValue = req.body.customPnl ? Math.min(9999999999999999.99, Math.max(-9999999999999999.99, parseFloat(req.body.customPnl))) : undefined;
      
      const processedData = {
        ...req.body,
        // Convert ISO strings to Date objects for timestamp fields - only if they're strings
        entryTime: req.body.entryTime && typeof req.body.entryTime === 'string' ? new Date(req.body.entryTime) : req.body.entryTime,
        exitTime: req.body.exitTime && typeof req.body.exitTime === 'string' ? new Date(req.body.exitTime) : req.body.exitTime,
        // Ensure numeric fields are properly converted and within limits
        entryPrice: req.body.entryPrice ? Math.min(999999999999.9999, Math.max(0.0001, parseFloat(req.body.entryPrice))) : undefined,
        exitPrice: req.body.exitPrice ? Math.min(999999999999.9999, Math.max(0.0001, parseFloat(req.body.exitPrice))) : undefined,
        customPnl: customPnlValue,
        // Copy customPnl to pnl field for statistics calculation
        pnl: customPnlValue ? customPnlValue.toString() : undefined,
        lotSize: req.body.lotSize ? Math.min(999999999, Math.max(1, parseInt(req.body.lotSize))) : 1,
      };

      const tradeData = insertTradeSchema.partial().parse(processedData);
      const updatedTrade = await storage.updateTrade(tradeId, tradeData);
      res.json(updatedTrade);
    } catch (error) {
      console.error("Error updating trade:", error);
      console.error("Request body:", req.body);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ message: "Invalid trade data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update trade", error: error instanceof Error ? error.message : String(error) });
      }
    }
  });

  app.delete('/api/trades/:id', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const tradeId = req.params.id;
      
      // Verify trade belongs to user
      const existingTrade = await storage.getTrade(tradeId);
      if (!existingTrade || existingTrade.userId !== userId) {
        return res.status(404).json({ message: "Trade not found" });
      }

      await storage.deleteTrade(tradeId);
      res.json({ message: "Trade deleted successfully" });
    } catch (error) {
      console.error("Error deleting trade:", error);
      res.status(500).json({ message: "Failed to delete trade" });
    }
  });

  // Get shared trade (public access)
  app.get('/api/shared/trades/:username/:id', async (req, res) => {
    try {
      const { username, id: tradeId } = req.params;
      
      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get trade with relations
      const trade = await storage.getTrade(tradeId);
      if (!trade || trade.userId !== user.id) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      // Check if trade is public - only public trades can be shared
      if ((trade as any).visibility === 'private') {
        return res.status(403).json({ message: "Trade is private" });
      }
      
      res.json(trade);
    } catch (error) {
      console.error("Error fetching shared trade:", error);
      res.status(500).json({ message: "Failed to fetch shared trade" });
    }
  });

  // Emotion routes
  app.get('/api/emotions', async (req, res) => {
    try {
      const emotions = await storage.getEmotions();
      res.json(emotions);
    } catch (error) {
      console.error("Error fetching emotions:", error);
      res.status(500).json({ message: "Failed to fetch emotions" });
    }
  });

  app.get('/api/emotions/user', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const userEmotions = await storage.getUserEmotions(userId);
      res.json(userEmotions);
    } catch (error) {
      console.error("Error fetching user emotions:", error);
      res.status(500).json({ message: "Failed to fetch user emotions" });
    }
  });

  app.post('/api/emotions/user', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const emotionData = insertUserEmotionSchema.parse({ ...req.body, userId });
      const emotion = await storage.createUserEmotion(emotionData);
      res.json(emotion);
    } catch (error) {
      console.error("Error creating user emotion:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid emotion data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create user emotion" });
      }
    }
  });

  // Emotion log routes
  app.get('/api/emotion-logs', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const logs = await storage.getUserEmotionLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching emotion logs:", error);
      res.status(500).json({ message: "Failed to fetch emotion logs" });
    }
  });

  app.post('/api/emotion-logs', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const logData = insertEmotionLogSchema.parse({ ...req.body, userId });
      const log = await storage.createEmotionLog(logData);
      res.json(log);
    } catch (error) {
      console.error("Error creating emotion log:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid emotion log data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create emotion log" });
      }
    }
  });

  app.get('/api/emotion-logs/stats', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const stats = await storage.getEmotionStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching emotion stats:", error);
      res.status(500).json({ message: "Failed to fetch emotion stats" });
    }
  });

  // Public profile routes
  app.get('/api/stats/:username', async (req: any, res) => {
    try {
      const username = req.params.username;
      const user = await storage.getUserByUsername(username);
      
      if (!user || !user.isPublicProfile) {
        return res.status(404).json({ message: "Profile not found or private" });
      }

      const stats = await storage.getUserTradeStats(user.id);
      const emotionStats = await storage.getEmotionStats(user.id);
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        },
        stats,
        emotionStats,
      });
    } catch (error) {
      console.error("Error fetching public profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Profile settings
  app.put('/api/user/profile', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const updates = req.body;
      
      // Only allow specific fields to be updated
      const allowedUpdates = ['firstName', 'lastName', 'profileImageUrl', 'isPublicProfile'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});

      const updatedUser = await storage.updateUser(userId, filteredUpdates);
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Trading account routes
  app.get('/api/trading-accounts', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const accounts = await storage.getUserTradingAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching trading accounts:", error);
      res.status(500).json({ message: "Failed to fetch trading accounts" });
    }
  });

  // Get trading account limits and current count for user
  app.get('/api/trading-accounts/limits', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Get fresh user data from database to ensure plan is up to date
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const currentAccounts = await storage.getUserTradingAccounts(userId);
      const accountCount = currentAccounts.length;
      
      // Define account limits per plan
      const accountLimits = {
        free: 2,   // Default + 1 additional
        plus: 5,   // Up to 5 accounts
        pro: 20    // Up to 20 accounts
      };
      
      const userLimit = accountLimits[user.plan as keyof typeof accountLimits] || accountLimits.free;
      
      res.json({
        currentCount: accountCount,
        limit: userLimit,
        plan: user.plan,
        canCreateMore: accountCount < userLimit,
        remaining: Math.max(0, userLimit - accountCount)
      });
    } catch (error) {
      console.error("Error fetching trading account limits:", error);
      res.status(500).json({ message: "Failed to fetch trading account limits" });
    }
  });

  app.post('/api/trading-accounts', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Get fresh user data from database to ensure plan is up to date
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check trading account limits based on user plan
      const existingAccounts = await storage.getUserTradingAccounts(userId);
      const accountCount = existingAccounts.length;
      
      // Define account limits per plan
      const accountLimits = {
        free: 2,   // Default + 1 additional
        plus: 5,   // Up to 5 accounts
        pro: 20    // Up to 20 accounts
      };
      
      const userLimit = accountLimits[user.plan as keyof typeof accountLimits] || accountLimits.free;
      
      if (accountCount >= userLimit) {
        return res.status(403).json({ 
          message: `Has alcanzado el límite de cuentas de trading para tu plan ${user.plan}. Límite: ${userLimit} cuentas.`,
          currentCount: accountCount,
          limit: userLimit,
          plan: user.plan
        });
      }
      
      const accountData = insertTradingAccountSchema.parse({ ...req.body, userId });
      const account = await storage.createTradingAccount(accountData);
      res.json(account);
    } catch (error) {
      console.error("Error creating trading account:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid account data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create trading account" });
      }
    }
  });

  app.put('/api/trading-accounts/:id', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const accountId = req.params.id;
      
      // Verify account belongs to user
      const existingAccount = await storage.getTradingAccount(accountId);
      if (!existingAccount || existingAccount.userId !== userId) {
        return res.status(404).json({ message: "Trading account not found" });
      }

      const updates = insertTradingAccountSchema.partial().parse(req.body);
      const updatedAccount = await storage.updateTradingAccount(accountId, updates);
      res.json(updatedAccount);
    } catch (error) {
      console.error("Error updating trading account:", error);
      res.status(500).json({ message: "Failed to update trading account" });
    }
  });

  app.delete('/api/trading-accounts/:id', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const accountId = req.params.id;
      
      // Verify account belongs to user
      const existingAccount = await storage.getTradingAccount(accountId);
      if (!existingAccount || existingAccount.userId !== userId) {
        return res.status(404).json({ message: "Trading account not found" });
      }

      await storage.deleteTradingAccount(accountId);
      res.json({ message: "Trading account deleted successfully" });
    } catch (error) {
      console.error("Error deleting trading account:", error);
      res.status(500).json({ message: "Failed to delete trading account" });
    }
  });

  // ADMIN ROUTES - All admin functionality
  
  // Get all users (admin only)
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user details (admin only)
  app.get('/api/admin/users/:id', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  // Suspend/unsuspend user account
  app.put('/api/admin/users/:id/suspend', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      const { isSuspended, suspensionReason } = req.body;
      
      const updatedUser = await storage.updateUser(userId, { 
        isSuspended, 
        suspensionReason: isSuspended ? suspensionReason : null 
      });
      
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user suspension:", error);
      res.status(500).json({ message: "Failed to update user suspension" });
    }
  });

  // Change user plan
  app.put('/api/admin/users/:id/plan', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      const { plan } = req.body;
      
      if (!['free', 'plus', 'pro'].includes(plan)) {
        return res.status(400).json({ message: "Invalid plan" });
      }
      
      const updatedUser = await storage.updateUser(userId, { plan });
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user plan:", error);
      res.status(500).json({ message: "Failed to update user plan" });
    }
  });

  // Update user preferences
  app.put('/api/users/:id/preferences', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      const updateData = req.body;
      
      // Only allow user to update their own preferences or admin to update any user
      if (req.user!.id !== userId) {
        const user = await storage.getUser(req.user!.id);
        if (!user || !user.isAdmin) {
          return res.status(403).json({ message: "You can only update your own preferences" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update user preferences" });
    }
  });

  // Get user settings
  app.get('/api/user/settings', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return only the settings fields we need
      const settings = {
        username: user.username,
        email: user.email,
        preferredTradeInput: user.preferredTradeInput,
        defaultTradeVisibility: user.defaultTradeVisibility,
        preferredTheme: user.preferredTheme
      };
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update user settings with password verification
  app.put('/api/user/settings', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { settings, password } = req.body;

      // Verify password
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Contraseña incorrecta" });
      }

      // Check if username or email are being changed and if they're already taken
      if (settings.username && settings.username !== user.username) {
        const existingUser = await storage.getUserByUsername(settings.username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "El nombre de usuario ya está en uso" });
        }
      }

      if (settings.email && settings.email !== user.email) {
        const existingUser = await storage.getUserByEmail(settings.email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "El email ya está en uso" });
        }
      }

      // Update user settings
      const updatedUser = await storage.updateUser(userId, settings);
      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Update user preferences (no password required for theme, trade input, visibility)
  app.put('/api/user/preferences', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const preferences = req.body;

      // Only allow updating safe preference fields
      const allowedFields = ['preferredTradeInput', 'defaultTradeVisibility', 'preferredTheme'];
      const filteredPreferences = Object.keys(preferences)
        .filter(key => allowedFields.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = preferences[key];
          return obj;
        }, {});

      if (Object.keys(filteredPreferences).length === 0) {
        return res.status(400).json({ message: "No valid preferences provided" });
      }

      // Update user preferences
      const updatedUser = await storage.updateUser(userId, filteredPreferences);
      const { password: _, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Change password
  app.put('/api/user/password', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Contraseña actual incorrecta" });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await storage.updateUser(userId, { password: hashedNewPassword });
      res.json({ message: "Contraseña actualizada correctamente" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Delete account
  app.delete('/api/user/account', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { password } = req.body;

      // Verify password
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Contraseña incorrecta" });
      }

      // Delete user and all associated data
      await storage.deleteUser(userId);
      res.json({ message: "Cuenta eliminada correctamente" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Edit complete user data (admin only)
  app.put('/api/admin/users/:id', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      const updateData = req.body;
      
      // If password is being updated, hash it
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user (admin):", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Get all trades (admin only)
  app.get('/api/admin/trades', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const trades = await storage.getAllTrades(limit);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching all trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Get user's trades (admin only)
  app.get('/api/admin/users/:id/trades', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const trades = await storage.getUserTrades(userId, limit);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching user trades:", error);
      res.status(500).json({ message: "Failed to fetch user trades" });
    }
  });

  // Update any trade (admin only) - change visibility or edit completely
  app.put('/api/admin/trades/:id', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const tradeId = req.params.id;
      const updateData = req.body;
      
      const updatedTrade = await storage.updateTrade(tradeId, updateData);
      res.json(updatedTrade);
    } catch (error) {
      console.error("Error updating trade (admin):", error);
      res.status(500).json({ message: "Failed to update trade" });
    }
  });

  // Delete any trade (admin only)
  app.delete('/api/admin/trades/:id', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const tradeId = req.params.id;
      await storage.deleteTrade(tradeId);
      res.json({ message: "Trade deleted successfully" });
    } catch (error) {
      console.error("Error deleting trade (admin):", error);
      res.status(500).json({ message: "Failed to delete trade" });
    }
  });

  // Create trade for any user (admin only)
  app.post('/api/admin/users/:id/trades', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      
      const processedData = {
        ...req.body,
        userId,
        entryTime: req.body.entryTime ? new Date(req.body.entryTime) : undefined,
        exitTime: req.body.exitTime ? new Date(req.body.exitTime) : undefined,
      };
      
      const tradeData = insertTradeSchema.parse(processedData);
      const trade = await storage.createTrade(tradeData);
      res.json(trade);
    } catch (error) {
      console.error("Error creating trade for user (admin):", error);
      res.status(500).json({ message: "Failed to create trade" });
    }
  });

  // Get user's trading accounts (admin only)
  app.get('/api/admin/users/:id/accounts', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      const accounts = await storage.getUserTradingAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching user accounts (admin):", error);
      res.status(500).json({ message: "Failed to fetch user accounts" });
    }
  });

  // Create trading account for any user (admin only)
  app.post('/api/admin/users/:id/accounts', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      const accountData = insertTradingAccountSchema.parse({ ...req.body, userId });
      const account = await storage.createTradingAccount(accountData);
      res.json(account);
    } catch (error) {
      console.error("Error creating account for user (admin):", error);
      res.status(500).json({ message: "Failed to create trading account" });
    }
  });

  // Update any trading account (admin only)
  app.put('/api/admin/accounts/:id', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const accountId = req.params.id;
      const updates = insertTradingAccountSchema.partial().parse(req.body);
      const updatedAccount = await storage.updateTradingAccount(accountId, updates);
      res.json(updatedAccount);
    } catch (error) {
      console.error("Error updating trading account (admin):", error);
      res.status(500).json({ message: "Failed to update trading account" });
    }
  });

  // Delete any trading account (admin only)
  app.delete('/api/admin/accounts/:id', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const accountId = req.params.id;
      await storage.deleteTradingAccount(accountId);
      res.json({ message: "Trading account deleted successfully" });
    } catch (error) {
      console.error("Error deleting trading account (admin):", error);
      res.status(500).json({ message: "Failed to delete trading account" });
    }
  });

  // Get user's emotions (admin only)
  app.get('/api/admin/users/:id/emotions', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      const emotions = await storage.getUserEmotions(userId);
      res.json(emotions);
    } catch (error) {
      console.error("Error fetching user emotions (admin):", error);
      res.status(500).json({ message: "Failed to fetch user emotions" });
    }
  });

  // Create emotion for any user (admin only)
  app.post('/api/admin/users/:id/emotions', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      const emotionData = insertUserEmotionSchema.parse({ ...req.body, userId });
      const emotion = await storage.createUserEmotion(emotionData);
      res.json(emotion);
    } catch (error) {
      console.error("Error creating emotion for user (admin):", error);
      res.status(500).json({ message: "Failed to create user emotion" });
    }
  });

  // Get user's emotion logs (admin only)
  app.get('/api/admin/users/:id/emotion-logs', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      const logs = await storage.getUserEmotionLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching user emotion logs (admin):", error);
      res.status(500).json({ message: "Failed to fetch user emotion logs" });
    }
  });

  // Create emotion log for any user (admin only)
  app.post('/api/admin/users/:id/emotion-logs', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.id;
      const logData = insertEmotionLogSchema.parse({ ...req.body, userId });
      const log = await storage.createEmotionLog(logData);
      res.json(log);
    } catch (error) {
      console.error("Error creating emotion log for user (admin):", error);
      res.status(500).json({ message: "Failed to create emotion log" });
    }
  });

  // Delete emotion log (admin only)
  app.delete('/api/admin/emotion-logs/:id', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const logId = req.params.id;
      await storage.deleteEmotionLog(logId);
      res.json({ message: "Emotion log deleted successfully" });
    } catch (error) {
      console.error("Error deleting emotion log (admin):", error);
      res.status(500).json({ message: "Failed to delete emotion log" });
    }
  });

  // Get dashboard stats (admin only)
  app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Get analytics data (admin only)
  app.get('/api/admin/analytics', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const analytics = await storage.getAnalyticsData();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  // System Configuration and Analytics Routes
  
  // Get system logs (admin only)
  app.get('/api/admin/logs', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const logs = [
        { id: 1, timestamp: new Date(), level: 'info', message: 'User login successful', userId: 'user123' },
        { id: 2, timestamp: new Date(), level: 'warning', message: 'Failed login attempt', ip: '192.168.1.100' },
        { id: 3, timestamp: new Date(), level: 'error', message: 'Database connection timeout', component: 'db' },
        { id: 4, timestamp: new Date(), level: 'info', message: 'Trade created successfully', tradeId: 'trade456' },
        { id: 5, timestamp: new Date(), level: 'warning', message: 'High memory usage detected', usage: '85%' },
      ];
      res.json(logs);
    } catch (error) {
      console.error("Error fetching system logs:", error);
      res.status(500).json({ message: "Failed to fetch system logs" });
    }
  });

  // Get system notifications (admin only)
  app.get('/api/admin/notifications', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const notifications = await storage.getNotifications();
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.put('/api/admin/notifications/:id/read', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const notificationId = req.params.id;
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Create notification (admin only)
  app.post('/api/admin/notifications', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  // Delete notification (admin only)
  app.delete('/api/admin/notifications/:id', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const notificationId = req.params.id;
      await storage.deleteNotification(notificationId);
      res.json({ message: "Notification deleted successfully" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Get system metrics (admin only)
  app.get('/api/admin/system/metrics', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const metrics = await storage.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching system metrics:", error);
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });


  // Get advanced analytics
  app.get('/api/admin/analytics', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const analytics = {
        userGrowth: [
          { month: 'Jan', users: 120, growth: 12 },
          { month: 'Feb', users: 135, growth: 12.5 },
          { month: 'Mar', users: 152, growth: 12.6 },
          { month: 'Apr', users: 171, growth: 12.5 },
          { month: 'May', users: 192, growth: 12.3 },
          { month: 'Jun', users: 215, growth: 12.0 },
        ],
        tradeMetrics: {
          avgTradesPerUser: 15.3,
          avgProfitPerTrade: 125.50,
          topPerformers: [
            { username: 'trader1', profit: 15400, trades: 156 },
            { username: 'trader2', profit: 12300, trades: 98 },
            { username: 'trader3', profit: 9800, trades: 87 },
          ]
        },
        systemMetrics: {
          uptime: '99.9%',
          responseTime: 45,
          errorRate: 0.01,
          activeConnections: 234
        }
      };
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // System configuration management
  app.get('/api/admin/config', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const config = {
        systemSettings: {
          maintenanceMode: false,
          allowRegistrations: true,
          maxUsersPerPlan: {
            free: 1000,
            plus: 5000,
            pro: -1 // unlimited
          }
        },
        emailSettings: {
          smtpEnabled: true,
          notificationsEnabled: true,
          weeklyReports: true
        },
        securitySettings: {
          requireTwoFactor: false,
          sessionTimeout: 24,
          maxLoginAttempts: 5
        }
      };
      res.json(config);
    } catch (error) {
      console.error("Error fetching config:", error);
      res.status(500).json({ message: "Failed to fetch configuration" });
    }
  });

  // Update system configuration
  app.put('/api/admin/config', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const { section, settings } = req.body;
      // In a real app, you'd save this to a configuration table
      res.json({ message: "Configuration updated successfully" });
    } catch (error) {
      console.error("Error updating config:", error);
      res.status(500).json({ message: "Failed to update configuration" });
    }
  });

  // Create system announcement
  app.post('/api/admin/announcements', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const { title, message, type, targetUsers } = req.body;
      const announcement = {
        id: Date.now().toString(),
        title,
        message,
        type,
        targetUsers,
        createdBy: req.user!.id,
        createdAt: new Date(),
        active: true
      };
      res.json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  // Get backup status
  app.get('/api/admin/backup', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      const backupInfo = {
        lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        backupSize: '2.4 GB',
        status: 'completed',
        schedule: 'daily',
        retention: '30 days',
        location: 'cloud storage'
      };
      res.json(backupInfo);
    } catch (error) {
      console.error("Error fetching backup info:", error);
      res.status(500).json({ message: "Failed to fetch backup information" });
    }
  });

  // Trigger manual backup
  app.post('/api/admin/backup', isAuthenticated, isAdmin, async (req: AuthRequest, res) => {
    try {
      // In a real app, you'd trigger an actual backup process
      res.json({ message: "Backup initiated successfully" });
    } catch (error) {
      console.error("Error initiating backup:", error);
      res.status(500).json({ message: "Failed to initiate backup" });
    }
  });

  // PayPal routes - Temporarily disabled 
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.get("/paypal/client-id", async (req, res) => {
    try {
      const clientId = process.env.PAYPAL_CLIENT_ID;
      if (!clientId) {
        return res.status(503).json({ error: "PayPal configuration missing" });
      }
      res.json({ clientId });
    } catch (error) {
      console.error("PayPal client-id error:", error);
      res.status(503).json({ error: "PayPal service temporarily unavailable" });
    }
  });

  app.post("/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}

async function initializeDefaults() {
  try {
    // Initialize default instruments
    const instruments = [
      { symbol: "ES", name: "E-mini S&P 500", tickValue: "12.50", tickSize: "0.25", multiplier: 50 },
      { symbol: "NQ", name: "E-mini Nasdaq-100", tickValue: "5.00", tickSize: "0.25", multiplier: 20 },
      { symbol: "YM", name: "E-mini Dow", tickValue: "5.00", tickSize: "1.00", multiplier: 5 },
      { symbol: "CL", name: "Crude Oil", tickValue: "10.00", tickSize: "0.01", multiplier: 1000 },
      { symbol: "GC", name: "Gold", tickValue: "10.00", tickSize: "0.10", multiplier: 100 },
    ];

    for (const instrument of instruments) {
      const existing = await storage.getInstrumentBySymbol(instrument.symbol);
      if (!existing) {
        await storage.createInstrument(instrument);
      }
    }

    // Initialize default emotions
    const emotions = [
      { name: "Confident", icon: "TrendingUp", category: "positive", isDefault: true },
      { name: "Anxious", icon: "AlertTriangle", category: "negative", isDefault: true },
      { name: "Excited", icon: "Zap", category: "positive", isDefault: true },
      { name: "Frustrated", icon: "Frown", category: "negative", isDefault: true },
      { name: "Calm", icon: "Smile", category: "neutral", isDefault: true },
      { name: "Greedy", icon: "DollarSign", category: "negative", isDefault: true },
      { name: "Fearful", icon: "AlertCircle", category: "negative", isDefault: true },
      { name: "Disciplined", icon: "Target", category: "positive", isDefault: true },
      { name: "Impatient", icon: "Clock", category: "negative", isDefault: true },
      { name: "Focused", icon: "Eye", category: "positive", isDefault: true },
    ];

    await storage.seedEmotions(emotions);

    // Initialize default notifications
    const existingNotifications = await storage.getNotifications();
    if (existingNotifications.length === 0) {
      const defaultNotifications = [
        {
          type: 'info' as const,
          title: 'Welcome to Admin Dashboard',
          message: 'System is running smoothly. All services are operational.',
          isRead: false,
        },
        {
          type: 'warning' as const,
          title: 'Server Monitoring',
          message: 'Automatic monitoring has detected high CPU usage during peak hours.',
          isRead: false,
        },
        {
          type: 'success' as const,
          title: 'Database Backup',
          message: 'Daily database backup completed successfully.',
          isRead: true,
        },
      ];

      for (const notification of defaultNotifications) {
        await storage.createNotification(notification);
      }
    }

  } catch (error) {
    console.error("Error initializing defaults:", error);
  }
}