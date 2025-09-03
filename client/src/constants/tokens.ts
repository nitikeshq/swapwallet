export const BSC_CHAIN_ID = 56;
export const BSC_TESTNET_CHAIN_ID = 97;

export const TOKENS = {
  YHT: {
    symbol: 'YHT',
    name: 'Yahoo Token',
    address: '0x3279eF4614f241a389114C77CdD28b70fcA9537a',
    decimals: 18,
    logoURI: '/tokens/yht.png',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0x55d398326f99059fF775485246999027B3197955',
    decimals: 18,
    logoURI: '/tokens/usdt.png',
  },
  BNB: {
    symbol: 'BNB',
    name: 'Binance Coin',
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    decimals: 18,
    logoURI: '/tokens/bnb.png',
  },
  WBNB: {
    symbol: 'WBNB',
    name: 'Wrapped BNB',
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    decimals: 18,
    logoURI: '/tokens/wbnb.png',
  },
} as const;

export const PANCAKESWAP_CONTRACTS = {
  ROUTER_V2: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  FACTORY_V2: '0xCA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
  QUOTER_V3: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997',
  POOL_YHT_USDT: '0x6fd64bd3c577b9613ee293d38e6018536d05c799',
} as const;

export const RPC_URLS = {
  BSC_MAINNET: 'https://bsc-dataseed.binance.org/',
  BSC_TESTNET: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
} as const;

export const EXPLORER_URLS = {
  BSC_MAINNET: 'https://bscscan.com',
  BSC_TESTNET: 'https://testnet.bscscan.com',
} as const;
