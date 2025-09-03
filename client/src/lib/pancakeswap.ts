import { ethers } from 'ethers';
import { TOKENS, PANCAKESWAP_CONTRACTS, BSC_CHAIN_ID } from '@/constants/tokens';
import type { SwapQuote, SwapTransaction } from '@/types/swap';

// PancakeSwap Router V2 ABI (minimal)
const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
  'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
  'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
];

// Pair contract ABI for price fetching
const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
];

export class PancakeSwapService {
  private provider: ethers.JsonRpcProvider;
  private routerContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    this.routerContract = new ethers.Contract(
      PANCAKESWAP_CONTRACTS.ROUTER_V2,
      ROUTER_ABI,
      this.provider
    );
  }

  // Get swap quote
  async getSwapQuote(
    fromTokenSymbol: string,
    toTokenSymbol: string,
    fromAmount: string,
    slippage: number = 0.5
  ): Promise<SwapQuote> {
    try {
      console.log('[PANCAKESWAP] Getting swap quote:', { fromTokenSymbol, toTokenSymbol, fromAmount });

      const fromToken = TOKENS[fromTokenSymbol as keyof typeof TOKENS];
      const toToken = TOKENS[toTokenSymbol as keyof typeof TOKENS];

      if (!fromToken || !toToken) {
        throw new Error('Invalid token symbols');
      }

      // Build swap path
      const path = this.buildSwapPath(fromToken.address, toToken.address);
      
      // Convert amount to wei
      const amountIn = ethers.parseUnits(fromAmount, fromToken.decimals);
      
      // Get amounts out
      const amounts = await this.routerContract.getAmountsOut(amountIn, path);
      const amountOut = amounts[amounts.length - 1];
      
      // Calculate price
      const price = (parseFloat(fromAmount) / parseFloat(ethers.formatUnits(amountOut, toToken.decimals))).toString();
      
      // Calculate minimum received with slippage
      const slippageMultiplier = (100 - slippage) / 100;
      const minimumReceived = (parseFloat(ethers.formatUnits(amountOut, toToken.decimals)) * slippageMultiplier).toString();
      
      // Estimate gas
      const gasEstimate = await this.estimateSwapGas(
        fromToken.address,
        toToken.address,
        amountIn,
        amounts[amounts.length - 1],
        path
      );

      const quote: SwapQuote = {
        fromToken: fromTokenSymbol,
        toToken: toTokenSymbol,
        fromAmount,
        toAmount: ethers.formatUnits(amountOut, toToken.decimals),
        price,
        priceImpact: '0.1', // TODO: Calculate actual price impact
        slippage: slippage.toString(),
        gasEstimate,
        minimumReceived,
        route: path,
      };

      console.log('[PANCAKESWAP] Swap quote generated:', quote);
      return quote;
    } catch (error) {
      console.error('[PANCAKESWAP ERROR] Failed to get swap quote:', error);
      throw error;
    }
  }

  // Execute swap
  async executeSwap(
    quote: SwapQuote,
    userAddress: string,
    signer: ethers.Signer
  ): Promise<SwapTransaction> {
    try {
      console.log('[PANCAKESWAP] Executing swap:', quote);

      const fromToken = TOKENS[quote.fromToken as keyof typeof TOKENS];
      const toToken = TOKENS[quote.toToken as keyof typeof TOKENS];
      
      const routerWithSigner = new ethers.Contract(
        PANCAKESWAP_CONTRACTS.ROUTER_V2,
        ROUTER_ABI,
        signer
      );

      // Convert amounts
      const amountIn = ethers.parseUnits(quote.fromAmount, fromToken.decimals);
      const amountOutMin = ethers.parseUnits(quote.minimumReceived, toToken.decimals);
      
      // Set deadline (20 minutes from now)
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      let tx;

      if (fromToken.symbol === 'BNB') {
        // Swap BNB for tokens
        tx = await routerWithSigner.swapExactETHForTokensSupportingFeeOnTransferTokens(
          amountOutMin,
          quote.route,
          userAddress,
          deadline,
          { value: amountIn }
        );
      } else if (toToken.symbol === 'BNB') {
        // Swap tokens for BNB
        tx = await routerWithSigner.swapExactTokensForETHSupportingFeeOnTransferTokens(
          amountIn,
          amountOutMin,
          quote.route,
          userAddress,
          deadline
        );
      } else {
        // Swap tokens for tokens
        tx = await routerWithSigner.swapExactTokensForTokensSupportingFeeOnTransferTokens(
          amountIn,
          amountOutMin,
          quote.route,
          userAddress,
          deadline
        );
      }

      const swapTransaction: SwapTransaction = {
        hash: tx.hash,
        fromToken: quote.fromToken,
        toToken: quote.toToken,
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        status: 'pending',
        timestamp: new Date(),
      };

      console.log('[PANCAKESWAP] Swap transaction sent:', tx.hash);
      return swapTransaction;
    } catch (error) {
      console.error('[PANCAKESWAP ERROR] Swap execution failed:', error);
      throw error;
    }
  }

  // Get current price from pool
  async getCurrentPrice(tokenPair: string): Promise<{ price: string; change24h: string }> {
    try {
      if (tokenPair === 'YHT/USDT') {
        // Get price from YHT/USDT pool
        const pairContract = new ethers.Contract(
          PANCAKESWAP_CONTRACTS.POOL_YHT_USDT,
          PAIR_ABI,
          this.provider
        );

        const reserves = await pairContract.getReserves();
        const token0 = await pairContract.token0();
        
        // Determine which reserve is which token
        const isToken0YHT = token0.toLowerCase() === TOKENS.YHT.address.toLowerCase();
        
        const yhtReserve = isToken0YHT ? reserves[0] : reserves[1];
        const usdtReserve = isToken0YHT ? reserves[1] : reserves[0];
        
        // Calculate price (USDT per YHT)
        const price = (parseFloat(ethers.formatEther(usdtReserve)) / parseFloat(ethers.formatEther(yhtReserve))).toFixed(8);
        
        console.log('[PANCAKESWAP] YHT/USDT price fetched:', price);
        
        return {
          price,
          change24h: '+12.5', // TODO: Calculate actual 24h change
        };
      }

      // For other pairs, implement similar logic or use external APIs
      return { price: '0', change24h: '0' };
    } catch (error) {
      console.error('[PANCAKESWAP ERROR] Failed to get current price:', error);
      throw error;
    }
  }

  // Build swap path between two tokens
  private buildSwapPath(fromAddress: string, toAddress: string): string[] {
    // For most swaps, route through WBNB if not a direct pair
    if (fromAddress === TOKENS.WBNB.address || toAddress === TOKENS.WBNB.address) {
      return [fromAddress, toAddress];
    }
    
    // Check if direct pair exists (simplified logic)
    if ((fromAddress === TOKENS.YHT.address && toAddress === TOKENS.USDT.address) ||
        (fromAddress === TOKENS.USDT.address && toAddress === TOKENS.YHT.address)) {
      return [fromAddress, toAddress];
    }
    
    // Route through WBNB
    return [fromAddress, TOKENS.WBNB.address, toAddress];
  }

  // Estimate gas for swap
  private async estimateSwapGas(
    fromToken: string,
    toToken: string,
    amountIn: bigint,
    amountOutMin: bigint,
    path: string[]
  ): Promise<string> {
    try {
      // Simplified gas estimation
      let gasLimit = BigInt(200000); // Base gas for token-to-token swap
      
      if (fromToken === 'native' || toToken === 'native') {
        gasLimit = BigInt(150000); // Less gas for ETH swaps
      }
      
      const gasPrice = await this.provider.getFeeData();
      const estimatedGas = gasLimit * (gasPrice.gasPrice || BigInt(5000000000));
      
      return ethers.formatEther(estimatedGas);
    } catch (error) {
      console.warn('[PANCAKESWAP] Gas estimation failed, using default:', error);
      return '0.005'; // Default ~$3 at 600 BNB
    }
  }
}

export const pancakeSwapService = new PancakeSwapService();
