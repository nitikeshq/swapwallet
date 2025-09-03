import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { pancakeSwapService } from '@/lib/pancakeswap';
import { walletService } from '@/lib/wallet';
import { PANCAKESWAP_CONTRACTS } from '@/constants/tokens';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { SwapQuote, SwapTransaction } from '@/types/swap';

interface SwapState {
  quote: SwapQuote | null;
  isGettingQuote: boolean;
  isSwapping: boolean;
  error: string | null;
}

export function useSwap() {
  const [state, setState] = useState<SwapState>({
    quote: null,
    isGettingQuote: false,
    isSwapping: false,
    error: null,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get swap quote
  const getQuote = useCallback(async (
    fromToken: string,
    toToken: string,
    fromAmount: string,
    slippage: number = 0.5
  ) => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setState(prev => ({ ...prev, quote: null, error: null }));
      return;
    }

    setState(prev => ({ ...prev, isGettingQuote: true, error: null }));

    try {
      console.log('[SWAP HOOK] Getting quote:', { fromToken, toToken, fromAmount, slippage });
      
      const quote = await pancakeSwapService.getSwapQuote(
        fromToken,
        toToken,
        fromAmount,
        slippage
      );

      setState(prev => ({ 
        ...prev, 
        quote, 
        isGettingQuote: false,
        error: null 
      }));

      console.log('[SWAP HOOK] Quote received:', quote);
    } catch (error: any) {
      console.error('[SWAP HOOK] Quote failed:', error);
      
      setState(prev => ({ 
        ...prev, 
        quote: null,
        isGettingQuote: false, 
        error: error.message 
      }));
    }
  }, []);

  // Execute swap mutation
  const swapMutation = useMutation({
    mutationFn: async ({ 
      quote, 
      userAddress, 
      referralCode 
    }: { 
      quote: SwapQuote; 
      userAddress: string; 
      referralCode?: string;
    }) => {
      console.log('[SWAP HOOK] Executing swap:', { quote, userAddress, referralCode });
      
      // Get signer from MetaMask
      if (!window.ethereum) {
        throw new Error('No wallet connected');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Check and approve token if needed
      if (quote.fromToken !== 'BNB') {
        await checkAndApproveToken(quote, userAddress, signer);
      }

      // Execute the swap
      const swapTx = await pancakeSwapService.executeSwap(quote, userAddress, signer);
      
      // Save transaction to database
      await apiRequest('POST', '/api/transactions', {
        userAddress,
        txHash: swapTx.hash,
        fromToken: quote.fromToken,
        toToken: quote.toToken,
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        status: 'pending',
      });

      // Process referral if applicable
      if (referralCode) {
        await processReferral(referralCode, swapTx, quote);
      }

      return swapTx;
    },
    onSuccess: (swapTx) => {
      console.log('[SWAP HOOK] Swap successful:', swapTx.hash);
      
      // RESET LOADING STATE IMMEDIATELY
      setState(prev => ({ ...prev, isSwapping: false }));
      
      toast({
        title: "Swap Submitted",
        description: `Transaction submitted: ${swapTx.hash.slice(0, 10)}...`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      // Monitor transaction status
      monitorTransaction(swapTx.hash);
    },
    onError: (error: any) => {
      console.error('[SWAP HOOK] Swap failed:', error);
      
      // RESET LOADING STATE ON ERROR TOO
      setState(prev => ({ ...prev, isSwapping: false }));
      
      toast({
        title: "Swap Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check and approve token spending
  const checkAndApproveToken = async (
    quote: SwapQuote,
    userAddress: string,
    signer: ethers.Signer
  ) => {
    const fromToken = quote.fromToken;
    if (fromToken === 'BNB') return; // BNB doesn't need approval

    console.log('[SWAP HOOK] Checking token allowance...');

    // TODO: Implement token approval logic
    // const tokenAddress = TOKENS[fromToken].address;
    // const allowance = await walletService.checkAllowance(
    //   tokenAddress,
    //   userAddress,
    //   PANCAKESWAP_CONTRACTS.ROUTER_V2
    // );
    
    // if (parseFloat(allowance) < parseFloat(quote.fromAmount)) {
    //   await walletService.approveToken(
    //     tokenAddress,
    //     PANCAKESWAP_CONTRACTS.ROUTER_V2,
    //     quote.fromAmount,
    //     signer
    //   );
    // }
  };

  // Process referral commission
  const processReferral = async (
    referralCode: string,
    swapTx: SwapTransaction,
    quote: SwapQuote
  ) => {
    try {
      console.log('[SWAP HOOK] Processing referral:', referralCode);
      
      // Validate referral code
      const response = await apiRequest('GET', `/api/referral-code/${referralCode}`);
      const { referrer } = await response.json();
      
      // Calculate commission (10% of swap amount in USDT)
      const commissionRate = 0.1;
      let commissionAmount = '0';
      
      if (quote.fromToken === 'USDT') {
        commissionAmount = (parseFloat(quote.fromAmount) * commissionRate).toString();
      } else if (quote.toToken === 'USDT') {
        commissionAmount = (parseFloat(quote.toAmount) * commissionRate).toString();
      }
      
      if (parseFloat(commissionAmount) > 0) {
        await apiRequest('POST', '/api/referrals', {
          referrerAddress: referrer,
          refereeAddress: swapTx.hash, // Use tx hash as unique identifier
          transactionId: swapTx.hash,
          commissionAmount,
          commissionToken: 'USDT',
        });
        
        console.log('[SWAP HOOK] Referral processed:', { referrer, commissionAmount });
      }
    } catch (error) {
      console.error('[SWAP HOOK] Referral processing failed:', error);
      // Don't throw - referral failure shouldn't stop the swap
    }
  };

  // Monitor transaction status
  const monitorTransaction = async (txHash: string) => {
    console.log('[SWAP HOOK] Monitoring transaction:', txHash);
    
    const checkStatus = async () => {
      try {
        const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
        const receipt = await provider.getTransactionReceipt(txHash);
        
        if (receipt) {
          const status = receipt.status === 1 ? 'confirmed' : 'failed';
          
          // Update transaction status in database
          await apiRequest('PATCH', `/api/transactions/${txHash}/status`, {
            status,
            blockNumber: receipt.blockNumber,
          });
          
          toast({
            title: status === 'confirmed' ? "Swap Confirmed" : "Swap Failed",
            description: `Transaction ${status}: ${txHash.slice(0, 10)}...`,
            variant: status === 'confirmed' ? "default" : "destructive",
          });
          
          console.log('[SWAP HOOK] Transaction status updated:', status);
        } else {
          // Transaction still pending, check again in 5 seconds
          setTimeout(checkStatus, 5000);
        }
      } catch (error) {
        console.error('[SWAP HOOK] Transaction monitoring failed:', error);
        // Retry in 10 seconds
        setTimeout(checkStatus, 10000);
      }
    };
    
    // Start monitoring
    setTimeout(checkStatus, 5000);
  };

  // Execute swap
  const executeSwap = useCallback((
    userAddress: string,
    referralCode?: string
  ) => {
    if (!state.quote) {
      throw new Error('No quote available');
    }

    setState(prev => ({ ...prev, isSwapping: true }));
    
    swapMutation.mutate({ 
      quote: state.quote, 
      userAddress, 
      referralCode 
    });
  }, [state.quote, swapMutation]);

  // Clear current quote
  const clearQuote = useCallback(() => {
    setState(prev => ({ ...prev, quote: null, error: null }));
  }, []);

  return {
    // State
    quote: state.quote,
    isGettingQuote: state.isGettingQuote,
    isSwapping: state.isSwapping || swapMutation.isPending,
    error: state.error,
    
    // Actions
    getQuote,
    executeSwap,
    clearQuote,
  };
}
