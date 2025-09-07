import { ethers } from 'ethers';
import { TOKENS, BSC_CHAIN_ID, RPC_URLS } from '@/constants/tokens';
import type { CreateWalletResult, TokenBalance, WalletConnection } from '@/types/wallet';

// ERC-20 ABI for balance checking
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

export class WalletService {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URLS.BSC_MAINNET);
  }

  // Create a new wallet with mnemonic
  async createWallet(password?: string): Promise<CreateWalletResult> {
    try {
      console.log('[WALLET] Creating new wallet...');
      
      const wallet = ethers.Wallet.createRandom();
      
      const result = {
        mnemonic: wallet.mnemonic?.phrase || '',
        address: wallet.address,
        privateKey: wallet.privateKey,
      };
      
      console.log('[WALLET] New wallet created:', result.address);
      return result;
    } catch (error) {
      console.error('[WALLET ERROR] Failed to create wallet:', error);
      throw new Error('Failed to create wallet');
    }
  }

  // Store encrypted wallet in local storage
  async storeEncryptedWallet(address: string, privateKey: string, mnemonic: string, password: string): Promise<void> {
    try {
      console.log('[WALLET] Storing encrypted wallet...');
      
      // Create a wallet object to encrypt
      const walletData = {
        address,
        privateKey,
        mnemonic,
        createdAt: new Date().toISOString(),
      };
      
      // Simple encryption using btoa (base64) - in production, use proper encryption
      const encrypted = btoa(JSON.stringify(walletData) + ':' + password);
      
      // Store in localStorage with address as key
      localStorage.setItem(`wallet_${address.toLowerCase()}`, encrypted);
      
      console.log('[WALLET] Wallet stored successfully');
    } catch (error) {
      console.error('[WALLET ERROR] Failed to store encrypted wallet:', error);
      throw new Error('Failed to store wallet');
    }
  }

  // Import wallet from mnemonic
  async importWalletFromMnemonic(mnemonic: string): Promise<ethers.HDNodeWallet> {
    try {
      console.log('[WALLET] Importing wallet from mnemonic...');
      
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      console.log('[WALLET] Wallet imported:', wallet.address);
      
      return wallet as ethers.HDNodeWallet;
    } catch (error) {
      console.error('[WALLET ERROR] Failed to import wallet:', error);
      throw new Error('Invalid mnemonic phrase');
    }
  }

  // Connect to MetaMask
  async connectMetaMask(): Promise<WalletConnection> {
    try {
      console.log('[WALLET] Connecting to MetaMask...');
      
      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask extension.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available. Please unlock MetaMask.');
      }

      console.log('[WALLET] Accounts found:', accounts);

      // Check network
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      const numericChainId = parseInt(chainId, 16);
      console.log('[WALLET] Current network:', numericChainId, 'Target:', BSC_CHAIN_ID);

      // Switch to BSC if needed
      if (numericChainId !== BSC_CHAIN_ID) {
        console.log('[WALLET] Switching to BSC network...');
        await this.switchToBSC();
        // Get the chain ID again after switch
        const newChainId = await window.ethereum.request({
          method: 'eth_chainId',
        });
        console.log('[WALLET] Network switched to:', parseInt(newChainId, 16));
      }

      const connection: WalletConnection = {
        address: accounts[0],
        chainId: BSC_CHAIN_ID,
        isConnected: true,
        provider: window.ethereum,
      };

      console.log('[WALLET] MetaMask connected successfully:', connection.address);
      return connection;
    } catch (error: any) {
      console.error('[WALLET ERROR] MetaMask connection failed - Full error:', error);
      console.error('[WALLET ERROR] Error type:', typeof error);
      console.error('[WALLET ERROR] Error keys:', Object.keys(error || {}));
      
      // Provide better error messages
      if (error && error.code === 4001) {
        throw new Error('Connection rejected by user');
      } else if (error && error.code === -32002) {
        throw new Error('Connection request already pending');
      } else if (error && error.message && typeof error.message === 'string') {
        throw new Error(error.message);
      } else {
        // Default error with more context
        const errorMsg = `Failed to connect to MetaMask. Error details: ${JSON.stringify(error)}`;
        console.error('[WALLET ERROR] Throwing error:', errorMsg);
        throw new Error(errorMsg);
      }
    }
  }

  // Switch to BSC network
  async switchToBSC(): Promise<void> {
    try {
      console.log('[WALLET] Switching to BSC network...');
      
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${BSC_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchError: any) {
      // Network doesn't exist, add it
      if (switchError.code === 4902) {
        await window.ethereum?.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${BSC_CHAIN_ID.toString(16)}`,
              chainName: 'Binance Smart Chain',
              nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18,
              },
              rpcUrls: [RPC_URLS.BSC_MAINNET],
              blockExplorerUrls: ['https://bscscan.com'],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }

  // Get token balances for an address
  async getTokenBalances(address: string): Promise<TokenBalance[]> {
    try {
      console.log('[WALLET] Fetching token balances for:', address);
      
      const balances: TokenBalance[] = [];

      // Get BNB balance
      const bnbBalance = await this.provider.getBalance(address);
      balances.push({
        symbol: 'BNB',
        address: 'native',
        balance: ethers.formatEther(bnbBalance),
        decimals: 18,
      });

      // Get token balances
      for (const [symbol, token] of Object.entries(TOKENS)) {
        if (symbol === 'BNB') continue; // Skip BNB as we handled it above
        
        try {
          const contract = new ethers.Contract(token.address, ERC20_ABI, this.provider);
          const balance = await contract.balanceOf(address);
          const decimals = await contract.decimals();
          
          balances.push({
            symbol: token.symbol,
            address: token.address,
            balance: ethers.formatUnits(balance, decimals),
            decimals,
          });
        } catch (error) {
          console.warn(`[WALLET] Failed to get ${symbol} balance:`, error);
          // Add zero balance if contract call fails
          balances.push({
            symbol: token.symbol,
            address: token.address,
            balance: '0',
            decimals: token.decimals,
          });
        }
      }

      console.log('[WALLET] Token balances fetched:', balances);
      return balances;
    } catch (error) {
      console.error('[WALLET ERROR] Failed to fetch token balances:', error);
      throw error;
    }
  }

  // Check token allowance
  async checkAllowance(
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string
  ): Promise<string> {
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const allowance = await contract.allowance(ownerAddress, spenderAddress);
      return ethers.formatEther(allowance);
    } catch (error) {
      console.error('[WALLET ERROR] Failed to check allowance:', error);
      return '0';
    }
  }

  // Approve token spending
  async approveToken(
    tokenAddress: string,
    spenderAddress: string,
    amount: string,
    signer: ethers.Signer
  ): Promise<string> {
    try {
      console.log('[WALLET] Approving token spending:', { tokenAddress, spenderAddress, amount });
      
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const tx = await contract.approve(spenderAddress, ethers.parseEther(amount));
      
      console.log('[WALLET] Approval transaction sent:', tx.hash);
      await tx.wait();
      
      console.log('[WALLET] Token approval confirmed');
      return tx.hash;
    } catch (error) {
      console.error('[WALLET ERROR] Token approval failed:', error);
      throw error;
    }
  }
}

export const walletService = new WalletService();
