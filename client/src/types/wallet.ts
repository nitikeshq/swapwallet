export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
  provider?: any;
}

export interface TokenBalance {
  symbol: string;
  address: string;
  balance: string;
  decimals: number;
  usdValue?: string;
}

export interface WalletState {
  connection: WalletConnection | null;
  balances: TokenBalance[];
  isConnecting: boolean;
  error: string | null;
}

export type WalletProvider = 'metamask' | 'walletconnect' | 'trustwallet' | 'injected';

export interface CreateWalletResult {
  mnemonic: string;
  address: string;
  privateKey: string;
}
