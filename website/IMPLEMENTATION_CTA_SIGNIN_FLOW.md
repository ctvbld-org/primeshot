# CTA Button Sign-in and Subscription Flow Implementation

## Summary

This implementation adds authentication-aware behavior to CTA buttons on the website homepage, with automatic redirection based on user authentication and subscription status after successful sign-in.

## Changes Made

### 1. New Files Created

#### API Route
- **`website/src/app/api/subscription/current/route.ts`**
  - Fetches current user's subscription status from Supabase
  - Returns subscription data with plan details or null if no subscription

#### Supabase Server Client
- **`website/src/lib/supabase/server.ts`**
  - Server-side Supabase client for API routes
  - Handles cookies for SSR authentication

#### Hooks
- **`website/src/hooks/useCurrentSubscription.ts`**
  - React Query hook to fetch current subscription
  - Replaces stub implementation with real API calls
  - Auto-fetches when user is authenticated

- **`website/src/hooks/useSubscriptionStatus.ts`**
  - Derives subscription status from useCurrentSubscription
  - Returns `hasActiveSubscription` boolean

- **`website/src/hooks/useGenerationIntent.ts`**
  - Manages user intent in localStorage
  - Stores intent when user wants to perform action requiring auth
  - 30-minute expiry for security

- **`website/src/hooks/useIntentHandler.ts`**
  - Monitors authentication state
  - Automatically redirects based on intent type and subscription status
  - Handles `subscribe`, `generate_images`, and `create_shoot` intents

#### Components
- **`website/src/components/IntentHandler.tsx`**
  - Wrapper component that runs useIntentHandler hook
  - Added to layout for global intent processing

### 2. Modified Files

#### CTASection Component
- **`website/src/components/InteractiveGenerateBar/CTASection.tsx`**
  - Added auth and subscription status checks
  - Conditional button rendering:
    - **Not authenticated**: Saves `subscribe` intent → Opens sign-in dialog
    - **Authenticated, no subscription**: Redirects to `/pricing`
    - **Authenticated, has subscription**: Shows plain text (not clickable)
  - Added loading state handling

#### CTAHero Component
- **`website/src/components/CTAHero/CTAHero.tsx`**
  - Added auth and subscription status checks
  - "Create your shoot" button behavior:
    - **Not authenticated**: Saves `create_shoot` intent → Opens sign-in dialog
    - **Authenticated, no subscription**: Redirects to `/pricing`
    - **Authenticated, has subscription**: Redirects to `/create`
  - Added loading state (disables button during subscription check)
  - Added sign-in dialog

#### Layout
- **`website/src/app/[locale]/layout.tsx`**
  - Added IntentHandler component inside AuthProvider
  - Ensures intent processing happens globally after sign-in

## User Flows

### CTASection: "Start from $9 a month" Button

#### Flow 1: User Not Signed In
1. User clicks button
2. Intent is saved to localStorage (`subscribe` action)
3. Sign-in dialog opens
4. User completes sign-in
5. IntentHandler detects authentication + stored intent
6. User is automatically redirected to `/pricing` page

#### Flow 2: User Signed In, No Subscription
1. User clicks button
2. User is immediately redirected to `/pricing` page

#### Flow 3: User Signed In, Has Active Subscription
1. Button displays as plain text (not clickable)
2. No action occurs

### CTAHero: "Create your shoot" Button

#### Flow 1: User Not Signed In
1. User clicks "Create your shoot" button
2. Intent is saved to localStorage (`create_shoot` action)
3. Sign-in dialog opens
4. User completes sign-in
5. IntentHandler checks subscription status
6. **If has subscription**: Redirects to `/create`
7. **If no subscription**: Redirects to `/pricing`

#### Flow 2: User Signed In, No Subscription
1. User clicks button
2. User is immediately redirected to `/pricing` page

#### Flow 3: User Signed In, Has Active Subscription
1. User clicks button
2. User is immediately redirected to `/create` page

## Technical Details

### Intent Storage
- Stored in `localStorage` with key `generation-intent`
- Contains: `{ requiredCredits, timestamp, actionType, actionData }`
- Expires after 30 minutes
- Cleared after successful processing

### Intent Types
- **`subscribe`**: Always redirects to `/pricing` after sign-in
- **`generate_images`**: Always redirects to `/pricing` after sign-in
- **`create_shoot`**: Redirects to `/create` if subscribed, otherwise `/pricing`

### Subscription Check
- API route checks `user_subscriptions` table
- Joins with `subscriptions` table for plan details
- Status must be `'active'` for hasActiveSubscription to be true

### React Query Integration
- Uses existing QueryClientProvider from StyleProviders
- 1-minute stale time, 5-minute cache time
- Only queries when user is authenticated

## Testing Checklist

### CTASection Button
- [ ] Not signed in: Button opens sign-in dialog
- [ ] Sign-in successful: Auto-redirect to /pricing
- [ ] Already signed in, no subscription: Button redirects to /pricing
- [ ] Already signed in, has subscription: Text displays (not clickable)

### CTAHero Button
- [ ] Not signed in: Button opens sign-in dialog
- [ ] Sign-in successful (with subscription): Auto-redirect to /create
- [ ] Sign-in successful (no subscription): Auto-redirect to /pricing
- [ ] Already signed in, no subscription: Button redirects to /pricing
- [ ] Already signed in, has subscription: Button redirects to /create
- [ ] Button disabled during subscription loading

### General
- [ ] Intent expires after 30 minutes (no redirect)
- [ ] Multiple sign-ins don't cause issues
- [ ] Works across page refreshes

## Dependencies

### Required Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Database Tables Required
- `user_subscriptions` - User subscription records
- `subscriptions` - Plan definitions

### npm Packages
- `@tanstack/react-query` (already installed)
- `@supabase/ssr` (already installed)
- `@supabase/supabase-js` (already installed)

## Notes

- Intent handler processes different intent types differently
- Webapp intent handler remains unchanged (uses dialog instead of redirect)
- Loading states prevent flickering during subscription check
- Server-side authentication ensures secure subscription verification
- Both buttons share the same sign-in dialog component

