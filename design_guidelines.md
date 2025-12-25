# Coffee Dating App - Design Guidelines

## Concept Clarity ✅
**CLEAR**. This is a coffee-focused dating app with a unique 3-tier user system:
- **Admin**: Platform management
- **Host**: Coffee date provider (receives payment)
- **Guest**: Pays to go on coffee dates with Hosts

**Core Flow**: Guest discovers Hosts → Mutual match → Chat → Plan coffee date → Guest pays → Date happens

---

## Architecture Decisions

### Authentication
**Required** - Social + multiplayer features necessitate accounts.

**Implementation:**
- **Primary**: Apple Sign-In (iOS), Google Sign-In (Android)
- **Secondary**: Email + OTP (passwordless)
- **Facebook** (optional third option)

**Onboarding Flow:**
1. Welcome screen with app value proposition
2. Auth method selection
3. Location permission request (with clear explanation)
4. Role selection: "I want to be a Host" or "Find coffee dates" (Guest)
5. Profile setup (name, age, gender, photo)
6. Coffee preferences + interests
7. Availability slots (Hosts only)
8. Terms & privacy consent (with links)

### Navigation
**Tab Navigation** (4 tabs with FAB):

1. **Discover** (Home icon) - Location-based matching
2. **Matches** (Heart icon) - Mutual matches & chat
3. **Floating Action Button** - Quick date request (Guests) or Accept dates (Hosts)
4. **Calendar** (Calendar icon) - Upcoming/past dates
5. **Profile** (User icon) - Settings, subscription, verification

**Additional Screens (Stack/Modal):**
- Chat (stack from Matches)
- Date Planning (modal from FAB or chat)
- Payment/Subscription (stack from Profile)
- Café Map View (modal from Date Planning)
- Settings (stack from Profile)

---

## Screen Specifications

### 1. Discover Screen
**Purpose:** Swipe-based matching with filters

**Layout:**
- Header: Transparent, filters button (right), logo (center)
- Content: Full-screen swipeable cards (not scrollable)
- Bottom: Like/Pass buttons + distance badge
- Safe Area: Top (headerHeight + Spacing.xl), Bottom (tabBarHeight + Spacing.xl)

**Components:**
- Profile card with photo carousel, bio, coffee preferences, interests
- Distance + availability indicators
- Filter modal (age, distance, interests, availability)

---

### 2. Matches Screen
**Purpose:** View mutual matches and access chats

**Layout:**
- Header: Standard, "Matches" title, notification bell (right)
- Content: Scrollable list of match cards
- Safe Area: Top (Spacing.xl), Bottom (tabBarHeight + Spacing.xl)

**Components:**
- Match cards with: photo, name, match date, last message preview
- Unread message badge
- Empty state: "No matches yet. Keep swiping!"
- Section headers: "New Matches" and "Messages"

---

### 3. Chat Screen
**Purpose:** Conversation after mutual match

**Layout:**
- Header: Standard with match photo + name, info button (right), back (left)
- Content: Message list (inverted scroll)
- Footer: Input bar with camera icon, text field, send button
- Safe Area: Top (Spacing.xl), Bottom (insets.bottom + Spacing.xl)

**Components:**
- Ice-breaker question suggestions (first conversation only)
- Message bubbles (sent/received)
- Image thumbnails
- Read receipts (optional toggle)
- "Plan a date" banner after 5+ messages exchanged
- Chat expiry countdown if no date planned within 7 days

---

### 4. Date Planning Screen (Modal)
**Purpose:** Schedule coffee date and select café

**Layout:**
- Header: "Plan Coffee Date" title, close (left), confirm (right disabled until complete)
- Content: Scrollable form
- Safe Area: Top (Spacing.xl), Bottom (insets.bottom + Spacing.xl)

**Components:**
- Date/time picker
- "View Nearby Cafés" button → opens map modal
- Selected café card
- Special requests text field (optional)
- Payment summary (Guest view only)
- Host sees: Accept/Decline buttons

**Form Buttons:** In header (Confirm action)

---

