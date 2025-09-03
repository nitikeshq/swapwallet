import { Header } from "@/components/layout/Header";
import { PriceTicker } from "@/components/layout/PriceTicker";
import { SwapInterface } from "@/components/swap/SwapInterface";
import { PortfolioSummary } from "@/components/portfolio/PortfolioSummary";
import { ReferralProgram } from "@/components/referral/ReferralProgram";
import { useWallet } from "@/hooks/useWallet";
import { usePrices } from "@/hooks/usePrices";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users } from "lucide-react";

export default function SwapPage() {
  const { isConnected } = useWallet();
  const { yhtPrice, bnbPrice } = usePrices();

  console.log('[SWAP PAGE] Rendering swap page', { 
    isConnected, 
    yhtPrice: yhtPrice?.price, 
    bnbPrice: bnbPrice?.price 
  });

  // Handle View Chart button click
  const handleViewChart = () => {
    // Direct link to YHT/USDT pool on PancakeSwap using the actual pool address
    const poolAddress = "0x6fd64bd3c577b9613ee293d38e6018536d05c799";
    const pancakeSwapPoolUrl = `https://pancakeswap.finance/info/v3/pairs/${poolAddress}`;
    window.open(pancakeSwapPoolUrl, '_blank');
    console.log('[SWAP PAGE] Opening PancakeSwap pool chart for YHT/USDT:', poolAddress);
  };

  // Handle Referrals button click
  const handleViewReferrals = () => {
    const referralSection = document.querySelector('[data-section="referrals"]');
    if (referralSection) {
      referralSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      console.log('[SWAP PAGE] Scrolling to referrals section');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PriceTicker />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Swap Interface */}
          <div className="lg:col-span-2 space-y-6">
            <SwapInterface />
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className="glass-card hover:bg-muted/20 transition-colors cursor-pointer group"
                onClick={handleViewChart}
                data-testid="view-chart-button"
              >
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-accent/30 transition-colors">
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-medium mb-1" data-testid="view-chart-title">View Chart</h3>
                  <p className="text-xs text-muted-foreground">TradingView integration</p>
                </CardContent>
              </Card>
              
              <Card 
                className="glass-card hover:bg-muted/20 transition-colors cursor-pointer group"
                onClick={handleViewReferrals}
                data-testid="referrals-button"
              >
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-accent/30 transition-colors">
                    <Users className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="font-medium mb-1" data-testid="referrals-title">Referrals</h3>
                  <p className="text-xs text-muted-foreground">Earn commissions</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PortfolioSummary />
            <div data-section="referrals">
              <ReferralProgram />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
