import { useState, useEffect, useCallback } from 'react';
import { walletService } from '@/lib/wallet';
import { useToast } from '@/hooks/use-toast';
import type { WalletConnection, TokenBalance, WalletProvider, CreateWalletResult } from '@/types/wallet';

interface WalletState {
  connection: WalletConnection | null;
  balances: TokenBalance[];
  isConnecting: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    connection: null,
    balances: [],
    isConnecting: false,
    isLoading: false,
    error: null,
  });

  const { toast } = useToast();

  // Connect wallet
  const connect = useCallback(async (provider: WalletProvider) => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      console.log(`[WALLET HOOK] Connecting to ${provider}...`);
      
      let connection: WalletConnection;
      
      switch (provider) {
        case 'metamask':
          connection = await walletService.connectMetaMask();
          break;
        case 'walletconnect':
          // TODO: Implement WalletConnect
          throw new Error('WalletConnect not implemented yet');
        case 'trustwallet':
          // Trust Wallet uses the same interface as MetaMask
          connection = await walletService.connectMetaMask();
          break;
        default:
          throw new Error(`Unsupported wallet provider: ${provider}`);
      }
      
      setState(prev => ({ 
        ...prev, 
        connection, 
        isConnecting: false,
        error: null 
      }));
      
      // Fetch balances after connection
      fetchBalances(connection.address);
      
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${provider}`,
      });
      
      console.log(`[WALLET HOOK] ${provider} connected successfully:`, connection.address);
    } catch (error: any) {
      console.error(`[WALLET HOOK] ${provider} connection failed:`, error);
      
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error.message 
      }));
      
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    console.log('[WALLET HOOK] Disconnecting wallet...');
    
    setState({
      connection: null,
      balances: [],
      isConnecting: false,
      isLoading: false,
      error: null,
    });
    
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
    const walletAddress = address || state.connection?.address;
    
    if (!walletAddress) {
      console.warn('[WALLET HOOK] No wallet address available for balance fetch');
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      console.log('[WALLET HOOK] Fetching balances for:', walletAddress);
      
      const balances = await walletService.getTokenBalances(walletAddress);
      
      setState(prev => ({ 
        ...prev, 
        balances, 
        isLoading: false,
        error: null 
      }));
      
      console.log('[WALLET HOOK] Balances updated:', balances);
    } catch (error: any) {
      console.error('[WALLET HOOK] Balance fetch failed:', error);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message 
      }));
    }
  }, []);

  // Get balance for specific token
  const getTokenBalance = useCallback((tokenSymbol: string): string => {
    const balance = state.balances.find(b => b.symbol === tokenSymbol);
    return balance?.balance || '0';
  }, [state.balances]);

  // Check if wallet is connected
  const isConnected = Boolean(state.connection?.isConnected && state.connection?.address);

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            console.log('[WALLET HOOK] Found existing connection:', accounts[0]);
            
            // Get current chain ID
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const numericChainId = parseInt(chainId, 16);
            
            // Recreate connection state
            const existingConnection: WalletConnection = {
              address: accounts[0],
              chainId: numericChainId,
              isConnected: true,
              provider: window.ethereum,
            };
            
            setState(prev => ({
              ...prev,
              connection: existingConnection,
            }));
            
            // Fetch balances for the existing connection
            fetchBalances(accounts[0]);
          }
        } catch (error) {
          console.error('[WALLET HOOK] Failed to check existing connection:', error);
        }
      }
    };
    
    checkExistingConnection();
  }, [fetchBalances]);

  // Auto-fetch balances when connection changes
  useEffect(() => {
    if (isConnected && state.connection?.address) {
      fetchBalances();
    }
  }, [isConnected, state.connection?.address, fetchBalances]);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (state.connection && accounts[0] !== state.connection.address) {
          // Account changed, update connection
          setState(prev => ({
            ...prev,
            connection: prev.connection ? {
              ...prev.connection,
              address: accounts[0]
            } : null
          }));
        }
      };

      const handleChainChanged = (chainId: string) => {
        // Reload the page when chain changes for simplicity
        window.location.reload();
      };

      window.ethereum?.on('accountsChanged', handleAccountsChanged);
      window.ethereum?.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [state.connection, disconnect]);

  return {
    // State
    connection: state.connection,
    balances: state.balances,
    isConnecting: state.isConnecting,
    isLoading: state.isLoading,
    error: state.error,
    isConnected,
    
    // Actions
    connect,
    disconnect,
    createWallet,
    fetchBalances,
    getTokenBalance,
  };
}
