import { db } from "./db";
import { emotions, instruments, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

// Default emotions to seed the database
const defaultEmotions = [
  { name: "Confident", icon: "TrendingUp", category: "positive" },
  { name: "Anxious", icon: "TrendingDown", category: "negative" },
  { name: "Excited", icon: "Zap", category: "positive" },
  { name: "Fearful", icon: "AlertTriangle", category: "negative" },
  { name: "Calm", icon: "Coffee", category: "neutral" },
  { name: "Frustrated", icon: "Frown", category: "negative" },
  { name: "Optimistic", icon: "Sun", category: "positive" },
  { name: "Greedy", icon: "DollarSign", category: "negative" },
  { name: "Patient", icon: "Clock", category: "positive" },
  { name: "Impulsive", icon: "Zap", category: "negative" },
  { name: "Focused", icon: "Target", category: "positive" },
  { name: "Confused", icon: "HelpCircle", category: "negative" },
  { name: "Disciplined", icon: "Shield", category: "positive" },
  { name: "Euphoric", icon: "Star", category: "negative" },
  { name: "Neutral", icon: "Minus", category: "neutral" }
];

// Default instruments to seed the database
const defaultInstruments = [
  { symbol: "EURUSD", name: "Euro/US Dollar", tickValue: "10", tickSize: "0.0001", multiplier: 100000 },
  { symbol: "GBPUSD", name: "British Pound/US Dollar", tickValue: "10", tickSize: "0.0001", multiplier: 100000 },
  { symbol: "USDJPY", name: "US Dollar/Japanese Yen", tickValue: "10", tickSize: "0.01", multiplier: 100000 },
  { symbol: "USDCHF", name: "US Dollar/Swiss Franc", tickValue: "10", tickSize: "0.0001", multiplier: 100000 },
  { symbol: "AUDUSD", name: "Australian Dollar/US Dollar", tickValue: "10", tickSize: "0.0001", multiplier: 100000 },
  { symbol: "USDCAD", name: "US Dollar/Canadian Dollar", tickValue: "10", tickSize: "0.0001", multiplier: 100000 },
  { symbol: "NZDUSD", name: "New Zealand Dollar/US Dollar", tickValue: "10", tickSize: "0.0001", multiplier: 100000 },
  { symbol: "XAUUSD", name: "Gold/US Dollar", tickValue: "1", tickSize: "0.01", multiplier: 100 },
  { symbol: "XAGUSD", name: "Silver/US Dollar", tickValue: "1", tickSize: "0.001", multiplier: 5000 },
  { symbol: "BTCUSD", name: "Bitcoin/US Dollar", tickValue: "1", tickSize: "1", multiplier: 1 },
  { symbol: "ETHUSD", name: "Ethereum/US Dollar", tickValue: "1", tickSize: "0.01", multiplier: 1 },
  { symbol: "ES1!", name: "E-mini S&P 500", tickValue: "12.5", tickSize: "0.25", multiplier: 50 },
  { symbol: "NQ1!", name: "E-mini NASDAQ 100", tickValue: "5", tickSize: "0.25", multiplier: 20 },
  { symbol: "YM1!", name: "E-mini Dow Jones", tickValue: "5", tickSize: "1", multiplier: 5 },
  { symbol: "CL1!", name: "Crude Oil Futures", tickValue: "10", tickSize: "0.01", multiplier: 1000 }
];

export async function initializeDatabase() {
  try {
    console.log("Initializing database with default data...");
    
    // Check and create default admin user
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'GProject')).limit(1);
    if (existingAdmin.length === 0) {
      console.log("Creating default admin user...");
      const hashedPassword = await bcrypt.hash('gproject0', 10);
      
      await db.insert(users).values({
        username: 'GProject',
        email: 'admin@gproject.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true,
        plan: 'pro',
        isPublicProfile: false,
        hasCompletedOnboarding: true
      });
      console.log("Admin user created successfully");
    } else {
      console.log("Admin user already exists");
    }
    
    // Create test accounts for each plan
    const testAccounts = [
      {
        username: 'FreeUser',
        email: 'free@gproject.com', 
        plan: 'free',
        firstName: 'Free',
        lastName: 'User'
      },
      {
        username: 'PlusUser',
        email: 'plus@gproject.com',
        plan: 'plus', 
        firstName: 'Plus',
        lastName: 'User'
      },
      {
        username: 'ProUser',
        email: 'pro@gproject.com',
        plan: 'pro',
        firstName: 'Pro', 
        lastName: 'User'
      }
    ];
    
    for (const account of testAccounts) {
      const existingUser = await db.select().from(users).where(eq(users.email, account.email)).limit(1);
      if (existingUser.length === 0) {
        console.log(`Creating ${account.plan} test user...`);
        const hashedPassword = await bcrypt.hash('gproject0', 10);
        
        await db.insert(users).values({
          username: account.username,
          email: account.email,
          password: hashedPassword,
          firstName: account.firstName,
          lastName: account.lastName,
          isAdmin: false,
          plan: account.plan,
          isPublicProfile: false
        });
        console.log(`${account.plan} test user created successfully`);
      } else {
        console.log(`${account.plan} test user already exists`);
      }
    }
    
    // Check and insert default emotions
    const existingEmotions = await db.select().from(emotions).limit(1);
    if (existingEmotions.length === 0) {
      console.log("Seeding default emotions...");
      await db.insert(emotions).values(defaultEmotions);
      console.log(`Inserted ${defaultEmotions.length} default emotions`);
    }
    
    // Check and insert default instruments
    const existingInstruments = await db.select().from(instruments).limit(1);
    if (existingInstruments.length === 0) {
      console.log("Seeding default instruments...");
      await db.insert(instruments).values(defaultInstruments);
      console.log(`Inserted ${defaultInstruments.length} default instruments`);
    }
    
    console.log("Database initialization completed successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}