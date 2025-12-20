# 🚀 P0 Critical Fixes - Implementation Guide

## Overview

This document outlines the **P0 (Priority 0) critical blockers** that have been fixed to enable end-to-end functionality for the GolfFox transport management system.

---

## ✅ Completed Fixes

### 1. **Environment Variables for Supabase Configuration**

**Problem:** Hardcoded Supabase URL and anon key in source code.

**Solution:**
- Modified `lib/supabase/supabase_config.dart` to use `String.fromEnvironment()`
- Removed all hardcoded credentials
- Added validation and logging (states only, never values)

**Build Command:**
```bash
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key
```

**Files Changed:**
- `lib/supabase/supabase_config.dart`

---

### 2. **Fixed RLS Helper Function (UUID Type)**

**Problem:** `get_user_carrier_id()` returned `text` instead of `uuid`, causing implicit cast errors in RLS policies.

**Solution:**
- Created SQL migration `supabase_p0_fixes.sql`
- Dropped and recreated function with `RETURNS uuid`
- Re-applied all dependent RLS policies

**SQL Migration:**
```sql
CREATE OR REPLACE FUNCTION get_user_carrier_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS 
  SELECT carrier_id FROM users WHERE id = auth.uid();
```

**Files Changed:**
- `supabase_p0_fixes.sql` (new)

---

### 3. **Realtime Subscriptions for GPS Tracking**

**Problem:** No real-time updates for motorista positions on passageiro/operador dashboards.

**Solution:**
- Added `createRealtimeSubscription()` helper to `SupabaseConfig`
- Implemented Realtime streams in all dashboards
- Subscriptions filtered by `trip_id` for efficiency

**Implementation:**
```dart
// Subscribe to motorista positions for a specific trip
_supabaseService.streamDriverPositionsRealtime(tripId).listen((positions) {
  setState(() => _driverPositions = positions);
});
```

**Files Changed:**
- `lib/supabase/supabase_config.dart`
- `lib/screens/motorista/trip_detail_screen.dart`
- `lib/screens/passageiro/passenger_dashboard.dart`

**Manual Step Required:**
Go to Supabase Dashboard → **Database** → **Replication** → Enable `public.driver_positions`

---

### 4. **Replaced Mock Data with Real Supabase Queries**

**Problem:** Dashboards used `LocalDataService` with mock data instead of real Supabase data.

**Solution:**
- Replaced `LocalDataService.getTripsForUser()` with `SupabaseService.getTripsForUser()`
- All CRUD operations now respect RLS policies
- Role-based data filtering (admin/operator/carrier/driver/passenger)

**Files Changed:**
- `lib/screens/motorista/driver_dashboard.dart`
- `lib/screens/passageiro/passenger_dashboard.dart`
- `lib/screens/motorista/trip_detail_screen.dart`

---

### 5. **Trip State Transitions with RPC**

**Problem:** Direct status updates bypassed business logic and concurrency control.

**Solution:**
- Integrated `rpc_trip_transition` in start/complete trip actions
- Added error handling for invalid state transitions
- Displays user-friendly error messages

**Implementation:**
```dart
final result = await _supabaseService.transitionTripStatus(
  tripId: widget.trip.id,
  newStatus: 'inProgress',
);

if (result['success'] == false) {
  throw Exception(result['error'] ?? 'Invalid state transition');
}
```

**Files Changed:**
- `lib/screens/motorista/trip_detail_screen.dart`

---

## 🔐 Security Improvements

### Tightened GRANTs

The SQL migration removes `GRANT ALL` permissions and applies minimal grants:

```sql
-- Driver positions: only SELECT and INSERT
GRANT SELECT, INSERT ON driver_positions TO authenticated;

-- Routes/Vehicles: SELECT for all, modify via RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON routes TO authenticated;
```

RLS policies enforce who can actually perform these operations.

---

## 📋 Manual Steps Required

### 1. **Apply SQL Migration**

Run the migration in Supabase SQL Editor:
```bash
# Copy contents of supabase_p0_fixes.sql to Supabase Dashboard
# SQL Editor → New Query → Paste → Run
```

### 2. **Enable Realtime for driver_positions**

Go to Supabase Dashboard:
1. Navigate to **Database** → **Replication**
2. Find `public.driver_positions`
3. Toggle **Realtime** to ON

### 3. **Rotate API Keys (Post-Cleanup)**

After verifying all works:
1. Go to **Settings** → **API**
2. Click **Rotate** for `anon` key
3. Click **Rotate** for `service_role` key
4. Update your environment variables

