import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { WalletConnectModal } from "@/components/wallet/WalletConnectModal";
import { CreateWalletModal } from "@/components/wallet/CreateWalletModal";
import { Wallet, Settings, FileText } from "lucide-react";
import { Link } from "wouter";

export function Header() {
  const { connection, isConnecting, isConnected, disconnect } = useWallet();
  
  // AGGRESSIVE debug log to check wallet state
  console.log('[HEADER] WALLET STATE DEBUG:', { 
    hasConnection: !!connection, 
    address: connection?.address,
    isConnected: connection?.isConnected,
    derivedIsConnected: isConnected,
    isConnecting,
    fullConnection: connection
  });
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false);

  const handleWalletClick = () => {
    if (isConnected && connection?.address) {
      // Could show wallet menu or disconnect
      disconnect();
    } else {
      setShowWalletModal(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-sm bg-background/80 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              {/* Yahoo Token Y logo with 3D effect */}
              <div className="w-10 h-10 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-lg rotate-3 opacity-70"></div>
                <div className="relative w-full h-full bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-xl">
                  Y
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  YHT Swap
                </h1>
                <p className="text-xs text-muted-foreground">Best DeFi Trading</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-foreground hover:text-accent transition-colors" data-testid="nav-swap">
                Swap
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors" data-testid="nav-portfolio">
                Portfolio
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors" data-testid="nav-referrals">
                Referrals
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors" data-testid="nav-history">
                History
              </a>
              <Link href="/terms" className="text-muted-foreground hover:text-accent transition-colors flex items-center gap-1" data-testid="nav-terms">
                <FileText className="h-4 w-4" />
                Terms
              </Link>
            </nav>

            {/* Wallet Connection */}
            <div className="flex items-center space-x-3">
              {/* Network Indicator */}
              <div className="hidden sm:flex items-center space-x-2 bg-muted px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" data-testid="network-indicator" />
                <span className="text-sm text-muted-foreground">BSC</span>
              </div>
              
              {/* Wallet Button */}
              <div className="gradient-border">
                <Button
                  onClick={handleWalletClick}
                  disabled={isConnecting}
                  className="bg-card hover:bg-muted transition-colors"
                  data-testid="wallet-connect-button"
                >
                  <div className="flex items-center space-x-2">
                    <Wallet className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium">
                      {isConnecting 
                        ? "Connecting..." 
                        : (isConnected && connection?.address)
                          ? `${connection.address.slice(0, 6)}...${connection.address.slice(-4)}`
                          : "Connect Wallet"
                      }
                    </span>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Wallet Connection Modal */}
      <WalletConnectModal
        open={showWalletModal}
        onOpenChange={setShowWalletModal}
        onCreateWallet={() => {
          setShowWalletModal(false);
          setShowCreateWalletModal(true);
        }}
      />

      {/* Create Wallet Modal */}
      <CreateWalletModal
        open={showCreateWalletModal}
        onOpenChange={setShowCreateWalletModal}
      />
    </>
  );
}
