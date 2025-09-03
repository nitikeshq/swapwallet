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

  // Connect wallet - simplified for instant updates
  const connect = useCallback(async (provider: WalletProvider) => {
    console.log(`[WALLET HOOK] Connecting to ${provider}...`);
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
      
      // Immediately update connection state
      setConnection(walletConnection);
      setIsConnecting(false);
      console.log('[WALLET HOOK] Wallet connected instantly:', walletConnection.address);
      
      // Show success message
      toast({
        title: "Wallet Connected",
        description: `Connected to ${walletConnection.address.slice(0, 6)}...${walletConnection.address.slice(-4)}`,
      });
      
      // Fetch balances in background (don't wait for this)
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

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (window.ethereum && !connection) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            console.log('[WALLET HOOK] Found existing connection:', accounts[0]);
            
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const existingConnection: WalletConnection = {
              address: accounts[0],
              chainId: parseInt(chainId, 16),
              isConnected: true,
              provider: window.ethereum,
            };
            
            // Immediately set connection
            setConnection(existingConnection);
            
            // Fetch balances in background
            fetchBalances(accounts[0]);
          }
        } catch (error) {
          console.error('[WALLET HOOK] Failed to check existing connection:', error);
        }
      }
    };
    
    checkExistingConnection();
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
