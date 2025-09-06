import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTransactionSchema, insertReferralSchema, insertPriceHistorySchema, insertAdminSettingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.get("/api/users/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const user = await storage.getUser(walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("[API ERROR] Get user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Generate referral code if not provided
      if (!userData.referralCode) {
        userData.referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      }
      
      const user = await storage.createUser(userData);
      console.log("[API] User created:", user.walletAddress);
      
      res.status(201).json(user);
    } catch (error) {
      console.error("[API ERROR] Create user:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  // Transaction routes
  app.get("/api/transactions/:userAddress", async (req, res) => {
    try {
      const { userAddress } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const transactions = await storage.getTransactions(userAddress, limit);
      res.json(transactions);
    } catch (error) {
      console.error("[API ERROR] Get transactions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      
      console.log("[API] Transaction created:", transaction.txHash);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("[API ERROR] Create transaction:", error);
      res.status(400).json({ error: "Invalid transaction data" });
    }
  });

  app.patch("/api/transactions/:txHash/status", async (req, res) => {
    try {
      const { txHash } = req.params;
      const { status, blockNumber } = req.body;
      
      await storage.updateTransactionStatus(txHash, status, blockNumber);
      console.log("[API] Transaction status updated:", txHash, status);
      
      res.json({ success: true });
    } catch (error) {
      console.error("[API ERROR] Update transaction status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Referral routes
  app.get("/api/referrals/:referrerAddress", async (req, res) => {
    try {
      const { referrerAddress } = req.params;
      const referrals = await storage.getReferrals(referrerAddress);
      res.json(referrals);
    } catch (error) {
      console.error("[API ERROR] Get referrals:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/referrals", async (req, res) => {
    try {
      const referralData = insertReferralSchema.parse(req.body);
      const referral = await storage.createReferral(referralData);
      
      // Update referrer earnings (this will automatically check for milestone)
      await storage.updateUserEarnings(
        referral.referrerAddress,
        referral.commissionAmount
      );
      
      console.log("[API] Referral created:", referral.id);
      res.status(201).json(referral);
    } catch (error) {
      console.error("[API ERROR] Create referral:", error);
      res.status(400).json({ error: "Invalid referral data" });
    }
  });

  // Milestone and BTC bonus routes
  app.post("/api/users/:walletAddress/claim-btc-bonus", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      await storage.claimBtcBonus(walletAddress);
      
      console.log("[API] BTC bonus claimed:", walletAddress);
      res.json({ success: true, message: "BTC bonus claimed successfully" });
    } catch (error) {
      console.error("[API ERROR] Claim BTC bonus:", error);
      res.status(400).json({ error: "Failed to claim BTC bonus" });
    }
  });

  // Price routes
  app.get("/api/prices/:tokenPair", async (req, res) => {
    try {
      const { tokenPair } = req.params;
      const price = await storage.getLatestPrice(tokenPair);
      
      if (!price) {
        return res.status(404).json({ error: "Price not found" });
      }
      
      res.json(price);
    } catch (error) {
      console.error("[API ERROR] Get price:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/prices", async (req, res) => {
    try {
      const priceData = insertPriceHistorySchema.parse(req.body);
      const priceEntry = await storage.createPriceEntry(priceData);
      
      console.log("[API] Price entry created:", priceEntry.tokenPair, priceEntry.price);
      res.status(201).json(priceEntry);
    } catch (error) {
      console.error("[API ERROR] Create price entry:", error);
      res.status(400).json({ error: "Invalid price data" });
    }
  });

  app.get("/api/prices/:tokenPair/history", async (req, res) => {
    try {
      const { tokenPair } = req.params;
      const hours = parseInt(req.query.hours as string) || 24;
      
      const history = await storage.getPriceHistory(tokenPair, hours);
      res.json(history);
    } catch (error) {
      console.error("[API ERROR] Get price history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Referral code validation
  app.get("/api/referral-code/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const user = await storage.getUserByReferralCode(code);
      
      if (!user) {
        return res.status(404).json({ error: "Invalid referral code" });
      }
      
      res.json({ valid: true, referrer: user.walletAddress });
    } catch (error) {
      console.error("[API ERROR] Validate referral code:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin authentication middleware for login endpoint only
  const adminAuthLogin = (req: any, res: any, next: any) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || "Sohan@Rohan11";
    
    if (password !== adminPassword) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    next();
  };

  // Admin authentication middleware for all other protected routes
  const adminAuth = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    const adminPassword = process.env.ADMIN_PASSWORD || "Sohan@Rohan11";
    
    // Check both Bearer token and basic auth
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      if (token === adminPassword) {
        return next();
      }
    }
    
    // If no valid Bearer token, also check if password is passed in request body for all endpoints
    const { password } = req.body || {};
    if (password && password === adminPassword) {
      return next();
    }
    
    return res.status(401).json({ error: "Unauthorized - Invalid or missing admin credentials" });
  };

  // Admin routes
  app.post("/api/admin/login", adminAuthLogin, (req, res) => {
    res.json({ success: true, message: "Admin authenticated" });
  });

  app.get("/api/admin/settings", adminAuth, async (req, res) => {
    try {
      const settings = await storage.getAllAdminSettings();
      res.json(settings);
    } catch (error) {
      console.error("[API ERROR] Get admin settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/settings", adminAuth, async (req, res) => {
    try {
      const settingData = insertAdminSettingSchema.parse(req.body);
      const setting = await storage.createOrUpdateAdminSetting(settingData);
      
      console.log("[API] Admin setting updated:", setting.settingKey);
      res.json(setting);
    } catch (error) {
      console.error("[API ERROR] Update admin setting:", error);
      res.status(400).json({ error: "Invalid setting data" });
    }
  });

  app.get("/api/admin/users", adminAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("[API ERROR] Get all users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/transactions", adminAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const transactions = await storage.getAllTransactions(limit);
      res.json(transactions);
    } catch (error) {
      console.error("[API ERROR] Get all transactions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/referrals", adminAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const referrals = await storage.getAllReferrals(limit);
      res.json(referrals);
    } catch (error) {
      console.error("[API ERROR] Get all referrals:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/analytics", adminAuth, async (req, res) => {
    try {
      const profit = await storage.getTotalProfit();
      res.json(profit);
    } catch (error) {
      console.error("[API ERROR] Get admin analytics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
