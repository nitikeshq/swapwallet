import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useWallet } from "@/hooks/useWallet";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Wallet, Smartphone, Shield, Plus, Info } from "lucide-react";

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateWallet: () => void;
}

export function WalletConnectModal({ open, onOpenChange, onCreateWallet }: WalletConnectModalProps) {
  const { connect, isConnecting } = useWallet();
  const [connectingTo, setConnectingTo] = useState<string | null>(null);

  const handleConnect = async (provider: 'metamask' | 'walletconnect' | 'trustwallet') => {
    setConnectingTo(provider);
    try {
      await connect(provider);
      onOpenChange(false);
    } catch (error) {
      console.error(`Connection to ${provider} failed:`, error);
    } finally {
      setConnectingTo(null);
    }
  };

  const walletOptions = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect using browser extension',
      icon: Wallet,
      color: 'bg-orange-500',
      onClick: () => handleConnect('metamask'),
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Scan with WalletConnect to connect',
      icon: Smartphone,
      color: 'bg-blue-500',
      onClick: () => handleConnect('walletconnect'),
    },
    {
      id: 'trustwallet',
      name: 'Trust Wallet',
      description: 'Connect to Trust Wallet',
      icon: Shield,
      color: 'bg-blue-600',
      onClick: () => handleConnect('trustwallet'),
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-card max-w-md" data-testid="wallet-connect-modal">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Connect Wallet</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            {walletOptions.map((wallet) => {
              const Icon = wallet.icon;
              const isConnecting = connectingTo === wallet.id;
              
              return (
                <Button
                  key={wallet.id}
                  variant="ghost"
                  className="w-full justify-start p-4 h-auto bg-muted/30 hover:bg-muted/50 transition-colors"
                  onClick={wallet.onClick}
                  disabled={isConnecting || connectingTo !== null}
                  data-testid={`wallet-option-${wallet.id}`}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className={`w-8 h-8 ${wallet.color} rounded-lg flex items-center justify-center text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{wallet.name}</div>
                      <div className="text-xs text-muted-foreground">{wallet.description}</div>
                    </div>
                    {isConnecting && (
                      <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </Button>
              );
            })}
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">or</span>
              </div>
            </div>
            
            {/* Create New Wallet */}
            <Button
              variant="outline"
              className="w-full justify-start p-4 h-auto bg-accent/10 hover:bg-accent/20 border-accent/20"
              onClick={onCreateWallet}
              disabled={isConnecting}
              data-testid="create-wallet-button"
            >
              <div className="flex items-center space-x-3 w-full">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-accent">Create New Wallet</div>
                  <div className="text-xs text-muted-foreground">Generate a new wallet with recovery phrase</div>
                </div>
              </div>
            </Button>
          </div>
          
          <div className="mt-6 p-3 bg-muted/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                New to crypto? Create a secure wallet with a 12-word recovery phrase. Keep your phrase safe and never share it.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LoadingOverlay
        isVisible={isConnecting && connectingTo !== null}
        title={`Connecting to ${connectingTo}...`}
        subtitle="Please approve the connection request"
      />
    </>
  );
}
