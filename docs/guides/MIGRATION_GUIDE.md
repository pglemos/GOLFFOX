# 🚀 GolfFox Migration Guide v7.4

**Objective:** Upgrade from basic auth to production-ready canonical role-based security with trip management features.

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Apply Database Migration

1. **Open Supabase Dashboard**: https://app.supabase.com
2. **Navigate to**: SQL Editor
3. **Copy the entire content** of `lib/supabase/migration_v7_4_canonical.sql`
4. **Paste and Run**
5. **Verify**: You should see "Success. No rows returned"

### Step 2: Enable Realtime

1. In Supabase Dashboard → **Database** → **Replication**
2. Find table: `driver_positions`
3. Click toggle to **Enable**
4. ✅ Realtime is now active

### Step 3: Test in Flutter App

**Test accounts** (password: `senha123` for all):
- `admin@golffox.com` (Admin - full access)
- `operador@golffox.com` (operador - company-scoped)
- `transportadora@golffox.com` (transportadora - transportadora-scoped)
- `motorista@golffox.com` (motorista - own trips only)
- `passageiro@golffox.com` (passageiro - assigned trips only)

**Test scenarios:**
1. Login as driver → Start a trip → See GPS tracking
2. Login as operator → View company trips only
3. Login as admin → Use "Reopen Trip" with force flag
4. Open two devices → Watch real-time position updates

---

## 📖 What Changed?

### 🔒 Security (RLS Policies)

**Before:**
```sql
-- Anyone authenticated could do anything
CREATE POLICY "Authenticated users can view trips" ON trips
  FOR SELECT TO authenticated USING (true);
```

**After:**
```sql
-- Drivers can only see their own trips
CREATE POLICY "motorista view own trips" ON trips
  FOR SELECT TO authenticated 
  USING (
    get_user_role() = 'motorista' AND 
    driver_id = auth.uid()
  );
```

### 🔄 Trip State Management

**New RPC Function:**
```dart
// Use this instead of direct UPDATE
final result = await SupabaseService.instance.transitionTripStatus(
  tripId: tripId,
  newStatus: 'inProgress',
);

if (result['success']) {
  print('Trip started!');
} else {
  print('Error: ${result['error']}');
}
```

**Valid transitions:**
- `scheduled` → `inProgress` (motorista starts)
- `inProgress` → `completed` (motorista finishes)
- `inProgress` → `cancelled` (Admin/operador cancels)
- `completed` → `inProgress` (Admin reopen with `force: true`)

### 📊 Automatic Trip Summaries

**Before:** Manual calculation required  
**After:** Automatic on every GPS position update

```dart
// Just insert positions as normal
await SupabaseService.instance.insertDriverPosition(
  tripId: tripId,
  driverId: driverId,
  latitude: lat,
  longitude: lng,
);

// Summary automatically calculated (distance, duration, speed, etc.)
final summary = await SupabaseService.instance.getTripSummary(tripId);
print('Total distance: ${summary['total_distance_km']} km');
```

### 🗂️ New Features

1. **Audit Trail**: Every trip state change logged to `trip_events`
2. **Checklists**: Pre/post-trip vehicle inspections
3. **Reporting**: Materialized views for analytics (auto-refresh every minute)

---

## 🛠️ Troubleshooting

### Error: "Policy violation" when accessing data

**Cause:** User role not set correctly  
**Fix:**
```sql
-- Check user role
SELECT id, email, role FROM users WHERE email = 'your@email.com';

-- Update if needed
UPDATE users SET role = 'motorista' WHERE email = 'your@email.com';
```

### Error: "Function rpc_trip_transition does not exist"

