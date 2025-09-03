import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useWallet } from "@/hooks/useWallet";
import { useSwap } from "@/hooks/useSwap";
import { usePrices } from "@/hooks/usePrices";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { toastError, toastSuccess } from "@/components/ui/toast-notifications";
import { ArrowUpDown, Settings, RefreshCw } from "lucide-react";

export function SwapInterface() {
  const { connection, isConnected, getTokenBalance } = useWallet();
  const { quote, isGettingQuote, isSwapping, getQuote, executeSwap, clearQuote } = useSwap();
  const { calculateUsdValue, formatPrice } = usePrices();

  // Swap state
  const [fromToken, setFromToken] = useState<'USDT' | 'YHT'>('USDT');
  const [toToken, setToToken] = useState<'USDT' | 'YHT'>('YHT');
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);

  console.log('[SWAP INTERFACE] Component rendered', { 
    isConnected, 
    fromToken, 
    toToken, 
    fromAmount, 
    hasQuote: !!quote 
  });

  // Get token balances
  const fromTokenBalance = getTokenBalance(fromToken);
  const toTokenBalance = getTokenBalance(toToken);
  const bnbBalance = getTokenBalance('BNB');

  // Calculate USD values
  const fromUsdValue = calculateUsdValue(fromAmount || '0', fromToken);
  const toUsdValue = quote ? calculateUsdValue(quote.toAmount, toToken) : '0.00';

  // Handle amount input changes
  const handleFromAmountChange = (value: string) => {
    console.log('[SWAP INTERFACE] From amount changed:', value);
    setFromAmount(value);
    
    if (value && parseFloat(value) > 0) {
      getQuote(fromToken, toToken, value, slippage);
    } else {
      clearQuote();
    }
  };

  // Handle token swap direction
  const handleSwapDirection = () => {
    console.log('[SWAP INTERFACE] Swapping token direction');
    const newFromToken = toToken;
    const newToToken = fromToken;
    
    setFromToken(newFromToken);
    setToToken(newToToken);
    setFromAmount('');
    clearQuote();
  };

  // Handle percentage buttons
  const handlePercentageClick = (percentage: number) => {
    const balance = parseFloat(fromTokenBalance);
    if (balance > 0) {
      let amount: number;
      
      if (fromToken === 'BNB' as any) {
        // Leave some BNB for gas fees
        const gasReserve = 0.01;
        amount = Math.max(0, (balance - gasReserve) * (percentage / 100));
      } else {
        amount = balance * (percentage / 100);
      }
      
      const amountStr = amount.toFixed(6);
      console.log('[SWAP INTERFACE] Setting percentage amount:', { percentage, balance, amount: amountStr });
      handleFromAmountChange(amountStr);
    }
  };

  // Handle swap execution
  const handleSwap = async () => {
    if (!isConnected || !connection?.address) {
      toastError("Wallet Not Connected", "Please connect your wallet first");
      return;
    }

    if (!quote) {
      toastError("No Quote Available", "Please enter an amount to swap");
      return;
    }

    console.log('[SWAP INTERFACE] Executing swap:', { quote, userAddress: connection.address });

    try {
      await executeSwap(connection.address);
      toastSuccess("Swap Submitted", "Your transaction has been submitted to the network");
      setFromAmount('');
      clearQuote();
    } catch (error: any) {
      console.error('[SWAP INTERFACE] Swap execution failed:', error);
      toastError("Swap Failed", error.message || "Transaction failed");
    }
  };

  // Validate swap conditions
  const getSwapButtonText = () => {
    if (!isConnected) return "Connect Wallet";
    if (!fromAmount || parseFloat(fromAmount) <= 0) return "Enter Amount";
    if (parseFloat(fromAmount) > parseFloat(fromTokenBalance)) return "Insufficient Balance";
    if (isGettingQuote) return "Getting Quote...";
    if (isSwapping) return "Swapping...";
    return "Swap Tokens";
  };

  const isSwapDisabled = () => {
    return !isConnected || 
           !fromAmount || 
           parseFloat(fromAmount) <= 0 || 
           parseFloat(fromAmount) > parseFloat(fromTokenBalance) ||
           isGettingQuote || 
           isSwapping ||
           !quote;
  };

  // Token icons
  const getTokenIcon = (token: string) => {
    switch (token) {
      case 'USDT':
        return (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
            T
          </div>
        );
      case 'YHT':
        return (
          <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-xs font-bold text-white">
            Y
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="glass-card animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-2xl font-bold">
            <span>Swap Tokens</span>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-muted rounded-lg transition-colors"
              data-testid="swap-settings-button"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* From Token */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">From</span>
              <span className="text-sm text-muted-foreground">
                Balance: <span data-testid={`${fromToken.toLowerCase()}-balance`}>{formatPrice(fromTokenBalance, 6)}</span>
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Input
                type="number"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                className="flex-1 bg-transparent text-2xl font-semibold border-none p-0 focus-visible:ring-0"
                data-testid="from-amount-input"
              />
              <div className="flex items-center space-x-2 bg-card px-3 py-2 rounded-lg">
                {getTokenIcon(fromToken)}
                <span className="font-medium">{fromToken}</span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-muted-foreground">
                ≈ $<span data-testid="from-usd-value">{fromUsdValue}</span>
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => handlePercentageClick(25)}
                  data-testid="percentage-25"
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => handlePercentageClick(50)}
                  data-testid="percentage-50"
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => handlePercentageClick(100)}
                  data-testid="percentage-max"
                >
                  MAX
                </Button>
              </div>
            </div>
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSwapDirection}
              className="swap-arrow p-3 bg-muted rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-300"
              data-testid="swap-direction-button"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* To Token */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">To</span>
              <span className="text-sm text-muted-foreground">
                Balance: <span data-testid={`${toToken.toLowerCase()}-balance`}>{formatPrice(toTokenBalance, 6)}</span>
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Input
                type="number"
                placeholder="0.0"
                value={quote?.toAmount || ''}
                readOnly
                className="flex-1 bg-transparent text-2xl font-semibold border-none p-0 focus-visible:ring-0 cursor-default"
                data-testid="to-amount-display"
              />
              <div className="flex items-center space-x-2 bg-card px-3 py-2 rounded-lg">
                {getTokenIcon(toToken)}
                <span className="font-medium">{toToken}</span>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">
                ≈ $<span data-testid="to-usd-value">{toUsdValue}</span>
              </span>
            </div>
          </div>

          {/* Swap Details */}
          {quote && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm animate-fade-in">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span data-testid="swap-rate">
                  1 {fromToken} = {formatPrice(quote.price, 6)} {toToken}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slippage Tolerance</span>
                <span className="text-accent" data-testid="slippage-tolerance">{slippage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network Fee</span>
                <span data-testid="network-fee">~${parseFloat(quote.gasEstimate).toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum Received</span>
                <span data-testid="minimum-received">
                  {formatPrice(quote.minimumReceived, 6)} {toToken}
                </span>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={isSwapDisabled()}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="swap-button"
          >
            {isGettingQuote ? (
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Getting Quote...</span>
              </div>
            ) : (
              getSwapButtonText()
            )}
          </Button>
        </CardContent>
      </Card>

      <LoadingOverlay
        isVisible={isSwapping}
        title="Processing Swap..."
        subtitle="Please confirm the transaction in your wallet"
      />
    </>
  );
}
