# Overview

This is a decentralized cryptocurrency swap application built for trading YHT (Yahoo Token) against USDT on the Binance Smart Chain. The application features a modern React frontend with TypeScript, integrated with PancakeSwap DEX for token swapping functionality. It includes wallet connectivity, real-time price tracking, portfolio management, and a referral program system.

# Recent Changes

**September 6, 2025** - Security improvements for admin system:
- Moved admin password from hardcoded string to environment variable (ADMIN_PASSWORD)
- Created comprehensive authentication middleware for admin routes
- Applied authentication protection to all admin endpoints
- Fixed Vite middleware interference with API routes (Note: Vite middleware catch-all route is overriding API authentication - requires further investigation)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework Stack**: React 18 with TypeScript using Vite for development and building. The application uses a component-based architecture with custom hooks for state management.

**UI Framework**: Built with shadcn/ui component library on top of Tailwind CSS for consistent styling. Uses Radix UI primitives for accessible components and implements a dark theme with CSS variables for theming.

**Routing**: Uses Wouter for lightweight client-side routing, currently supporting swap and portfolio pages.

**State Management**: 
- TanStack Query for server state management and API caching
- Custom React hooks for wallet, swap, and price management
- Local component state for UI interactions

**Web3 Integration**:
- ethers.js v6 for blockchain interactions
- MetaMask integration for wallet connections
- PancakeSwap SDK integration for DEX operations
- Support for BSC mainnet with contract interactions

## Backend Architecture

**Server Framework**: Node.js with Express.js providing RESTful APIs with TypeScript for type safety across the stack.

**API Design**: RESTful endpoints for user management, transaction tracking, referral system, and price data aggregation.

**Storage Pattern**: Implements an abstraction layer with `IStorage` interface, currently using in-memory storage (`MemStorage`) but designed to easily switch to database implementations.

**Session Management**: Uses express-session with connect-pg-simple for PostgreSQL session storage when database is connected.

## Data Storage Solutions

**Database**: PostgreSQL with Neon serverless hosting configured through Drizzle ORM for type-safe database operations.

**Schema Design**:
- Users table: wallet addresses, referral codes, earnings tracking
- Transactions table: swap history, amounts, status, blockchain data
- Referrals table: commission tracking and payout management
- Price history table: historical price data with multiple sources

**ORM**: Drizzle ORM provides type-safe database queries and schema management with migration support.

## External Dependencies

**Blockchain Infrastructure**:
- Binance Smart Chain (BSC) mainnet integration
- PancakeSwap V2 Router and Factory contracts
- ERC-20 token contracts (YHT, USDT, BNB)
- Web3 provider through MetaMask or injected wallets

**Price Data Sources**:
- PancakeSwap direct contract calls for YHT/USDT pair reserves
- CoinGecko API for BNB and other token prices
- Real-time price updates with 30-second refresh intervals

**External Services**:
- Neon Database for PostgreSQL hosting
- BSC RPC endpoints for blockchain data
- BSCScan for transaction exploration links

**Development Tools**:
- Vite for fast development and building
- Replit integration with runtime error handling
- PostCSS with Tailwind CSS for styling
- ESBuild for server-side bundling

**Token Contracts**:
- YHT Token: `0x3279eF4614f241a389114C77CdD28b70fcA9537a`
- USDT (BSC): `0x55d398326f99059fF775485246999027B3197955`
- YHT/USDT LP: `0x6fd64bd3c577b9613ee293d38e6018536d05c799`
- PancakeSwap Router V2: `0x10ED43C718714eb63d5aA57B78B54704E256024E`