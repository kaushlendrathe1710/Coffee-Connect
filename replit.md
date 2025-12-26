# Coffee Date App

## Overview

Coffee Date is a mobile dating application with a unique coffee-focused matchmaking concept. The app features a 3-tier user system:

- **Admin**: Platform management
- **Host**: Coffee date providers who receive payment for dates
- **Guest**: Users who pay to go on coffee dates with Hosts

The core user flow is: Guest discovers Hosts → Mutual match → Chat → Plan coffee date → Guest pays → Date happens.

Built as a cross-platform React Native app using Expo, with an Express.js backend and PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React Native with Expo SDK 54
- Uses Expo's managed workflow for simplified native development
- Supports iOS, Android, and Web platforms

**Navigation Structure**: React Navigation with nested navigators
- `RootStackNavigator`: Top-level stack handling Auth vs Main app states
- `AuthStackNavigator`: Multi-step onboarding flow (Email → OTP → Welcome → Role → Profile → Preferences → Location → Terms)
- `MainTabNavigator`: 4-tab bottom navigation (Discover, Matches, Calendar, Profile)
- Modal screens for Chat, Date Planning, Cafe Map, Settings

**State Management**:
- React Query (`@tanstack/react-query`) for server state and API caching
- React Context (`AuthContext`) for authentication state
- AsyncStorage for persisting user session

**UI/UX Approach**:
- Custom theming system with light/dark mode support via `useTheme` hook
- Coffee-inspired color palette (browns, creams)
- Platform-adaptive components (blur effects on iOS, solid backgrounds on Android)
- Haptic feedback for interactions via `expo-haptics`
- Reanimated for smooth animations

### Backend Architecture

**Framework**: Express.js with TypeScript
- RESTful API design
- CORS configured for Replit deployment domains

**Authentication System**: Passwordless OTP via email
- Rate limiting for OTP send attempts (5 per hour)
- Rate limiting for OTP verify attempts (5 per 15 min, 30 min lockout on exceed)
- OTPs expire after 10 minutes

**Database Layer**: 
- PostgreSQL database
- Drizzle ORM for type-safe queries and migrations
- Schema defined in `shared/schema.ts` (shared between client/server)

**Key Tables**:
- `users`: Profile data, role (host/guest/admin), location, preferences, isProtected flag
- `otp_codes`: Verification codes with expiry tracking
- `swipes`: Tracks who swiped on whom with direction (like/pass)
- `matches`: Created when two users mutually like each other
- `messages`: Chat messages between matched users
- `coffee_dates`: Scheduled coffee dates with status tracking and payment info
- `wallet_transactions`: Ledger of all wallet credits and debits

### Project Structure

```
client/           # React Native app code
  screens/        # Screen components organized by feature
  components/     # Reusable UI components
  navigation/     # Navigator configurations
  contexts/       # React contexts (Auth)
  hooks/          # Custom hooks
  lib/            # Utilities (API client, query client)
  constants/      # Theme, colors, typography

server/           # Express backend
  routes.ts       # API route definitions
  storage.ts      # Database access layer
  services/       # Business logic (email)
  db.ts           # Database connection

shared/           # Shared code between client/server
  schema.ts       # Drizzle database schema

assets/           # Images, fonts, icons
```

### Key Design Decisions

**Monorepo Structure**: Client and server share TypeScript types via `shared/` directory, ensuring API contract consistency.

**Path Aliases**: Configured in both TypeScript and Babel for clean imports (`@/`, `@shared/`, `@assets/`).

**Passwordless Auth**: Chose OTP over password for improved UX on mobile. Email is the primary identifier.

**Role-Based Onboarding**: Hosts and Guests have different onboarding paths (Hosts set availability, Guests skip it).

## External Dependencies

### Database
- **PostgreSQL**: Primary data store
- **Drizzle ORM**: Database toolkit with `drizzle-kit` for migrations

