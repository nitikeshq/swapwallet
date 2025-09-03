import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { usePrices } from "@/hooks/usePrices";
import { useQuery } from "@tanstack/react-query";
import { Wallet, RefreshCw, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { EXPLORER_URLS, BSC_CHAIN_ID } from "@/constants/tokens";

interface TokenDisplayData {
  symbol: string;
  balance: string;
  usdValue: string;
  change24h: string;
  isPositive: boolean;
  icon: JSX.Element;
  percentage: number;
}

export function PortfolioSummary() {
  const { connection, balances, fetchBalances, isLoading } = useWallet();
  const { calculateUsdValue, formatPrice, formatChange } = usePrices();

  console.log('[PORTFOLIO SUMMARY] Rendering with balances:', balances);

  // Fetch recent transactions
  const { data: recentTransactions = [] } = useQuery({
    queryKey: ['/api/transactions', connection?.address],
    enabled: !!connection?.address,
    refetchInterval: 30000,
  });

  // Calculate portfolio data
  const portfolioData = balances.map((balance) => {
    const usdValue = calculateUsdValue(balance.balance, balance.symbol);
    const change = balance.symbol === 'YHT' ? '+12.5' : balance.symbol === 'BNB' ? '+2.1' : '+0.0';
    const changeData = formatChange(change);
    
    const getTokenIcon = (symbol: string) => {
      switch (symbol) {
        case 'USDT':
          return (
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
              T
            </div>
          );
        case 'YHT':
          return (
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-xs font-bold text-white">
              Y
            </div>
          );
        case 'BNB':
          return (
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-black">
              B
            </div>
          );
        default:
          return (
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs font-bold">
              ?
            </div>
          );
      }
    };

    return {
      symbol: balance.symbol,
      balance: formatPrice(balance.balance, balance.symbol === 'YHT' ? 2 : 6),
      usdValue,
      change24h: changeData.value,
      isPositive: changeData.isPositive,
      icon: getTokenIcon(balance.symbol),
      percentage: 0, // Will calculate below
    };
  });

  // Calculate total portfolio value and percentages
  const totalPortfolioValue = portfolioData.reduce(
    (sum, token) => sum + parseFloat(token.usdValue),
    0
  );

  portfolioData.forEach(token => {
    token.percentage = totalPortfolioValue > 0 ? 
      (parseFloat(token.usdValue) / totalPortfolioValue) * 100 : 0;
  });

  console.log('[PORTFOLIO SUMMARY] Portfolio calculated:', { totalPortfolioValue, portfolioData });

  const formatTransactionType = (tx: any) => {
    if (tx.fromToken === 'USDT' && tx.toToken === 'YHT') {
      return { type: 'Buy YHT', icon: TrendingUp, color: 'text-green-400' };
    } else if (tx.fromToken === 'YHT' && tx.toToken === 'USDT') {
      return { type: 'Sell YHT', icon: TrendingDown, color: 'text-red-400' };
    }
    return { type: `Swap ${tx.fromToken} → ${tx.toToken}`, icon: RefreshCw, color: 'text-accent' };
  };

  const getTransactionLink = (txHash: string) => {
    return `${EXPLORER_URLS.BSC_MAINNET}/tx/${txHash}`;
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center space-x-2">
              <Wallet className="h-5 w-5 text-accent" />
              <span>Portfolio</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchBalances()}
              disabled={isLoading}
              className="hover:bg-muted transition-colors"
              data-testid="refresh-balances-button"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Value</span>
            <span className="text-xl font-bold text-accent" data-testid="total-portfolio-value">
              ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          
          {/* Token Balances */}
          <div className="space-y-3">
            {portfolioData.map((token) => (
              <div 
                key={token.symbol}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                data-testid={`token-balance-${token.symbol.toLowerCase()}`}
              >
                <div className="flex items-center space-x-3">
                  {token.icon}
                  <div>
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-xs text-muted-foreground">
                      {token.balance}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${token.usdValue}</div>
                  <div className="flex items-center space-x-2">
                    <div className={`text-xs ${token.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {token.change24h}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {token.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg font-semibold">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-accent" />
              <span>Recent Transactions</span>
            </div>
            <Button
              variant="ghost"
              className="text-xs text-accent hover:underline"
              data-testid="view-all-transactions"
            >
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {Array.isArray(recentTransactions) && recentTransactions.length > 0 ? (
              (recentTransactions as any[]).slice(0, 3).map((tx: any) => {
                const txData = formatTransactionType(tx);
                const TxIcon = txData.icon;
                
                return (
                  <div 
                    key={tx.id}
                    className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg"
                    data-testid={`transaction-${tx.id}`}
                  >
                    <div className={`w-8 h-8 ${txData.color.replace('text-', 'bg-').replace('-400', '-500/20')} rounded-full flex items-center justify-center`}>
                      <TxIcon className={`h-4 w-4 ${txData.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{txData.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatPrice(tx.fromAmount, 4)} {tx.fromToken} → {formatPrice(tx.toAmount, 4)} {tx.toToken}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => window.open(getTransactionLink(tx.txHash), '_blank')}
                      data-testid={`transaction-link-${tx.id}`}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8" data-testid="no-transactions">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCw className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No recent transactions</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your swap history will appear here
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
