import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/useWallet";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { toastSuccess, toastError } from "@/components/ui/toast-notifications";
import { AlertTriangle, Key, Copy, Check, Wallet, Lock, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { CreateWalletResult } from "@/types/wallet";

interface CreateWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'warning' | 'password' | 'mnemonic' | 'success';

export function CreateWalletModal({ open, onOpenChange }: CreateWalletModalProps) {
  const { createWallet, connectCreatedWallet } = useWallet();
  const [currentStep, setCurrentStep] = useState<Step>('password');
  const [walletData, setWalletData] = useState<CreateWalletResult | null>(null);
  const [mnemonicSaved, setMnemonicSaved] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordNext = async () => {
    if (!password || password.length < 8) {
      toastError("Invalid Password", "Password must be at least 8 characters long");
      return;
    }
    
    if (password !== confirmPassword) {
      toastError("Password Mismatch", "Passwords do not match");
      return;
    }
    
    setCurrentStep('mnemonic');
    
    // Generate wallet with password
    setIsCreating(true);
    try {
      console.log('[CREATE WALLET MODAL] Generating new wallet...');
      const result = await createWallet(password);
      setWalletData(result);
      console.log('[CREATE WALLET MODAL] Wallet generated successfully');
    } catch (error: any) {
      console.error('[CREATE WALLET MODAL] Wallet creation failed:', error);
      toastError("Wallet Creation Failed", error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateWallet = async () => {
    setIsCreating(true);
    try {
      console.log('[CREATE WALLET MODAL] Generating new wallet...');
      const result = await createWallet(password);
      setWalletData(result);
      setCurrentStep('mnemonic');
      console.log('[CREATE WALLET MODAL] Wallet generated successfully');
    } catch (error: any) {
      console.error('[CREATE WALLET MODAL] Wallet creation failed:', error);
      toastError("Wallet Creation Failed", error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyMnemonic = async () => {
    if (walletData?.mnemonic) {
      try {
        await navigator.clipboard.writeText(walletData.mnemonic);
        setCopied(true);
        toastSuccess("Copied to Clipboard", "Recovery phrase copied successfully");
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toastError("Copy Failed", "Failed to copy to clipboard");
      }
    }
  };

  const handleContinue = () => {
    if (!mnemonicSaved) {
      toastError("Please Confirm", "Please confirm you have saved your recovery phrase");
      return;
    }
    setCurrentStep('success');
  };

  const handleComplete = async () => {
    console.log('[CREATE WALLET MODAL] Wallet setup completed');
    
    if (walletData) {
      try {
        // Connect the created wallet automatically
        await connectCreatedWallet(walletData, password);
        
        // Create user in backend for referral system
        await apiRequest('POST', '/api/users', {
          walletAddress: walletData.address,
          referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        });
        
        toastSuccess("Wallet Active", "Your wallet is now connected and ready to use!");
      } catch (error: any) {
        console.error('[CREATE WALLET MODAL] Failed to activate wallet:', error);
        toastError("Activation Failed", "Wallet created but failed to activate. You can connect manually.");
      }
    }
    
    onOpenChange(false);
    // Reset state for next time
    setCurrentStep('password');
    setWalletData(null);
    setMnemonicSaved(false);
    setCopied(false);
    setPassword("");
    setConfirmPassword("");
  };

  const renderWarningStep = () => (
    <div className="space-y-4">
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-destructive mb-2">Important Security Notice</div>
            <ul className="text-muted-foreground space-y-1">
              <li>• Your recovery phrase is the only way to recover your wallet</li>
              <li>• Never share it with anyone or enter it on suspicious websites</li>
              <li>• Write it down and store it in a safe place</li>
              <li>• YHT Swap will never ask for your recovery phrase</li>
            </ul>
          </div>
        </div>
      </div>
      
      <Button 
        onClick={() => setCurrentStep('password')} 
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        data-testid="next-to-password-button"
      >
        <Key className="h-4 w-4 mr-2" />
        Continue
      </Button>
    </div>
  );

  const renderPasswordStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-accent" />
        </div>
        <h4 className="font-semibold mb-2">Secure Your Wallet</h4>
        <p className="text-sm text-muted-foreground">
          Create a strong password to encrypt your wallet
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Wallet Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter wallet password (min 8 characters)"
              className="pr-10"
              data-testid="wallet-password-input"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
              data-testid="toggle-password-visibility"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="pr-10"
              data-testid="confirm-password-input"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              data-testid="toggle-confirm-password-visibility"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <div>• Password must be at least 8 characters long</div>
          <div>• Use a combination of letters, numbers, and symbols</div>
          <div>• This password will encrypt your wallet locally</div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('warning')}
          className="flex-1"
          data-testid="back-button"
        >
          Back
        </Button>
        <Button
          onClick={handlePasswordNext}
          disabled={!password || !confirmPassword}
          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
          data-testid="password-next-button"
        >
          <Lock className="h-4 w-4 mr-2" />
          Next
        </Button>
      </div>
    </div>
  );

  const renderMnemonicStep = () => {
    const words = walletData?.mnemonic.split(' ') || [];
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h4 className="font-semibold mb-2">Your Recovery Phrase</h4>
          <p className="text-sm text-muted-foreground">
            Write down these 12 words in order and store them safely
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-2 p-4 bg-muted/30 rounded-lg">
          {words.map((word, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 bg-card rounded text-sm">
              <span className="text-muted-foreground w-6 text-right">{index + 1}.</span>
              <span className="font-medium" data-testid={`mnemonic-word-${index}`}>{word}</span>
            </div>
          ))}
        </div>
        
        <Button
          onClick={handleCopyMnemonic}
          variant="outline"
          className="w-full"
          data-testid="copy-mnemonic-button"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </>
          )}
        </Button>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="mnemonicSaved"
            checked={mnemonicSaved}
            onCheckedChange={(checked) => setMnemonicSaved(checked as boolean)}
            data-testid="mnemonic-saved-checkbox"
          />
          <label htmlFor="mnemonicSaved" className="text-sm text-muted-foreground cursor-pointer">
            I have safely stored my recovery phrase
          </label>
        </div>
        
        <Button
          onClick={handleContinue}
          disabled={!mnemonicSaved}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          data-testid="continue-button"
        >
          <Check className="h-4 w-4 mr-2" />
          Continue
        </Button>
      </div>
    );
  };

  const renderSuccessStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-8 w-8 text-green-400" />
        </div>
        <h4 className="font-semibold mb-2">Wallet Created Successfully!</h4>
        <p className="text-sm text-muted-foreground">
          Your wallet has been created and is ready to use
        </p>
      </div>
      
      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Address:</span>
          <span className="font-mono text-xs" data-testid="wallet-address">
            {walletData?.address ? `${walletData.address.slice(0, 6)}...${walletData.address.slice(-4)}` : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Network:</span>
          <span className="text-accent">BSC Mainnet</span>
        </div>
      </div>
      
      <Button
        onClick={handleComplete}
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        data-testid="start-trading-button"
      >
        <Wallet className="h-4 w-4 mr-2" />
        Start Trading
      </Button>
    </div>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 'warning':
        return 'Create New Wallet';
      case 'password':
        return 'Set Wallet Password';
      case 'mnemonic':
        return 'Backup Recovery Phrase';
      case 'success':
        return 'Wallet Created';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-card max-w-lg" data-testid="create-wallet-modal">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{getStepTitle()}</DialogTitle>
          </DialogHeader>
          
          {currentStep === 'warning' && renderWarningStep()}
          {currentStep === 'password' && renderPasswordStep()}
          {currentStep === 'mnemonic' && renderMnemonicStep()}
          {currentStep === 'success' && renderSuccessStep()}
        </DialogContent>
      </Dialog>

      <LoadingOverlay
        isVisible={isCreating}
        title="Generating Wallet..."
        subtitle="Creating secure keys and recovery phrase"
      />
    </>
  );
}