### Email Service
- **Nodemailer**: SMTP-based email delivery for OTP codes
- Required environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`

### Maps & Location
- **react-native-maps**: Native map integration for cafe selection
- **expo-location**: Location permissions and geocoding

### Media
- **expo-image-picker**: Profile photo selection
- **expo-image**: Optimized image rendering

### Environment Variables Required
- `NEON_DATABASE_URL`: External Neon PostgreSQL connection string (takes priority)
- `DATABASE_URL`: Fallback PostgreSQL connection string
- `EXPO_PUBLIC_DOMAIN`: Public domain for API requests
- `SMTP_*`: Email configuration for OTP delivery

## Recent Changes

### December 2025 - Phase 7: Admin Dashboard System
- **Admin Role**: Added `admin` role type and `isProtected` boolean field to users schema
- **Protected Super Admin**: kaushlendra.k12@fms.edu is auto-created on server start as protected admin (cannot be deleted)
- **Admin Dashboard**: Dedicated AdminDashboardScreen with 5 management tabs:
  - Stats: Platform metrics (users, hosts, guests, admins, matches, dates, messages, revenue)
  - Users: View all users, verify/unverify accounts, delete non-protected users, see wallet balances
  - Matches: View all matches with participant details
  - Dates: View all coffee dates with status, payment info, participants
  - Transactions: View all wallet transactions with user details
- **Admin API Routes** (protected by requireAdmin middleware):
  - GET /api/admin/stats - Platform statistics
  - GET /api/admin/users - All users list
  - GET /api/admin/matches - All matches list  
  - GET /api/admin/dates - All coffee dates list
  - GET /api/admin/transactions - All wallet transactions
  - DELETE /api/admin/users/:userId - Delete user (protected users exempt)
  - PATCH /api/admin/users/:userId/role - Change user role
  - PATCH /api/admin/users/:userId/verify - Toggle user verification
- **Navigation**: Admin users bypass onboarding and route directly to Admin Dashboard
- **Security**: Admin routes require x-admin-id and x-admin-email headers matching database records

### December 2025 - Phase 6: Dual-Confirmation "Date is Set" Flow
- **Dual Confirmation**: Both Guest AND Host must click "Date is Set" before wallet is charged
- **Database Schema**: Added `guestConfirmed` and `hostConfirmed` boolean fields to coffee_dates table
- **Confirm API Endpoint**: POST /api/coffee-dates/:dateId/confirm
  - Either user can call this endpoint with their userId
  - Updates their confirmation status (guestConfirmed or hostConfirmed)
  - When BOTH have confirmed, wallet is automatically charged
  - Returns bothConfirmed: true, paymentProcessed: true when complete
- **ChatScreen Integration**: 
  - Shows prominent "Coffee Date Planned" banner when there's an active date
  - Displays confirmation status for both users (You confirmed / Partner not confirmed)
  - "Date is Set" button visible for the user who hasn't confirmed yet
  - Polls for date updates every 5 seconds to show when partner confirms
- **CalendarScreen Integration**: 
  - Shows confirmation status (Guest pending/confirmed, Host pending/confirmed)
  - "Date is Set" button available for both Guest and Host

### December 2025 - Phase 5: Wallet-Based Payment System
- **Wallet System**: Guests have a wallet balance (in INR paise). Hosts set their own rates.
- **Database Schema**: Added `walletBalance` and `hostRate` fields to users table, created `wallet_transactions` ledger table
- **Wallet API Endpoints**:
  - GET /api/wallet/:userId - Returns balance and transaction history
  - POST /api/wallet/top-up - Creates Stripe checkout session for wallet top-up (INR currency)
  - POST /api/wallet/confirm-topup - Confirms payment after Stripe webhook
- **Chat Access Gating**: Guests can only chat with hosts whose rate is <= their wallet balance
  - MatchesScreen shows lock icons and rate badges for unaffordable hosts
  - Insufficient funds prompt directs to WalletScreen with amount needed
- **WalletScreen**: Shows balance, top-up options (500/1000/2000/5000 INR), transaction history
- **Host Rate Setting**: Hosts can set their rate per date in ProfileScreen
- **State Management**: useFocusEffect ensures wallet balance refreshes when navigating between screens
- **Auth Payload**: walletBalance and hostRate now included in verify-otp and user update responses

### December 2025 - Phase 4: Stripe Payment Integration
- **Stripe Client**: Created stripeClient.ts with Replit connector for secure API key management
- **Payment Flow**: Now wallet-based - guests add funds, hosts set rates, wallet debited on date confirmation
- **Checkout Session**: POST /api/wallet/top-up creates Stripe checkout session for wallet top-ups (INR)
- **Payment Status**: coffee_dates table tracks paymentStatus ('pending', 'paid')
- **CalendarScreen**: Accept/decline buttons for proposed dates, "Date is Set" button for hosts to confirm
- **Status Flow**: proposed → accepted (host) → confirmed (host clicks "Date is Set", wallet charged)

### December 2025 - Phase 3: Cafe Map Integration
- **CafeMapScreen**: Map view with nearby cafes (mock data for MVP), location permission handling, cafe selection UI
- **Navigation Pattern**: Uses replace navigation with state preservation - passes date/time/notes through CafeMap round-trip to prevent data loss
- **DatePlanningScreen Integration**: "Choose a Cafe" button navigates to map, returns with selected cafe while preserving all other form state

### December 2025 - Phase 2: Calendar & Date Planning
- **Database Schema**: Added `coffee_dates` table with fields for scheduling, cafe location, payment tracking, and status
- **Coffee Dates API**:
  - GET /api/coffee-dates/:userId - Returns all dates for a user with enriched host/guest data
  - GET /api/coffee-dates/match/:matchId - Returns dates for a specific match
  - POST /api/coffee-dates - Create a date proposal (auto-derives hostId/guestId from user roles)
  - PATCH /api/coffee-dates/:dateId - Update date status (accept, decline, confirm, cancel)
- **CalendarScreen**: Shows upcoming and past dates fetched from API, with AnimatedEmptyState and pull-to-refresh
- **DatePlanningScreen**: Date picker with 14-day selection, time slots, optional cafe selection, notes field, submits to API
- **Design Polish**: Added GlassCard, ConfettiEffect (match celebration), and AnimatedEmptyState components

### December 2025 - Phase 1: Core Dating Features
- **Demo Login**: Added demo login bypass for @demo.com emails (accepts any 6-digit code). Only works in development mode.
- **Database Schema**: Added swipes, matches, and messages tables for dating functionality
- **Seed Data**: Created 8 demo profiles (6 hosts: Sarah, Michael, Emma, James, Olivia, David; 2 guests: Alex, Sophie)
- **Discovery API**: GET /api/discover/:userId returns profiles based on user role (Guests see Hosts, Hosts see Guests)
- **Swipe API**: POST /api/swipe records swipes and creates matches on mutual likes
- **Matches API**: GET /api/matches/:userId returns matches with last message and unread count
- **Messages API**: GET/POST /api/messages for real-time chat between matched users
- **DiscoverScreen**: Fetches real profiles, saves swipes to database, shows match celebration modal
- **MatchesScreen**: Fetches real matches from database with conversation previews
- **ChatScreen**: Real-time messaging with polling, ice breakers for new conversations

### Previous Changes (December 2025)
- **Database**: Configured to use external Neon database via `NEON_DATABASE_URL`
- **Bottom Navigation**: Fixed tab bar visibility with custom labels using explicit Text components with black (#000000) inactive color and coffee brown (#6F4E37) active color
- **Onboarding Data Fix**: Fixed bug where user profile data was being overwritten with demo data. Each onboarding screen now properly saves user selections via AuthContext.updateUser(), with final database persistence on completion
- **UI Improvements**: Tab bar uses cream background (#FFF8F0) with brown border (#6F4E37) for clear visibility

## Known Limitations (MVP)
- **Authentication**: Current APIs accept user IDs from client. For production, implement JWT/session-based auth with server-validated identity.
- **Admin Security**: Admin routes use header-based auth (x-admin-id + x-admin-email). For production, implement signed JWT tokens issued at OTP verification.
- **Real-time Chat**: Uses polling (3s interval) instead of WebSockets. Consider WebSocket upgrade for production.

## Admin Access
- **Super Admin Email**: kaushlendra.k12@fms.edu
- **Access**: Login with super admin email via OTP → automatically routes to Admin Dashboard
- **Protection**: Super admin cannot be deleted, role cannot be changed