# Timezone Migration to IST

## Overview
All timestamps in the application now use Indian Standard Time (IST - UTC+5:30) instead of UTC.

## Changes Made

### 1. Time Utilities (`src/utils/time.utils.ts`)
Added IST timestamp functions:
- `getCurrentIST()` - Get current time in IST
- `getCurrentISTForComparison()` - Get IST time for database comparisons
- `getOTPExpirationIST()` - Get OTP expiration time (10 minutes from now in IST)
- `ISTTimestamp` - Helper object for common timestamp operations

### 2. Services Updated

#### OTP Service (`src/auth/services/otp.service.ts`)
- `created_at` - Stores OTP creation time in IST
- `expires_at` - Stores OTP expiration time in IST (created_at + 10 minutes)
- `verified_at` - Stores OTP verification time in IST

#### Chat Service (`src/chat/chat.service.ts`)
- `last_seen_at` - Stores user's last seen time in IST

### 3. Usage Examples

```typescript
import { getCurrentIST, ISTTimestamp } from '../utils/time.utils';

// Get current IST timestamp
const now = getCurrentIST();
const now2 = ISTTimestamp.now(); // Alternative

// Get timestamp X minutes from now
const expiresIn30Min = ISTTimestamp.expiresIn(30);

// Convert a Date object to IST
const istTime = ISTTimestamp.fromDate(new Date());

// Store in database
await supabase.from('table_name').insert({
  created_at: getCurrentIST(),
  expires_at: ISTTimestamp.expiresIn(60), // 1 hour from now
});
```

### 4. Database Schema

All timestamp columns should store IST timestamps as ISO 8601 strings:
- Format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Example: `2025-10-28T22:30:00.000Z` (represents 10:30 PM IST)

### 5. Important Notes

⚠️ **Critical**: When comparing timestamps:
- Always use `getCurrentISTForComparison()` for current time
- All stored timestamps are in IST
- Database comparisons work correctly because both sides use IST

✅ **Consistency**: All new records will automatically use IST timestamps.

### 6. Migration Checklist

- [x] OTP Service timestamps (created_at, expires_at, verified_at)
- [x] Chat Service timestamps (last_seen_at)
- [x] Time utility functions created
- [ ] Posts Service (uses Supabase defaults - to be updated if needed)
- [ ] Schedules Service (uses Supabase defaults - to be updated if needed)
- [ ] Projects Service (uses Supabase defaults - to be updated if needed)

### 7. Future Development

When adding new timestamp fields:
1. Import: `import { getCurrentIST } from '../utils/time.utils';`
2. Use: `created_at: getCurrentIST()`
3. Never use: `new Date().toISOString()` directly

### 8. Testing

To verify IST timestamps:
```typescript
const ist = getCurrentIST();
console.log('IST Time:', ist);
// Should show time 5 hours 30 minutes ahead of UTC
```

