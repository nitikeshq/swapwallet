import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Gift, Flame, AlertTriangle, Target } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Terms & Conditions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Important information about referral rewards, fees, and platform mechanics
            </p>
          </div>

          {/* Referral Milestone Section */}
          <Card className="glass-card border-purple-500/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Gift className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-purple-400">Referral Milestone Reward</CardTitle>
                  <CardDescription>Exclusive bonus for top performers</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-purple-500/10 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="h-5 w-5 text-purple-400" />
                  <h3 className="text-xl font-semibold">$200,000 Milestone Achievement</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Qualification Requirements:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Accumulate $200,000 in total referral earnings</li>
                      <li>• Earnings from all referred user trading commissions</li>
                      <li>• Based on 10% commission rate from swaps</li>
                      <li>• Automatically tracked and verified</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Reward Details:</h4>
                    <div className="bg-gradient-to-r from-purple-500/20 to-yellow-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          BONUS
                        </Badge>
                        <span className="text-lg font-bold text-yellow-400">0.2 BTC</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        One-time bonus paid in Bitcoin upon reaching the milestone
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Important Notes:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Milestone is achieved automatically when your total referral earnings reach $200,000</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>BTC bonus is a one-time reward and cannot be claimed multiple times</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Bonus will be paid to the same wallet address used for referrals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span>Processing time for BTC bonus: 1-3 business days after milestone achievement</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Burning Fee Section */}
          <Card className="glass-card border-orange-500/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <Flame className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-orange-400">Token Burning Mechanism</CardTitle>
                  <CardDescription>Deflationary tokenomics for YHT</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-orange-500/10 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <h3 className="text-xl font-semibold">5% Burning Fee on YHT → USDT Swaps</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">How It Works:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Applied only when selling YHT for USDT</li>
                      <li>• 5% of YHT amount is permanently burned</li>
                      <li>• Reduces total YHT supply over time</li>
                      <li>• Automatically deducted from swap amount</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Fee Calculation:</h4>
                    <div className="bg-orange-500/10 rounded-lg p-4 font-mono text-sm">
                      <div className="space-y-1">
                        <div>Swap Amount: 1000 YHT</div>
                        <div className="text-orange-400">Burning Fee: 50 YHT (5%)</div>
                        <div>Net Amount: 950 YHT → USDT</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Purpose & Benefits:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    <span><strong>Deflationary Mechanism:</strong> Reduces YHT supply permanently</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    <span><strong>Value Protection:</strong> Supports token price stability and growth</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    <span><strong>Ecosystem Health:</strong> Discourages excessive selling pressure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    <span><strong>Long-term Holders:</strong> Benefits those who hold rather than sell</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-amber-400 mb-1">Important Notice</h5>
                    <p className="text-sm text-muted-foreground">
                      The burning fee only applies to YHT → USDT swaps. Other swap directions (USDT → YHT, YHT → BNB, etc.) 
                      are not subject to this fee. Please review your transaction details before confirming.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* General Terms */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl">General Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong>Platform Usage:</strong> By using this platform, you acknowledge and agree to these terms. 
                  All fees and rewards are automatically calculated and applied according to the rules outlined above.
                </p>
                <p>
                  <strong>Smart Contract Execution:</strong> All swaps and fee calculations are executed through 
                  smart contracts on the Binance Smart Chain. Transactions are irreversible once confirmed.
                </p>
                <p>
                  <strong>Risk Disclaimer:</strong> Cryptocurrency trading involves substantial risk. Please ensure 
                  you understand the mechanics and potential losses before participating.
                </p>
                <p>
                  <strong>Updates:</strong> These terms may be updated periodically. Continued use of the platform 
                  constitutes acceptance of any changes.
                </p>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-8" />
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Last updated: September 3, 2025</p>
            <p className="mt-2">
              For questions or support, please contact our team through the platform.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}