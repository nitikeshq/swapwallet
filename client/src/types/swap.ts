export interface SwapQuote {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  price: string;
  priceImpact: string;
  slippage: string;
  gasEstimate: string;
  minimumReceived: string;
  route: string[];
}

export interface SwapTransaction {
  hash: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
  gasUsed?: string;
  gasPrice?: string;
  blockNumber?: number;
}

export interface PriceData {
  price: string;
  change24h: string;
  volume24h: string;
  liquidity: string;
  lastUpdated: Date;
}
