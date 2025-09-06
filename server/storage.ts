import { 
  type User, 
  type InsertUser, 
  type Transaction, 
  type InsertTransaction,
  type Referral,
  type InsertReferral,
  type PriceHistory,
  type InsertPriceHistory,
  type AdminSetting,
  type InsertAdminSetting
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management
  getUser(walletAddress: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserEarnings(walletAddress: string, amount: string): Promise<void>;
  checkAndAwardMilestone(walletAddress: string): Promise<boolean>;
  claimBtcBonus(walletAddress: string): Promise<void>;

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

  // Admin settings
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  createOrUpdateAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting>;
  getAllAdminSettings(): Promise<AdminSetting[]>;
  
  // Admin analytics
  getAllUsers(): Promise<User[]>;
  getAllTransactions(limit?: number): Promise<Transaction[]>;
  getAllReferrals(limit?: number): Promise<Referral[]>;
  getTotalProfit(): Promise<{ totalVolume: string; totalFees: string; totalCommissions: string; }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private usersByReferralCode: Map<string, User>;
  private transactions: Map<string, Transaction>;
  private transactionsByUser: Map<string, Transaction[]>;
  private referrals: Map<string, Referral>;
  private referralsByUser: Map<string, Referral[]>;
  private priceHistory: Map<string, PriceHistory[]>;
  private adminSettings: Map<string, AdminSetting>;

  constructor() {
    this.users = new Map();
    this.usersByReferralCode = new Map();
    this.transactions = new Map();
    this.transactionsByUser = new Map();
    this.referrals = new Map();
    this.referralsByUser = new Map();
    this.priceHistory = new Map();
    this.adminSettings = new Map();
    
    // Initialize default admin settings synchronously
    this.initializeDefaultSettings();
  }

  private initializeDefaultSettings() {
    // Set default YHT token contract address
    const yhtSetting: AdminSetting = {
      id: randomUUID(),
      settingKey: "YHT_CONTRACT_ADDRESS",
      settingValue: "0x3279eF4614f241a389114c77cdd28b70fca9537a",
      description: "YHT Token Contract Address on BSC",
      updatedAt: new Date(),
      createdAt: new Date(),
    };
    this.adminSettings.set("YHT_CONTRACT_ADDRESS", yhtSetting);
    
    const usdtSetting: AdminSetting = {
      id: randomUUID(),
      settingKey: "USDT_CONTRACT_ADDRESS", 
      settingValue: "0x55d398326f99059fF775485246999027B3197955",
      description: "USDT Token Contract Address on BSC",
      updatedAt: new Date(),
      createdAt: new Date(),
    };
    this.adminSettings.set("USDT_CONTRACT_ADDRESS", usdtSetting);
    
    const lpSetting: AdminSetting = {
      id: randomUUID(),
      settingKey: "LP_PAIR_ADDRESS",
      settingValue: "0x6fd64bd3c577b9613ee293d38e6018536d05c799",
      description: "YHT/USDT LP Pair Address",
      updatedAt: new Date(),
      createdAt: new Date(),
    };
    this.adminSettings.set("LP_PAIR_ADDRESS", lpSetting);
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
      milestoneAchieved: insertUser.milestoneAchieved || false,
      btcBonusClaimed: insertUser.btcBonusClaimed || false,
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
      
      // Check for milestone achievement after updating earnings
      await this.checkAndAwardMilestone(walletAddress);
    }
  }

  async checkAndAwardMilestone(walletAddress: string): Promise<boolean> {
    const user = this.users.get(walletAddress.toLowerCase());
    if (!user) return false;
    
    const totalEarnings = parseFloat(user.totalEarnings || "0");
    const MILESTONE_THRESHOLD = 200000; // $200,000
    
    // Check if user has reached milestone but hasn't been awarded yet
    if (totalEarnings >= MILESTONE_THRESHOLD && !user.milestoneAchieved) {
      user.milestoneAchieved = true;
      this.users.set(walletAddress.toLowerCase(), user);
      
      console.log(`[STORAGE] Milestone achieved for user ${walletAddress}: $${totalEarnings}`);
      return true;
    }
    
    return false;
  }

  async claimBtcBonus(walletAddress: string): Promise<void> {
    const user = this.users.get(walletAddress.toLowerCase());
    if (user && user.milestoneAchieved && !user.btcBonusClaimed) {
      user.btcBonusClaimed = true;
      this.users.set(walletAddress.toLowerCase(), user);
      
      console.log(`[STORAGE] BTC bonus claimed for user ${walletAddress}`);
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
      burningFee: insertTransaction.burningFee || "0",
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

  // Admin settings methods
  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    return this.adminSettings.get(key);
  }

  async createOrUpdateAdminSetting(insertSetting: InsertAdminSetting): Promise<AdminSetting> {
    const existing = this.adminSettings.get(insertSetting.settingKey);
    
    const setting: AdminSetting = {
      id: existing?.id || randomUUID(),
      settingKey: insertSetting.settingKey,
      settingValue: insertSetting.settingValue,
      description: insertSetting.description || null,
      updatedAt: new Date(),
      createdAt: existing?.createdAt || new Date(),
    };
    
    this.adminSettings.set(setting.settingKey, setting);
    return setting;
  }

  async getAllAdminSettings(): Promise<AdminSetting[]> {
    return Array.from(this.adminSettings.values())
      .sort((a, b) => a.settingKey.localeCompare(b.settingKey));
  }

  // Admin analytics methods
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllTransactions(limit = 100): Promise<Transaction[]> {
    const allTransactions: Transaction[] = [];
    const userTxsArrays = Array.from(this.transactionsByUser.values());
    for (const userTxs of userTxsArrays) {
      allTransactions.push(...userTxs);
    }
    
    return allTransactions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getAllReferrals(limit = 100): Promise<Referral[]> {
    const allReferrals: Referral[] = [];
    const userReferralArrays = Array.from(this.referralsByUser.values());
    for (const userReferrals of userReferralArrays) {
      allReferrals.push(...userReferrals);
    }
    
    return allReferrals
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getTotalProfit(): Promise<{ totalVolume: string; totalFees: string; totalCommissions: string; }> {
    const allTransactions = await this.getAllTransactions(1000);
    const allReferrals = await this.getAllReferrals(1000);
    
    let totalVolume = 0;
    let totalFees = 0;
    let totalCommissions = 0;
    
    // Calculate total trading volume and burning fees
    for (const tx of allTransactions) {
      const fromAmount = parseFloat(tx.fromAmount);
      const burningFee = parseFloat(tx.burningFee || "0");
      
      totalVolume += fromAmount;
      totalFees += burningFee;
    }
    
    // Calculate total referral commissions
    for (const referral of allReferrals) {
      const commission = parseFloat(referral.commissionAmount);
      totalCommissions += commission;
    }
    
    return {
      totalVolume: totalVolume.toString(),
      totalFees: totalFees.toString(),
      totalCommissions: totalCommissions.toString(),
    };
  }
}

export const storage = new MemStorage();
