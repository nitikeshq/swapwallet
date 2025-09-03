import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/hooks/useWallet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toastSuccess, toastError } from "@/components/ui/toast-notifications";
import { Gift, Share2, Copy, Users, DollarSign } from "lucide-react";

export function ReferralProgram() {
  const { connection } = useWallet();
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  console.log('[REFERRAL PROGRAM] Rendering with connection:', connection?.address);

  // Fetch user data to get referral code
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['/api/users', connection?.address],
    enabled: !!connection?.address,
    retry: false,
    queryFn: async ({ queryKey }) => {
      try {
        const response = await fetch(queryKey.join('/'));
        if (response.status === 404) {
          // User doesn't exist yet, create one
          console.log('[REFERRAL PROGRAM] User not found, creating new user');
          return null;
        }
        if (!response.ok) throw new Error('Failed to fetch user data');
        return await response.json();
      } catch (error) {
        console.error('[REFERRAL PROGRAM] Failed to fetch user:', error);
        return null;
      }
    },
  });

  // Fetch referral data
  const { data: referralData = [] } = useQuery({
    queryKey: ['/api/referrals', connection?.address],
    enabled: !!connection?.address,
    queryFn: async ({ queryKey }) => {
      try {
        const response = await fetch(queryKey.join('/'));
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error('[REFERRAL PROGRAM] Failed to fetch referrals:', error);
        return [];
      }
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async () => {
      if (!connection?.address) throw new Error('No wallet connected');
      
      console.log('[REFERRAL PROGRAM] Creating user for:', connection.address);
      const response = await apiRequest('POST', '/api/users', {
        walletAddress: connection.address,
        referredBy: null,
        totalEarnings: '0',
      });
      
      return await response.json();
    },
    onSuccess: (newUser) => {
      console.log('[REFERRAL PROGRAM] User created successfully:', newUser);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      generateReferralLink(newUser.referralCode);
      toastSuccess("Referral Program Activated", "Your referral code has been generated!");
    },
    onError: (error: any) => {
      console.error('[REFERRAL PROGRAM] User creation failed:', error);
      toastError("Setup Failed", "Failed to activate referral program");
    },
  });

  // Generate referral link
  const generateReferralLink = (referralCode: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}?ref=${referralCode}`;
    setReferralLink(link);
    return link;
  };

  // Copy referral link
  const copyReferralLink = async () => {
    if (!referralLink) return;
    
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toastSuccess("Link Copied", "Referral link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
      console.log('[REFERRAL PROGRAM] Referral link copied:', referralLink);
    } catch (error) {
      toastError("Copy Failed", "Failed to copy link to clipboard");
    }
  };

  // Share referral link
  const shareReferralLink = async () => {
    if (!referralLink) return;
    
    const shareData = {
      title: 'Join YHT Swap - Best DeFi Trading Platform',
      text: 'Trade YHT tokens with the lowest fees and earn rewards through referrals!',
      url: referralLink,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('[REFERRAL PROGRAM] Referral link shared via Web Share API');
      } else {
        // Fallback to copying
        await copyReferralLink();
      }
    } catch (error) {
      console.error('[REFERRAL PROGRAM] Share failed:', error);
    }
  };

  // Calculate stats
  const totalEarnings = userData?.totalEarnings ? parseFloat(userData.totalEarnings) : 0;
  const totalReferrals = referralData.length;
  const commissionRate = 10; // 10% commission rate

  // Initialize user and referral code
  const handleActivateReferrals = () => {
    if (connection?.address && !userData && !isUserLoading) {
      createUserMutation.mutate();
    }
  };

  // Generate referral link when user data is available
  if (userData?.referralCode && !referralLink) {
    generateReferralLink(userData.referralCode);
  }

  if (!connection?.address) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Connect your wallet to access the referral program</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold">
          <Gift className="h-5 w-5 text-accent mr-2" />
          Referral Program
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {userData?.referralCode ? (
          <>
            {/* Earnings Display */}
            <div className="text-center p-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg border border-accent/20">
              <div className="text-2xl font-bold text-accent mb-1" data-testid="referral-earnings">
                ${totalEarnings.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Earnings</div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Users className="h-4 w-4 text-accent" />
                  <span className="font-medium" data-testid="referral-count">{totalReferrals}</span>
                </div>
                <div className="text-xs text-muted-foreground">Referrals</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <DollarSign className="h-4 w-4 text-accent" />
                  <span className="font-medium text-accent">{commissionRate}%</span>
                </div>
                <div className="text-xs text-muted-foreground">Commission</div>
              </div>
            </div>
            
            {/* Referral Link */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Your Referral Link</label>
              <div className="flex space-x-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="flex-1 text-xs"
                  data-testid="referral-link-input"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyReferralLink}
                  data-testid="copy-referral-link"
                >
                  {copied ? (
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            {/* Share Button */}
            <Button
              onClick={shareReferralLink}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
              data-testid="share-referral-link"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Referral Link
            </Button>
            
            {/* How It Works */}
            <div className="bg-muted/20 rounded-lg p-3">
              <h4 className="font-medium text-sm mb-2">How it works:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Share your referral link with friends</li>
                <li>• Earn {commissionRate}% commission on their trades</li>
                <li>• Commissions are paid in USDT</li>
                <li>• No limits on referrals or earnings</li>
              </ul>
            </div>
          </>
        ) : (
          /* Activate Referrals */
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
              <Gift className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h4 className="font-medium mb-2">Earn with Referrals</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Get a {commissionRate}% commission on every trade made by users you refer to our platform.
              </p>
              <Button
                onClick={handleActivateReferrals}
                disabled={createUserMutation.isPending}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                data-testid="activate-referrals-button"
              >
                {createUserMutation.isPending ? "Setting up..." : "Activate Referrals"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
