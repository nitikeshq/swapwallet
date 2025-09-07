import { useState, useEffect, useCallback } from 'react';
import { walletService } from '@/lib/wallet';
import { useToast } from '@/hooks/use-toast';
import { BSC_CHAIN_ID } from '@/constants/tokens';
import type { WalletConnection, TokenBalance, WalletProvider, CreateWalletResult } from '@/types/wallet';

export function useWallet() {
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  // Simple derived state
  const isConnected = Boolean(connection?.isConnected && connection?.address);

  // Connect wallet - FORCE instant state updates
  const connect = useCallback(async (provider: WalletProvider) => {
    console.log(`[WALLET HOOK] FORCING connection to ${provider}...`);
    setIsConnecting(true);
    setError(null);
    
    try {
      let walletConnection: WalletConnection;
      
      switch (provider) {
        case 'metamask':
          walletConnection = await walletService.connectMetaMask();
          break;
        case 'walletconnect':
          throw new Error('WalletConnect not implemented yet');
        case 'trustwallet':
          walletConnection = await walletService.connectMetaMask();
          break;
        default:
          throw new Error(`Unsupported wallet provider: ${provider}`);
      }
      
      console.log('[WALLET HOOK] FORCING STATE UPDATE - Connection result:', walletConnection);
      
      // FORCE multiple state updates to ensure it sticks
      setConnection(walletConnection);
      setIsConnecting(false);
      setError(null);
      
      // Force a re-render by updating state multiple times
      setTimeout(() => {
        console.log('[WALLET HOOK] Second state force update');
        setConnection(walletConnection);
      }, 100);
      
      console.log('[WALLET HOOK] Wallet state FORCED - address:', walletConnection.address);
      
      // Show success message
      toast({
        title: "Wallet Connected!",
        description: `Connected to ${walletConnection.address.slice(0, 6)}...${walletConnection.address.slice(-4)}`,
      });
      
      // Fetch balances in background
      fetchBalances(walletConnection.address).catch(err => {
        console.error('[WALLET HOOK] Background balance fetch failed:', err);
      });
      
    } catch (error: any) {
      console.error(`[WALLET HOOK] ${provider} connection failed:`, error);
      const errorMessage = error?.message || `Failed to connect to ${provider}`;
      
      setIsConnecting(false);
      setError(errorMessage);
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    console.log('[WALLET HOOK] Disconnecting wallet...');
    
    setConnection(null);
    setBalances([]);
    setIsConnecting(false);
    setIsLoading(false);
    setError(null);
    
    toast({
      title: "Wallet Disconnected",
      description: "Successfully disconnected from wallet",
    });
  }, [toast]);

  // Create new wallet
  const createWallet = useCallback(async (password?: string): Promise<CreateWalletResult> => {
    try {
      console.log('[WALLET HOOK] Creating new wallet...');
      
      const result = await walletService.createWallet(password);
      
      toast({
        title: "Wallet Created",
        description: "New wallet created successfully. Save your recovery phrase!",
      });
      
      return result;
    } catch (error: any) {
      console.error('[WALLET HOOK] Wallet creation failed:', error);
      
      toast({
        title: "Wallet Creation Failed",
        description: error.message,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [toast]);

  // Fetch token balances
  const fetchBalances = useCallback(async (address?: string) => {
    const walletAddress = address || connection?.address;
    
    if (!walletAddress) {
      console.warn('[WALLET HOOK] No wallet address available for balance fetch');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('[WALLET HOOK] Fetching balances for:', walletAddress);
      const tokenBalances = await walletService.getTokenBalances(walletAddress);
      
      setBalances(tokenBalances);
      setIsLoading(false);
      console.log('[WALLET HOOK] Balances updated:', tokenBalances);
    } catch (error: any) {
      console.error('[WALLET HOOK] Balance fetch failed:', error);
      setIsLoading(false);
    }
  }, [connection?.address]);

  // Connect created wallet automatically
  const connectCreatedWallet = useCallback(async (walletData: CreateWalletResult, password: string) => {
    try {
      console.log('[WALLET HOOK] Connecting created wallet...', walletData.address);
      
      // Create wallet connection from the created wallet data
      const walletConnection: WalletConnection = {
        address: walletData.address,
        chainId: BSC_CHAIN_ID,
        isConnected: true,
        provider: null, // Local wallet, no external provider
      };
      
      console.log('[WALLET HOOK] 🎯 SETTING CONNECTION STATE:', walletConnection);
      
      // Store encrypted wallet locally
      if (password && walletData.privateKey) {
        await walletService.storeEncryptedWallet(walletData.address, walletData.privateKey, walletData.mnemonic, password);
        console.log('[WALLET HOOK] Wallet encrypted and stored locally');
      }
      
      // Update connection state AGGRESSIVELY
      setConnection(walletConnection);
      setIsConnecting(false);
      setError(null);
      
      // Force multiple state updates to ensure it sticks
      setTimeout(() => {
        console.log('[WALLET HOOK] Second state force update');
        setConnection(walletConnection);
      }, 50);
      
      setTimeout(() => {
        console.log('[WALLET HOOK] Third state force update');
        setConnection(walletConnection);
      }, 200);
      
      console.log('[WALLET HOOK] 🎉 Created wallet connected successfully - State should be updated');
      
      // Show success toast
      toast({
        title: "Wallet Connected!",
        description: `Connected to ${walletConnection.address.slice(0, 6)}...${walletConnection.address.slice(-4)}`,
      });
      
      // Fetch balances in background
      fetchBalances(walletConnection.address).catch(err => {
        console.error('[WALLET HOOK] Background balance fetch failed:', err);
      });
      
    } catch (error: any) {
      console.error('[WALLET HOOK] Failed to connect created wallet:', error);
      
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [toast, fetchBalances]);

  // Get balance for specific token
  const getTokenBalance = useCallback((tokenSymbol: string): string => {
    const balance = balances.find(b => b.symbol === tokenSymbol);
    return balance?.balance || '0';
  }, [balances]);

  // Check for existing wallet connections (MetaMask and local wallets)
  useEffect(() => {
    const checkExistingConnections = async () => {
      console.log('[WALLET HOOK] 🔍 Checking for existing wallet connections...');
      
      // First, check for locally stored wallets
      const localWallets = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('wallet_')) {
          const address = key.replace('wallet_', '');
          // Ensure proper 0x prefix
          const formattedAddress = address.startsWith('0x') ? address : `0x${address}`;
          localWallets.push(formattedAddress);
        }
      }
      
      if (localWallets.length > 0) {
        console.log('[WALLET HOOK] 🎯 FOUND LOCAL WALLET(S):', localWallets);
        
        // Use the first local wallet found  
        const address = localWallets[0]; // Already formatted with 0x prefix
        const walletConnection: WalletConnection = {
          address: address,
          chainId: BSC_CHAIN_ID,
          isConnected: true,
          provider: null, // Local wallet
        };
        
        console.log('[WALLET HOOK] 🚀 CONNECTING TO LOCAL WALLET:', walletConnection);
        setConnection(walletConnection);
        setIsConnecting(false);
        setError(null);
        
        // Fetch balances
        fetchBalances(walletConnection.address);
        return; // Found local wallet, skip MetaMask check
      }
      
      // If no local wallet, check for MetaMask
      console.log('[WALLET HOOK] No local wallets found, checking MetaMask...');
      
      // Multiple ways to check for MetaMask
      const ethereum = (window as any).ethereum || (window as any).web3?.currentProvider;
      const hasMetaMask = !!ethereum;
      
      console.log('[WALLET HOOK] MetaMask detection:', {
        windowEthereum: !!(window as any).ethereum,
        web3Provider: !!(window as any).web3?.currentProvider,
        hasMetaMask,
        ethereumObject: ethereum
      });
      
      if (hasMetaMask) {
        try {
          // TRY MULTIPLE account request methods
          let accounts = null;
          
          try {
            accounts = await ethereum.request({ method: 'eth_accounts' });
            console.log('[WALLET HOOK] eth_accounts result:', accounts);
          } catch (e) {
            console.log('[WALLET HOOK] eth_accounts failed, trying alternative:', e);
          }
          
          // If no accounts, try alternative methods
          if (!accounts || accounts.length === 0) {
            try {
              accounts = await ethereum.enable?.();
              console.log('[WALLET HOOK] ethereum.enable result:', accounts);
            } catch (e) {
              console.log('[WALLET HOOK] ethereum.enable failed:', e);
            }
          }
          
          if (accounts && accounts.length > 0) {
            const chainId = await ethereum.request({ method: 'eth_chainId' });
            const existingConnection: WalletConnection = {
              address: accounts[0],
              chainId: parseInt(chainId, 16),
              isConnected: true,
              provider: ethereum,
            };
            
            console.log('[WALLET HOOK] 🎯 WALLET FOUND! Forcing connection:', existingConnection);
            
            // TRIPLE force update
            setConnection(existingConnection);
            setIsConnecting(false);
            setError(null);
            
            // Additional force updates with delays
            setTimeout(() => setConnection(existingConnection), 50);
            setTimeout(() => setConnection(existingConnection), 200);
            
            fetchBalances(accounts[0]);
          } else {
            console.log('[WALLET HOOK] No MetaMask accounts available');
          }
        } catch (error) {
          console.error('[WALLET HOOK] MetaMask check error:', error);
        }
      } else {
        console.log('[WALLET HOOK] ❌ MetaMask not detected at all');
      }
    };
    
    // Check immediately on component mount
    checkExistingConnections();
    
    // Check for connections on window load
    if (document.readyState === 'loading') {
      window.addEventListener('load', checkExistingConnections);
    }
    
    return () => {
      if (document.readyState === 'loading') {
        window.removeEventListener('load', checkExistingConnections);
      }
    };
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (connection && accounts[0] !== connection.address) {
          // Account changed, update connection immediately
          setConnection(prev => prev ? { ...prev, address: accounts[0] } : null);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum?.on('accountsChanged', handleAccountsChanged);
      window.ethereum?.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [connection, disconnect]);

  return {
    // State
    connection,
    balances,
    isConnecting,
    isLoading,
    error,
    isConnected,
    
    // Actions
    connect,
    disconnect,
    createWallet,
    connectCreatedWallet,
    fetchBalances,
    getTokenBalance,
  };
}
