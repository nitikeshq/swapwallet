import { 
  type User, 
  type InsertUser, 
  type Transaction, 
  type InsertTransaction,
  type Referral,
  type InsertReferral,
  type PriceHistory,
  type InsertPriceHistory
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management
  getUser(walletAddress: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserEarnings(walletAddress: string, amount: string): Promise<void>;

  // Transaction management
  getTransactions(userAddress: string, limit?: number): Promise<Transaction[]>;
  getTransactionByHash(txHash: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(txHash: string, status: string, blockNumber?: number): Promise<void>;

  // Referral management
  getReferrals(referrerAddress: string): Promise<Referral[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  updateReferralStatus(id: string, status: string): Promise<void>;

  // Price history
  getLatestPrice(tokenPair: string): Promise<PriceHistory | undefined>;
  createPriceEntry(priceEntry: InsertPriceHistory): Promise<PriceHistory>;
  getPriceHistory(tokenPair: string, hours: number): Promise<PriceHistory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private usersByReferralCode: Map<string, User>;
  private transactions: Map<string, Transaction>;
  private transactionsByUser: Map<string, Transaction[]>;
  private referrals: Map<string, Referral>;
  private referralsByUser: Map<string, Referral[]>;
  private priceHistory: Map<string, PriceHistory[]>;

  constructor() {
    this.users = new Map();
    this.usersByReferralCode = new Map();
    this.transactions = new Map();
    this.transactionsByUser = new Map();
    this.referrals = new Map();
    this.referralsByUser = new Map();
    this.priceHistory = new Map();
  }

  async getUser(walletAddress: string): Promise<User | undefined> {
    return this.users.get(walletAddress.toLowerCase());
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    return this.usersByReferralCode.get(referralCode);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      walletAddress: insertUser.walletAddress.toLowerCase(),
      referralCode: insertUser.referralCode || null,
      referredBy: insertUser.referredBy || null,
      totalEarnings: insertUser.totalEarnings || "0",
      createdAt: new Date(),
    };
    
    this.users.set(user.walletAddress, user);
    
    if (user.referralCode) {
      this.usersByReferralCode.set(user.referralCode, user);
    }
    
    return user;
  }

  async updateUserEarnings(walletAddress: string, amount: string): Promise<void> {
    const user = this.users.get(walletAddress.toLowerCase());
    if (user) {
      const currentEarnings = parseFloat(user.totalEarnings || "0");
      const additionalEarnings = parseFloat(amount);
      user.totalEarnings = (currentEarnings + additionalEarnings).toString();
      this.users.set(walletAddress.toLowerCase(), user);
    }
  }

  async getTransactions(userAddress: string, limit = 10): Promise<Transaction[]> {
    const userTxs = this.transactionsByUser.get(userAddress.toLowerCase()) || [];
    return userTxs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getTransactionByHash(txHash: string): Promise<Transaction | undefined> {
    return this.transactions.get(txHash);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      userAddress: insertTransaction.userAddress.toLowerCase(),
      status: insertTransaction.status || "pending",
      blockNumber: insertTransaction.blockNumber || null,
      gasUsed: insertTransaction.gasUsed || null,
      gasPrice: insertTransaction.gasPrice || null,
      createdAt: new Date(),
      confirmedAt: null,
    };
    
    this.transactions.set(transaction.txHash, transaction);
    
    const userTxs = this.transactionsByUser.get(transaction.userAddress) || [];
    userTxs.push(transaction);
    this.transactionsByUser.set(transaction.userAddress, userTxs);
    
    return transaction;
  }

  async updateTransactionStatus(txHash: string, status: string, blockNumber?: number): Promise<void> {
    const transaction = this.transactions.get(txHash);
    if (transaction) {
      transaction.status = status;
      if (blockNumber) {
        transaction.blockNumber = blockNumber;
      }
      if (status === "confirmed") {
        transaction.confirmedAt = new Date();
      }
      this.transactions.set(txHash, transaction);
    }
  }

  async getReferrals(referrerAddress: string): Promise<Referral[]> {
    return this.referralsByUser.get(referrerAddress.toLowerCase()) || [];
  }

  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const id = randomUUID();
    const referral: Referral = {
      ...insertReferral,
      id,
      referrerAddress: insertReferral.referrerAddress.toLowerCase(),
      refereeAddress: insertReferral.refereeAddress.toLowerCase(),
      status: insertReferral.status || "pending",
      createdAt: new Date(),
      paidAt: null,
    };
    
    this.referrals.set(id, referral);
    
    const userReferrals = this.referralsByUser.get(referral.referrerAddress) || [];
    userReferrals.push(referral);
    this.referralsByUser.set(referral.referrerAddress, userReferrals);
    
    return referral;
  }

  async updateReferralStatus(id: string, status: string): Promise<void> {
    const referral = this.referrals.get(id);
    if (referral) {
      referral.status = status;
      if (status === "paid") {
        referral.paidAt = new Date();
      }
      this.referrals.set(id, referral);
    }
  }

  async getLatestPrice(tokenPair: string): Promise<PriceHistory | undefined> {
    const prices = this.priceHistory.get(tokenPair) || [];
    return prices.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
  }

  async createPriceEntry(insertPriceEntry: InsertPriceHistory): Promise<PriceHistory> {
    const id = randomUUID();
    const priceEntry: PriceHistory = {
      ...insertPriceEntry,
      id,
      volume24h: insertPriceEntry.volume24h || null,
      liquidity: insertPriceEntry.liquidity || null,
      timestamp: new Date(),
    };
    
    const prices = this.priceHistory.get(priceEntry.tokenPair) || [];
    prices.push(priceEntry);
    this.priceHistory.set(priceEntry.tokenPair, prices);
    
    return priceEntry;
  }

  async getPriceHistory(tokenPair: string, hours: number): Promise<PriceHistory[]> {
    const prices = this.priceHistory.get(tokenPair) || [];
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return prices
      .filter(p => p.timestamp >= cutoffTime)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

export const storage = new MemStorage();
