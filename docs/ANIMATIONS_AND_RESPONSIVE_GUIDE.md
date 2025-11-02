# GolfFox v11.0 — Motion, Responsiveness and Performance

This document details the animation system, responsive behavior, performance targets, compatibility, and test plan for the new UI.

## Motion System

- Centralized in `lib/core/motion/gf_motion.dart`:
  - Durations: 300ms (short), 400ms (medium), 500ms (long)
  - Curves: easeOutCubic, easeInOutCubic
  - Page transition: fade + subtle slide, implemented via `CustomTransitionPage`
- Microinteractions:
  - `GfHoverScale` adds hover/press scale and optional shadow
  - Applied to KPI cards and Quick Actions; TopBar pills use implicit animations

### Where Animations Are Used

- Route transitions: `lib/router.dart` uses `GfMotion.transitionPage` for all `/admin/*` routes
- Dashboard blocks: fade/slide-in via `flutter_animate` (300ms)
- KPI cards: scale on hover/press + fade/slide-in
- Quick actions: scale on hover/press + fade/slide-in
- SideNav items: animated highlight + hover background; active bar animates
- Alert banners: fade/slide-in

## Responsiveness

- Shell:
  - `GfResponsiveShell` switches to AppBar + Drawer on small screens
  - Router now uses `GfResponsiveShell` so mobile/tablet layouts are automatic
- Widgets use flexible layouts and intrinsic sizing; grid/card counts adapt to width via `LayoutBuilder`

### Breakpoints (guideline)

- Mobile: < 768px — Drawer navigation, single-column content
- Tablet: 768–1024px — SideNav visible, 2–3 columns in grids
- Desktop: > 1024px — Full SideNav + 3–4 columns

## Performance Targets and Techniques

- 60fps: implicit animations with lightweight transforms; reduced overdraw
- `RepaintBoundary` added around charts
- Avoid unnecessary rebuilds; prefer `const` where possible
- Web renderer: use `--web-renderer canvaskit` for consistent animation behavior

## Compatibility (Web, Android, iOS)

- Web: Chrome, Safari, Firefox; test with `canvaskit` renderer for parity
- Android/iOS: Material 3 theme + implicit animations; no platform-specific code required

## Build/Run

- Web development:
  ```
  flutter run -d chrome --web-port 8080 \
    --web-renderer canvaskit \
    --dart-define=SUPABASE_URL=<URL> \
    --dart-define=SUPABASE_ANON_KEY=<ANON>
  ```
- Web production: `flutter build web --web-renderer canvaskit`
- Android: `flutter build apk`
- iOS: `flutter build ios` (requires Xcode + provisioning)

## Test Plan

1) Responsiveness
   - Resize browser to mobile/tablet/desktop widths
   - Verify Drawer on mobile, SideNav on larger screens

2) Motion Validation
   - Route changes: check fade+slide, ~400ms
   - Hover KPI/QuickAction: subtle scale and shadow
   - SideNav selection: highlight animates, hover background appears
   - Dashboard blocks: staged fade/slide-in within 300–500ms

3) Stress Tests
   - Trigger multiple hover/press animations simultaneously
   - Navigate rapidly between routes; FPS should remain smooth

4) Browser/Platform Matrix
   - Chrome, Safari, Firefox (latest + last 1 major)
   - Android (mid/low-end), iOS (older + newer devices)

5) Performance
   - Confirm ~60fps (Chrome devtools performance, Flutter DevTools)
   - Ensure fast initial load; prefer canvaskit for smoothness

## Maintenance Guide

- Use `GfMotion` for durations/curves for consistency
- Prefer implicit animations (`AnimatedContainer`, `AnimatedOpacity`, `AnimatedScale`)
- For new routes: wrap in `GfMotion.transitionPage(child: ...)`
- Keep animations between 300–500ms; use `easeInOutCubic` for transitions
- For heavy widgets (maps/charts): wrap in `RepaintBoundary`

