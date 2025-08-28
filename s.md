# Project Overview

## Full-Stack JavaScript DApp with Web3 Integration

This is a full-stack JavaScript application built for Replit, featuring Web3 wallet connectivity, blockchain integration, and a modern React frontend with Express backend.

## Project Architecture

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack Query for server state
- **UI Library**: shadcn/ui with Tailwind CSS
- **Web3**: Wagmi for wallet connectivity

### Backend
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: express-session with PostgreSQL store
- **Authentication**: Passport.js (local strategy)

### Database
- **Provider**: PostgreSQL (Replit-managed)
- **ORM**: Drizzle with migrations
- **Session Store**: connect-pg-simple

### Development Environment
- **Runtime**: Node.js 20
- **Package Manager**: npm
- **Development Server**: Vite with Express backend

## Current Status
- Database: Successfully migrated to PostgreSQL and all tables created
- Environment: Fully configured for Replit environment
- Migration: Completed successfully - project running on port 5000
- Web3 Integration: Ready for development

## User Preferences
- Prefers creating new repositories to avoid conflicts with existing work
- Values clean separation between development environments

## Recent Changes
- 2025-01-18: Completed migration from Replit Agent to Replit environment
- 2025-01-18: Migrated from Neon serverless to standard PostgreSQL  
- 2025-01-18: Successfully created all database tables via Drizzle migrations
- 2025-01-18: Application verified working - server running successfully
- 2025-01-18: User confirmed application is loading correctly
- 2025-01-18: Restructured app into 3 separate pages as requested:
  - Dashboard page with Pool Achievements
  - Interactive ROI Calculator page
  - Staking Pools page
- 2025-01-18: Updated navigation to include sidebar links for all three pages
- 2025-01-18: Cleaned up codebase by removing old staking.tsx page

## Next Steps
- Continue Web3 DApp development with clean 3-page structure
- Integrate smart contract functionality for staking operations