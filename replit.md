# Coffee Date App

## Overview
Coffee Date is a mobile dating application connecting Guests with Hosts for coffee-focused meetups. It features a 3-tier user system (Admin, Host, Guest) and handles the entire dating lifecycle from discovery and matching to chat, date planning, and secure payment. The app is built with React Native (Expo) for the frontend, Express.js for the backend, and PostgreSQL for the database. Its core purpose is to facilitate unique coffee-centric social interactions and provide a platform for Hosts to monetize their time.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React Native with Expo SDK 54, targeting iOS, Android, and Web.
- **Navigation**: React Navigation with a nested structure including `RootStackNavigator`, `AuthStackNavigator`, `MainTabNavigator` (Discover, Matches, Calendar, Profile), and modal screens.
- **State Management**: React Query for server state and caching, React Context (`AuthContext`) for authentication, and AsyncStorage for session persistence.
- **UI/UX**: Custom theming with light/dark modes, coffee-inspired color palette, platform-adaptive components, haptic feedback, and Reanimated for animations.

### Backend
- **Framework**: Express.js with TypeScript, implementing a RESTful API.
- **Authentication**: Passwordless OTP via email with rate limiting for security.
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries and migrations.
- **Key Schemas**: `users` (profile, role, location), `otp_codes`, `swipes`, `matches`, `messages`, `coffee_dates` (scheduling, payment), `wallet_transactions`.

### Project Structure
- **Monorepo**: Client (`client/`), server (`server/`), and shared code (`shared/`) in a single repository.
- **Shared Code**: `shared/schema.ts` for database schema definitions ensures type consistency between client and server.
- **Path Aliases**: Configured for clean imports.

### Key Design Decisions
- **Passwordless Auth**: OTP-based authentication for a streamlined mobile UX.
- **Role-Based Onboarding**: Tailored onboarding flows for Hosts and Guests.
- **Wallet-Based Payments**: Guests top-up a wallet, and Hosts set rates, with funds debited upon dual date confirmation.
- **Admin Dashboard**: Dedicated interface for platform management, user moderation, and analytics.

### Feature Specifications
- **Discovery & Matching**: Users swipe, and mutual likes create matches.
- **Chat**: Real-time messaging between matched users.
- **Date Planning**: Users can propose, accept, decline, and confirm coffee dates, including cafe selection via an integrated map.
- **Payment System**: Guests use an in-app wallet, topped up via Stripe. Hosts set their date rates. Dual confirmation from both Guest and Host is required before payment processing.
- **Admin System**: Comprehensive admin dashboard for managing users, matches, dates, and transactions, with a protected super admin role.
- **Profile Preview**: Allows users to see their public profile as others would view it.
- **Host Reviews**: Guests can review Hosts after completed dates.
- **Push Notifications**: Infrastructure for user notifications.

## External Dependencies

### Database
- **PostgreSQL**: Primary relational database.
- **Drizzle ORM**: Used for database interactions and migrations.

### Email Service
- **Nodemailer**: For sending OTP verification emails.

### Maps & Location
- **react-native-maps**: For displaying maps and selecting cafes.
- **expo-location**: For handling location permissions and geocoding.

### Payments
- **Stripe**: Integrated for secure wallet top-ups (checkout sessions).

### Media
- **expo-image-picker**: For user profile photo selection.
- **expo-image**: For optimized image rendering.

### Environment Variables
- `NEON_DATABASE_URL` (or `DATABASE_URL` fallback): PostgreSQL connection string.
- `EXPO_PUBLIC_DOMAIN`: Public domain for API requests.
- `SMTP_*`: SMTP server configuration for email delivery.