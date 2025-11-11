import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'gf_tokens.dart';

/// GolfFox Theme System
/// Inspired by Apple's Human Interface Guidelines, Tesla's minimalism, and Nubank's vibrant touches
ThemeData gxTheme(Brightness brightness) {
  const seed = Color(GfTokens.brand);
  final cs = ColorScheme.fromSeed(seedColor: seed, brightness: brightness);
  final textTheme = GoogleFonts.interTextTheme();

  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: cs,
    textTheme: textTheme,

    // Card Theme
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(GfTokens.radius2),
        side: BorderSide(color: cs.outline.withOpacity(0.1)),
      ),
      margin: const EdgeInsets.all(GfTokens.gap),
    ),

    // Button Themes
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(GfTokens.radius),
        ),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(GfTokens.radius),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(GfTokens.radius),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: GfTokens.gap2,
          vertical: GfTokens.gap2,
        ),
      ),
    ),

    // Text Button
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        padding: const EdgeInsets.symmetric(
          horizontal: GfTokens.gap3,
          vertical: GfTokens.gap2,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(GfTokens.radius2),
        ),
      ),
    ),

    // Chip Theme
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(GfTokens.radius2),
      ),
      labelPadding: const EdgeInsets.symmetric(
        horizontal: GfTokens.gap3,
        vertical: GfTokens.gap2,
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: GfTokens.gap2,
        vertical: GfTokens.gap,
      ),
      side: BorderSide(
        color: cs.outline.withOpacity(0.2),
      ),
      // shape defined above
    ),

    // Input Decoration Theme
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: cs.surface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(GfTokens.radius),
        borderSide: BorderSide(color: cs.outline.withOpacity(0.2)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(GfTokens.radius),
        borderSide: BorderSide(color: cs.outline.withOpacity(0.2)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(GfTokens.radius),
        borderSide: BorderSide(color: cs.primary, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: GfTokens.gap2,
        vertical: GfTokens.gap,
      ),
    ),

    // App Bar Theme
    appBarTheme: AppBarTheme(
      elevation: 0,
      centerTitle: false,
      backgroundColor: cs.surface,
      foregroundColor: cs.onSurface,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: textTheme.titleLarge?.copyWith(
        color: cs.onSurface,
        fontWeight: FontWeight.w600,
      ),
    ),

    // Bottom Navigation Bar Theme
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      elevation: GfTokens.elevation3,
      backgroundColor: cs.surface,
      selectedItemColor: cs.primary,
      unselectedItemColor: cs.onSurface.withOpacity(0.6),
      type: BottomNavigationBarType.fixed,
      showUnselectedLabels: true,
    ),

    // Navigation Rail Theme
    navigationRailTheme: NavigationRailThemeData(
      backgroundColor: cs.surface,
      selectedIconTheme: IconThemeData(color: cs.primary),
      unselectedIconTheme: IconThemeData(color: cs.onSurface.withOpacity(0.6)),
      selectedLabelTextStyle:
          textTheme.labelMedium?.copyWith(color: cs.primary),
      unselectedLabelTextStyle: textTheme.labelMedium?.copyWith(
        color: cs.onSurface.withOpacity(0.6),
      ),
    ),

    // Dialog Theme
    dialogTheme: DialogThemeData(
      elevation: GfTokens.elevation3,
      backgroundColor: cs.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(GfTokens.radius3xl),
      ),
      titleTextStyle: textTheme.headlineSmall?.copyWith(
        color: cs.onSurface,
      ),
      contentTextStyle: textTheme.bodyMedium?.copyWith(
        color: cs.onSurface.withOpacity(0.8),
      ),
    ),

    // Floating Action Button Theme
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      elevation: GfTokens.elevation3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(GfTokens.radius),
      ),
      backgroundColor: cs.primary,
      foregroundColor: cs.onPrimary,
    ),

    // List Tile Theme
    listTileTheme: ListTileThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(GfTokens.radius2),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: GfTokens.gap2,
        vertical: GfTokens.gap,
      ),
    ),
  );
}