### 4. **Build with Environment Variables**

Always build with:
```bash
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key
```

---

## 🧪 Testing Checklist

### Driver Flow
- [ ] Driver logs in successfully
- [ ] Dashboard loads trips from Supabase (not mocks)
- [ ] motorista can start trip → status transitions to `inProgress`
- [ ] GPS tracking starts automatically
- [ ] Driver positions are inserted to Supabase
- [ ] motorista can complete trip → status transitions to `completed`
- [ ] Invalid transitions show error messages

### Passenger Flow
- [ ] Passenger logs in successfully
- [ ] Dashboard shows active trip
- [ ] Map displays real-time driver positions
- [ ] Positions update automatically (Realtime)
- [ ] Map auto-centers on latest position

### Operator/Admin Flow
- [ ] Can view all trips (admin) or company trips (operator)
- [ ] Can force transition trip status with `p_force=true`
- [ ] Can view trip events audit log
- [ ] Can access trip summary analytics

### RLS Verification
- [ ] Driver can only see their assigned trips
- [ ] passageiro can only see trips they're enrolled in
- [ ] Carrier can only see routes/vehicles for their carrier_id
- [ ] motorista can only insert positions with `driver_id = auth.uid()`

---

## 🐛 Troubleshooting

### "Missing environment variables" Error
**Solution:** Ensure you're building with `--dart-define` flags:
```bash
flutter run --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...
```

### "Invalid state transition" Error
**Cause:** Trying to transition from incompatible state (e.g., `completed` → `inProgress`)

**Allowed Transitions:**
- `scheduled` → `inProgress`
- `inProgress` → `completed`
- `inProgress` → `cancelled`
- Admin/operador can use `p_force=true` to override

### Real-time Not Working
**Solution:** Enable Realtime in Supabase Dashboard:
```
Database → Replication → driver_positions → Toggle ON
```

### "Permission Denied" on Routes/Vehicles
**Cause:** `get_user_carrier_id()` returning wrong type

**Solution:** Run the SQL migration to fix the UUID type.

---

## 📊 Performance Optimizations

The SQL migration creates indexes for common queries:

```sql
-- Trip-based position queries (most common)
CREATE INDEX idx_driver_positions_trip_id ON driver_positions(trip_id, timestamp DESC);

-- Driver-based queries
CREATE INDEX idx_driver_positions_driver_id ON driver_positions(driver_id, timestamp DESC);

-- Composite for filtered queries
CREATE INDEX idx_driver_positions_trip_driver ON driver_positions(trip_id, driver_id, timestamp DESC);
```

---

## 🔄 CI/CD Integration (P1)

### Sanity Tests Script

Create `scripts/sanity.sh`:
```bash
#!/bin/bash
set -e

echo "🧪 Running GolfFox Sanity Tests..."

# Test 1: Auth for all 5 test users
for USER in admin@golffox.com operator@golffox.com carrier@golffox.com driver@golffox.com passenger@golffox.com; do
  echo "Testing auth for $USER..."
  curl -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$USER\",\"password\":\"senha123\"}"
done

# Test 2: Insert driver position (requires JWT)
echo "Testing motorista position insert..."
# ... implementation

# Test 3: RPC trip transition
echo "Testing trip state transition..."
# ... implementation

echo "✅ All sanity tests passed!"
```

---

## 📚 Architecture Reference

- **RLS Policies:** Canonical role-based access (admin/operator/carrier/driver/passenger)
- **State Machine:** `rpc_trip_transition` enforces valid transitions
- **Realtime:** Server-side filtering by `trip_id` for efficiency
- **Audit Log:** All transitions logged in `trip_events` table
- **Analytics:** `trip_summary` materialized view (refreshed by `pg_cron`)

---

## 🎯 Next Priorities

### P1 - Quality & Reliability
- [ ] Add Sentry for error tracking
- [ ] Implement checklist UI (12-item pre-trip inspection)
- [ ] Storage buckets + RLS for vehicle documents
- [ ] Automated sanity tests in CI

### P2 - User Experience
- [ ] Offline mode improvements (queue sync)
- [ ] Push notifications for trip events
- [ ] Driver performance dashboard
- [ ] Passenger ETA calculations

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase logs: Dashboard → Logs
3. Check Flutter debug console for error messages
4. Verify RLS policies in SQL Editor

---

**Last Updated:** $(date)
**Version:** v7.4 - P0 Fixes Applied