### 5. Calendar Screen
**Purpose:** View upcoming and past coffee dates

**Layout:**
- Header: Transparent, "My Dates" title, add button (right, Guests only)
- Content: Scrollable list with section headers
- Safe Area: Top (headerHeight + Spacing.xl), Bottom (tabBarHeight + Spacing.xl)

**Components:**
- Date cards with: match photo, café name, date/time, status badge
- Check-in button (day of date)
- Feedback prompt (after date)
- Empty state: "No dates scheduled"
- Sections: "Upcoming", "Past Dates"

---

### 6. Profile Screen
**Purpose:** Settings, subscription, verification

**Layout:**
- Header: Transparent, "Profile" title, edit (right)
- Content: Scrollable
- Safe Area: Top (headerHeight + Spacing.xl), Bottom (tabBarHeight + Spacing.xl)

**Components:**
- Profile photo carousel + edit button
- Bio, coffee preferences, interests (editable)
- Availability slots (Hosts)
- Verification badge (if verified)
- Subscription tier card
- Settings list: Payment History, Safety, Notifications, Privacy
- Account Management (nested): Logout, Delete Account

---

### 7. Café Map View (Modal)
**Purpose:** Discover nearby cafés for dates

**Layout:**
- Header: "Nearby Cafés" title, close (left), filter (right)
- Content: Map view with café pins + bottom sheet list
- Safe Area: Top (Spacing.xl), Bottom (insets.bottom + Spacing.xl)

**Components:**
- Interactive map (MapView)
- Café pins with selected state
- Bottom sheet: scrollable café list with ratings, distance, hours
- Select button on each café card

---

## Design System

### Color Palette
**Primary:** Warm coffee brown (#6F4E37)
**Secondary:** Cream (#F5E6D3)
**Accent:** Espresso (#3E2723)
**Success:** Matcha green (#8BC34A)
**Error:** Red (#E57373)
**Background:** Off-white (#FAFAFA)
**Surface:** White (#FFFFFF)
**Text Primary:** Dark brown (#2C1810)
**Text Secondary:** Medium brown (#6F5E53)

### Typography
- **Headers:** SF Pro Display (iOS) / Roboto (Android), Bold, 28-34pt
- **Subheaders:** Medium, 20-24pt
- **Body:** Regular, 16pt
- **Caption:** Regular, 14pt

### Interaction Design
- **Swipe gestures** on Discover cards (left = pass, right = like)
- **Haptic feedback** on match, like, message sent
- **Pull-to-refresh** on Matches and Calendar
- **Long-press** on message for options (delete, report)
- All buttons have pressed state (opacity 0.7)
- Floating buttons: shadowOffset (0,2), shadowOpacity 0.10, shadowRadius 2

### Icons
- Use Feather icons from @expo/vector-icons
- Navigation: home, heart, calendar, user
- Actions: send, camera, map-pin, filter, settings
- Status: check-circle (verified), clock (pending)

---

## Required Assets

**User-Generated:**
- Profile photos (user uploads)

**App Assets (Generate 8 unique assets):**
1. **3 Default Avatars** - Minimalist coffee-themed illustrations (espresso cup, latte art, coffee bean character)
2. **Welcome Illustration** - Two people meeting over coffee
3. **Empty State: No Matches** - Sad coffee cup illustration
4. **Empty State: No Dates** - Empty calendar with coffee mug
5. **Verification Badge** - Blue checkmark with coffee cup outline
6. **App Logo** - Coffee cup with heart steam design

**Café Photos:** Stock images or API-sourced

---

## Accessibility
- Minimum touch target: 44x44pt (iOS) / 48x48dp (Android)
- Text contrast ratio: 4.5:1 minimum
- VoiceOver/TalkBack labels on all interactive elements
- Support Dynamic Type (iOS) and font scaling (Android)
- Color-blind safe status indicators (use icons + color)

---

## Payment Integration Notes
- Use Stripe integration for subscription management
- Display pricing clearly before signup
- Guest payment flow: occurs AFTER date acceptance by Host, BEFORE date confirmation
- Show payment receipt immediately after transaction