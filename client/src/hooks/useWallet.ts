import { useState, useEffect, useCallback } from 'react';
import { walletService } from '@/lib/wallet';
import { useToast } from '@/hooks/use-toast';
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
  const createWallet = useCallback(async (): Promise<CreateWalletResult> => {
    try {
      console.log('[WALLET HOOK] Creating new wallet...');
      
      const result = await walletService.createWallet();
      
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

  // Get balance for specific token
  const getTokenBalance = useCallback((tokenSymbol: string): string => {
    const balance = balances.find(b => b.symbol === tokenSymbol);
    return balance?.balance || '0';
  }, [balances]);

  // MEGA AGGRESSIVE MetaMask detection - check multiple ways
  useEffect(() => {
    const checkMetaMaskConnection = async () => {
      console.log('[WALLET HOOK] MEGA CHECK - looking for MetaMask...');
      
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
    
    // Check immediately
    checkMetaMaskConnection();
    
    // Keep checking aggressively
    const interval = setInterval(checkMetaMaskConnection, 1000);
    
    // Also check when window loads
    if (document.readyState === 'loading') {
      window.addEventListener('load', checkMetaMaskConnection);
    }
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('load', checkMetaMaskConnection);
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
    fetchBalances,
    getTokenBalance,
  };
}
