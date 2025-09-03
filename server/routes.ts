import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTransactionSchema, insertReferralSchema, insertPriceHistorySchema } from "@shared/schema";
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
      
      // Update referrer earnings
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

  const httpServer = createServer(app);
  return httpServer;
}
