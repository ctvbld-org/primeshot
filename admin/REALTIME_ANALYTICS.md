# Realtime Analytics Implementation

This document describes the implementation of realtime analytics for the admin dashboard.

## Overview

The admin dashboard now uses Supabase realtime subscriptions to automatically update analytics data when changes occur in the database. This eliminates the need for constant polling and provides instant feedback when data changes.

## Architecture

### Database Setup
- **Migration**: `20250116000001_enable_realtime_analytics_tables.sql` enables realtime on all analytics tables
- **Tables**: All analytics tables are added to the `supabase_realtime` publication
- **Cost**: $0 when no admin portals are open (no WebSocket connections)

### Frontend Implementation
- **Custom Hook**: `useRealtimeAnalytics` manages realtime subscriptions and connection status
- **Component Updates**: All dashboard components now use realtime subscriptions
- **Visual Indicators**: WiFi icons show connection status (green=connected, red=error, gray=connecting)

## Enabled Tables

The following tables have realtime enabled for dashboard analytics:

### Revenue Analytics
- `user_subscriptions` - Subscription revenue data
- `credit_pack_purchases` - Credit pack revenue data  
- `user_credits` - Refund and credit transaction data
- `subscriptions` - Pricing configuration data

### User Analytics
- `users` - User registration and growth data

### Usage Analytics  
- `inference_jobs` - Image generation usage data
- `training_jobs` - Model training usage data

### General Analytics
- `waitlist` - Waitlist signup data
- `credit_packs` - Credit pack configuration
- `credit_costs` - Credit cost configuration

## Component Features

### Revenue Analytics
- **Auto-updates**: Chart refreshes when revenue-affecting changes occur
- **Visual Indicator**: WiFi icon shows realtime connection status  
- **Real-time Events**: Responds to subscription changes, credit pack purchases, refunds

### All Dashboard Components
- **Fallback Polling**: Components maintain polling as backup (every 1-5 minutes)
- **Connection Status**: Visual indicators show realtime connection health
- **Error Handling**: Graceful degradation when realtime fails
- **Automatic Reconnection**: Handles network interruptions

## Usage

### Individual Component Realtime
```typescript
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics'

const { isConnected, connectionError } = useRealtimeAnalytics({
  tables: ['user_subscriptions', 'credit_pack_purchases'],
  onDataChange: (table, eventType, record) => {
    console.log(`${eventType} on ${table}:`, record)
    refetch() // Trigger data refresh
  },
  enabled: true
})
```

### Global Status Monitoring
The `RealtimeStatus` component provides dashboard-wide connection monitoring:
- Green badge: "Live Updates Active" 
- Red badge: "Connection Error"
- Gray badge: "Connecting..."

## Benefits

1. **Instant Updates**: Revenue chart updates immediately when payments complete
2. **Reduced Database Load**: Eliminates ~20-30 simultaneous queries every 30s-5min
3. **Better UX**: Live data without manual refresh required
4. **Cost Efficient**: $0 overhead when dashboard not in use
5. **Graceful Degradation**: Falls back to polling if realtime fails

## Development

### Testing Realtime Updates
1. Open admin dashboard
2. Look for green WiFi icons indicating live connection
3. Make changes in webapp (create subscription, purchase credits, etc.)
4. Observe instant updates in admin dashboard

### Monitoring
- Console logs show realtime events and data changes
- Connection status visible via WiFi indicators
- Error states clearly indicated with red icons

### Troubleshooting
- Check Supabase realtime configuration
- Verify table permissions and RLS policies
- Monitor browser console for connection errors
- Ensure proper environment variables are set

## Implementation Details

### Connection Management
- Single WebSocket connection per dashboard session
- Automatic reconnection on network failures
- Proper cleanup when components unmount

### Performance Optimizations
- Debounced refetches to prevent excessive queries
- Targeted table subscriptions (only relevant tables per component)
- Fallback polling maintains reliability

### Security
- All realtime subscriptions respect existing RLS policies
- No additional permissions required
- Service role not needed for dashboard realtime 