**Cause:** Migration not fully applied  
**Fix:** Re-run the migration SQL (it's idempotent - safe to run multiple times)

### Realtime not updating

**Cause:** Realtime not enabled for table  
**Fix:**
1. Supabase Dashboard → Database → Replication
2. Enable for: `driver_positions`, `trips`

### pg_cron job not running

**Cause:** Extension not enabled (some Supabase plans require support activation)  
**Fix:**
- Check: `SELECT * FROM cron.job;`
- If empty, contact Supabase support to enable `pg_cron` extension
- Alternative: Manually refresh MV periodically via SQL Editor:
  ```sql
  SELECT refresh_trip_report_mv();
  ```

---

## 🔍 Verification Commands

Run these in Supabase SQL Editor to verify installation:

```sql
-- 1. Check all policies exist
SELECT tablename, COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;
-- Expected: users(6), trips(5), driver_positions(5), etc.

-- 2. Verify RPC function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'rpc_trip_transition';
-- Expected: 1 row

-- 3. Check trip summary function
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'calculate_trip_summary';
-- Expected: 1 row

-- 4. Verify new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('trip_events', 'trip_summary', 'checklists');
-- Expected: 3 rows

-- 5. Check materialized view
SELECT matviewname 
FROM pg_matviews 
WHERE schemaname = 'public';
-- Expected: mvw_trip_report

-- 6. Verify pg_cron job (optional)
SELECT jobname, schedule, command 
FROM cron.job 
WHERE jobname = 'refresh-trip-reports';
-- Expected: 1 row (or empty if pg_cron not enabled)
```

---

## 📚 API Reference (Quick)

### Trip Management

```dart
// Start trip (motorista)
await SupabaseService.instance.transitionTripStatus(
  tripId: id,
  newStatus: 'inProgress',
);

// Complete trip
await SupabaseService.instance.transitionTripStatus(
  tripId: id,
  newStatus: 'completed',
);

// Reopen (admin only)
await SupabaseService.instance.transitionTripStatus(
  tripId: id,
  newStatus: 'inProgress',
  force: true,
  notes: 'Customer requested changes',
);
```

### Real-time Tracking

```dart
// Stream motorista positions (real-time)
SupabaseService.instance
  .streamDriverPositionsRealtime(tripId)
  .listen((positions) {
    updateMapMarkers(positions);
  });

// Stream trip status changes
SupabaseService.instance
  .streamTripStatus(tripId)
  .listen((trip) {
    if (trip['status'] == 'completed') {
      showCompletionDialog();
    }
  });
```

### Checklists

```dart
// Create pre-trip checklist
await SupabaseService.instance.createChecklist(
  tripId: tripId,
  type: 'pre_trip',
  data: {
    'vehicle_condition': 'excellent',
    'fuel_level': 'full',
    'lights_working': true,
    'brakes_working': true,
    'emergency_kit': true,
  },
);
```

### Reporting

```dart
// Get trip reports (uses materialized view)
final reports = await SupabaseService.instance.getTripReports(
  startDate: DateTime(2024, 1, 1),
  endDate: DateTime.now(),
  status: 'completed',
);

// Get trip summary
final summary = await SupabaseService.instance.getTripSummary(tripId);
print('Distance: ${summary?['total_distance_km']} km');
print('Duration: ${summary?['total_duration_minutes']} min');
print('Avg Speed: ${summary?['avg_speed_kmh']} km/h');
```

---

## 🎯 Next Steps

1. ✅ **Apply migration** (Step 1 above)
2. ✅ **Enable Realtime** (Step 2 above)
3. ✅ **Test all roles** (Step 3 above)
4. 🔜 **Add E2E tests** (Playwright for web admin)
5. 🔜 **Set up Sentry** (Error monitoring)
6. 🔜 **Create Postman collection** (API documentation)
7. 🔜 **Storage buckets** (Vehicle/driver documents)

---

## 📞 Support

- **Documentation**: See `AUDIT_REPORT_v7.4.md` for detailed breakdown
- **Feedback**: Use Dreamflow "Submit Feedback" button
- **SQL Migration**: `lib/supabase/migration_v7_4_canonical.sql`

---

**Last Updated:** 2025-01-XX  
**Version:** v7.4 Canonical  
**Status:** ✅ Production Ready
