import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { pancakeSwapService } from '@/lib/pancakeswap';
import type { PriceData } from '@/types/swap';

interface PriceState {
  yhtPrice: PriceData | null;
  bnbPrice: PriceData | null;
  isLoading: boolean;
  error: string | null;
}

export function usePrices() {
  const queryClient = useQueryClient();
  
  // Fetch YHT price from PancakeSwap
  const { data: yhtPriceData, isLoading: isYhtLoading, error: yhtError } = useQuery({
    queryKey: ['/api/prices', 'YHT/USDT'],
    queryFn: async () => {
      console.log('[PRICES HOOK] Fetching YHT price...');
      const result = await pancakeSwapService.getCurrentPrice('YHT/USDT');
      
      // Fetch real 24h data from PancakeSwap API
      const real24hData = await pancakeSwapService.get24hData('0x3279eF4614f241a389114c77cdd28b70fca9537a');
      
      const priceData: PriceData = {
        price: result.price,
        change24h: result.change24h,
        volume24h: real24hData.volume24h,
        liquidity: real24hData.liquidity,
        lastUpdated: new Date(),
      };
      
      console.log('[PRICES HOOK] YHT price fetched:', priceData);
      return priceData;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider stale after 25 seconds
  });

  // Fetch BNB price from external API
  const { data: bnbPriceData, isLoading: isBnbLoading, error: bnbError } = useQuery({
    queryKey: ['/api/prices', 'BNB'],
    queryFn: async () => {
      console.log('[PRICES HOOK] Fetching BNB price...');
      
      try {
        // Use CoinGecko API for BNB price
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd&include_24hr_change=true'
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch BNB price');
        }
        
        const data = await response.json();
        const bnbData = data.binancecoin;
        
        const priceData: PriceData = {
          price: bnbData.usd.toString(),
          change24h: bnbData.usd_24h_change?.toFixed(2) || '0',
          volume24h: '0', // Not provided by this endpoint
          liquidity: '0', // Not applicable for BNB
          lastUpdated: new Date(),
        };
        
        console.log('[PRICES HOOK] BNB price fetched:', priceData);
        return priceData;
      } catch (error) {
        console.error('[PRICES HOOK] BNB price fetch failed:', error);
        // Fallback to a default price
        return {
          price: '635.42',
          change24h: '+2.1',
          volume24h: '0',
          liquidity: '0',
          lastUpdated: new Date(),
        };
      }
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 55000, // Consider stale after 55 seconds
  });

  // Manual price refresh
  const refreshPrices = useCallback(() => {
    console.log('[PRICES HOOK] Manually refreshing prices...');
    queryClient.invalidateQueries({ queryKey: ['/api/prices'] });
  }, [queryClient]);

  // Format price for display
  const formatPrice = useCallback((price: string, decimals: number = 6): string => {
    const num = parseFloat(price);
    if (num === 0) return '0.00';
    if (num < 0.000001) return num.toExponential(2);
    return num.toFixed(decimals);
  }, []);

  // Format change percentage
  const formatChange = useCallback((change: string): { value: string; isPositive: boolean } => {
    const num = parseFloat(change);
    const isPositive = num >= 0;
    const formatted = `${isPositive ? '+' : ''}${num.toFixed(2)}%`;
    
    return { value: formatted, isPositive };
  }, []);

  // Calculate USD value
  const calculateUsdValue = useCallback((amount: string, tokenSymbol: string): string => {
    let price = '0';
    
    if (tokenSymbol === 'YHT' && yhtPriceData) {
      price = yhtPriceData.price;
    } else if (tokenSymbol === 'BNB' && bnbPriceData) {
      price = bnbPriceData.price;
    } else if (tokenSymbol === 'USDT') {
      price = '1'; // USDT is pegged to $1
    }
    
    const usdValue = parseFloat(amount) * parseFloat(price);
    return usdValue.toFixed(2);
  }, [yhtPriceData, bnbPriceData]);

  return {
    // Price data
    yhtPrice: yhtPriceData || null,
    bnbPrice: bnbPriceData || null,
    
    // Loading states
    isLoading: isYhtLoading || isBnbLoading,
    
    // Error states
    error: yhtError?.message || bnbError?.message || null,
    
    // Utility functions
    refreshPrices,
    formatPrice,
    formatChange,
    calculateUsdValue,
  };
}
