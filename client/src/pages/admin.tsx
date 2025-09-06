import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Settings2,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  BarChart3,
  Coins
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AdminSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  description: string | null;
  updatedAt: string;
  createdAt: string;
}

interface AdminAnalytics {
  totalVolume: string;
  totalFees: string;
  totalCommissions: string;
}

interface User {
  id: string;
  walletAddress: string;
  referralCode: string | null;
  totalEarnings: string;
  milestoneAchieved: boolean;
  btcBonusClaimed: boolean;
  createdAt: string;
}

interface Transaction {
  id: string;
  userAddress: string;
  txHash: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  status: string;
  burningFee: string;
  createdAt: string;
}

interface Referral {
  id: string;
  referrerAddress: string;
  refereeAddress: string;
  commissionAmount: string;
  commissionToken: string;
  status: string;
  createdAt: string;
}

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Admin authentication
  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await apiRequest('POST', '/api/admin/login', { password });
      setIsAuthenticated(true);
      toast({
        title: "Login Successful",
        description: "Welcome to the admin panel",
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: "Invalid password",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Fetch admin data
  const { data: settings = [], refetch: refetchSettings } = useQuery<AdminSetting[]>({
    queryKey: ['/api/admin/settings'],
    enabled: isAuthenticated,
  });

  const { data: analytics } = useQuery<AdminAnalytics>({
    queryKey: ['/api/admin/analytics'],
    enabled: isAuthenticated,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: isAuthenticated,
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/admin/transactions'],
    enabled: isAuthenticated,
  });

  const { data: referrals = [] } = useQuery<Referral[]>({
    queryKey: ['/api/admin/referrals'],
    enabled: isAuthenticated,
  });

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description?: string }) => {
      return apiRequest('POST', '/api/admin/settings', {
        settingKey: key,
        settingValue: value,
        description: description || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Setting Updated",
        description: "Configuration saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSettingUpdate = (key: string, value: string, description?: string) => {
    updateSettingMutation.mutate({ key, value, description });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card border-red-500/20">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-red-400" />
            </div>
            <CardTitle className="text-2xl text-red-400">Admin Access</CardTitle>
            <CardDescription>Enter password to access the admin panel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter admin password"
                  className="pr-10"
                  data-testid="admin-password-input"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleLogin} 
                disabled={!password || isLoggingIn}
                className="flex-1"
                data-testid="admin-login-button"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Login
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setLocation('/')} data-testid="back-to-home">
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-red-400">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">System management & analytics</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setLocation('/')} data-testid="admin-home-button">
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings2 className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">
              <Coins className="h-4 w-4 mr-2" />
              Transactions
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="glass-card border-green-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">
                    ${parseFloat(analytics?.totalVolume || "0").toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All-time trading volume
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-orange-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Burning Fees</CardTitle>
                  <DollarSign className="h-4 w-4 text-orange-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-400">
                    ${parseFloat(analytics?.totalFees || "0").toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total YHT burned (5% fee)
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card border-purple-500/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Referral Commissions</CardTitle>
                  <Users className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-400">
                    ${parseFloat(analytics?.totalCommissions || "0").toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total referral payouts
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">
                            {tx.fromAmount} {tx.fromToken} → {tx.toAmount} {tx.toToken}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tx.userAddress.slice(0, 8)}...{tx.userAddress.slice(-6)}
                          </p>
                        </div>
                        <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'}>
                          {tx.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Top Referrers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users
                      .filter(user => parseFloat(user.totalEarnings) > 0)
                      .sort((a, b) => parseFloat(b.totalEarnings) - parseFloat(a.totalEarnings))
                      .slice(0, 5)
                      .map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <p className="font-medium text-sm">
                              {user.walletAddress.slice(0, 8)}...{user.walletAddress.slice(-6)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Code: {user.referralCode}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm text-green-400">
                              ${parseFloat(user.totalEarnings).toLocaleString()}
                            </p>
                            {user.milestoneAchieved && (
                              <Badge variant="secondary" className="text-xs">
                                Milestone
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Token Contract Settings</CardTitle>
                <CardDescription>
                  Manage token contract addresses and configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings.map((setting) => (
                  <div key={setting.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">{setting.settingKey}</Label>
                        {setting.description && (
                          <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={setting.settingValue}
                        onChange={(e) => {
                          // Update local state for immediate feedback
                          const updatedSettings = settings.map(s => 
                            s.id === setting.id ? { ...s, settingValue: e.target.value } : s
                          );
                          queryClient.setQueryData(['/api/admin/settings'], updatedSettings);
                        }}
                        placeholder="Contract address"
                        className="flex-1"
                        data-testid={`setting-${setting.settingKey}`}
                      />
                      <Button
                        onClick={() => handleSettingUpdate(
                          setting.settingKey,
                          setting.settingValue,
                          setting.description || undefined
                        )}
                        disabled={updateSettingMutation.isPending}
                        data-testid={`save-${setting.settingKey}`}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </div>
                    <Separator />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>All Users ({users.length})</CardTitle>
                <CardDescription>
                  User accounts and referral statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="font-medium">{user.walletAddress}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            Code: {user.referralCode || 'None'}
                          </span>
                          <span className="text-sm text-green-400">
                            Earned: ${parseFloat(user.totalEarnings).toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {user.milestoneAchieved && (
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                            Milestone
                          </Badge>
                        )}
                        {user.btcBonusClaimed && (
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                            BTC Claimed
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>All Transactions ({transactions.length})</CardTitle>
                <CardDescription>
                  Complete transaction history and burning fees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <p className="font-medium">
                            {parseFloat(tx.fromAmount).toFixed(4)} {tx.fromToken} → {parseFloat(tx.toAmount).toFixed(4)} {tx.toToken}
                          </p>
                          <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'}>
                            {tx.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            {tx.userAddress.slice(0, 10)}...{tx.userAddress.slice(-8)}
                          </span>
                          {parseFloat(tx.burningFee) > 0 && (
                            <span className="text-sm text-orange-400">
                              Burned: {parseFloat(tx.burningFee).toFixed(4)} YHT
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`https://bscscan.com/tx/${tx.txHash}`, '_blank')}
                      >
                        View on BSC
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}