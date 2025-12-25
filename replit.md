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
- `users`: Profile data, role (host/guest), location, preferences
- `otp_codes`: Verification codes with expiry tracking

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

### December 2025
- **Database**: Configured to use external Neon database via `NEON_DATABASE_URL`
- **Bottom Navigation**: Fixed tab bar visibility with custom labels using explicit Text components with black (#000000) inactive color and coffee brown (#6F4E37) active color
- **Onboarding Data Fix**: Fixed bug where user profile data was being overwritten with demo data. Each onboarding screen now properly saves user selections via AuthContext.updateUser(), with final database persistence on completion
- **UI Improvements**: Tab bar uses cream background (#FFF8F0) with brown border (#6F4E37) for clear visibility