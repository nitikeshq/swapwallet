import { ethers } from 'ethers';
import { TOKENS, PANCAKESWAP_CONTRACTS } from '@/constants/tokens';

// Contract ABIs
export const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
  'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
  'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
];

export const ERC20_ABI = [
  'function name() public view returns (string)',
  'function symbol() public view returns (string)',
  'function decimals() public view returns (uint8)',
  'function totalSupply() public view returns (uint256)',
  'function balanceOf(address _owner) public view returns (uint256 balance)',
  'function transfer(address _to, uint256 _value) public returns (bool success)',
  'function transferFrom(address _from, address _to, uint256 _value) public returns (bool success)',
  'function approve(address _spender, uint256 _value) public returns (bool success)',
  'function allowance(address _owner, address _spender) public view returns (uint256 remaining)',
];

export const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function totalSupply() external view returns (uint)',
];

// Contract instances
export const getRouterContract = (signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(PANCAKESWAP_CONTRACTS.ROUTER_V2, ROUTER_ABI, signerOrProvider);
};

export const getTokenContract = (tokenAddress: string, signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(tokenAddress, ERC20_ABI, signerOrProvider);
};

export const getPairContract = (pairAddress: string, signerOrProvider: ethers.Signer | ethers.Provider) => {
  return new ethers.Contract(pairAddress, PAIR_ABI, signerOrProvider);
};

// Contract addresses
export const CONTRACT_ADDRESSES = {
  ROUTER: PANCAKESWAP_CONTRACTS.ROUTER_V2,
  FACTORY: PANCAKESWAP_CONTRACTS.FACTORY_V2,
  YHT_USDT_PAIR: PANCAKESWAP_CONTRACTS.POOL_YHT_USDT,
  
  TOKENS: {
    YHT: TOKENS.YHT.address,
    USDT: TOKENS.USDT.address,
    BNB: TOKENS.BNB.address,
    WBNB: TOKENS.WBNB.address,
  },
} as const;
