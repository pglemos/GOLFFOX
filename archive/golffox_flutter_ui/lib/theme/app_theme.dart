import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.light);

class AppTheme {
  AppTheme._();

  // === PALETA GOLFFOX (site) ===
  static const Color golfFoxWhite = Color(0xFFF9FAFB);
  static const Color golfFoxBg = Color(0xFFFFFFFF);
  static const Color golfFoxNavy = Color(0xFF111827);
  static const Color golfFoxDarkBlock = Color(0xFF0F172A);
  static const Color golfFoxPrimary = Color(0xFFE55600);   // CTA
  static const Color golfFoxPrimarySoft = Color(0xFFF98B3C);
  static const Color golfFoxHighlight = Color(0xFFFBB01A); // "Inteligente"
  static const Color golfFoxStroke = Color(0xFFE5E7EB);

  static const Color success = Color(0xFF22C55E);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger  = Color(0xFFEF4444);

  static ThemeBundle buildTheme(WidgetRef ref) {
    final baseText = Typography.englishLike2018.apply(fontFamily: 'Inter');

    final light = ThemeData(
      useMaterial3: true,
      colorScheme: const ColorScheme(
        brightness: Brightness.light,
        primary: golfFoxPrimary,
        onPrimary: Colors.white,
        secondary: golfFoxHighlight,
        onSecondary: golfFoxNavy,
        error: danger,
        onError: Colors.white,
                surface: golfFoxBg,
        onSurface: golfFoxNavy,
      ),
      scaffoldBackgroundColor: golfFoxWhite,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: golfFoxNavy,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: golfFoxStroke),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: golfFoxStroke),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: golfFoxStroke),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: golfFoxPrimary, width: 1.4),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: golfFoxWhite,
        selectedColor: golfFoxPrimary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(32)),
        labelStyle: const TextStyle(color: golfFoxNavy),
      ),
      textTheme: baseText.copyWith(
        headlineLarge: const TextStyle(
          fontSize: 34,
          fontWeight: FontWeight.w800,
          color: golfFoxNavy,
        ),
        headlineMedium: const TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: golfFoxNavy,
        ),
        titleLarge: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: golfFoxNavy,
        ),
        bodyMedium: const TextStyle(
          fontSize: 14,
          color: golfFoxNavy,
        ),
      ),
      navigationRailTheme: const NavigationRailThemeData(
        backgroundColor: golfFoxDarkBlock,
        selectedIconTheme: IconThemeData(color: Colors.white),
        unselectedIconTheme: IconThemeData(color: Colors.white70),
        selectedLabelTextStyle: TextStyle(color: Colors.white),
        unselectedLabelTextStyle: TextStyle(color: Colors.white54),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: golfFoxPrimary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        ),
      ),
    );

    final dark = ThemeData.dark(useMaterial3: true).copyWith(
      colorScheme: const ColorScheme.dark(
        primary: golfFoxPrimary,
        surface: golfFoxDarkBlock,
              ),
      scaffoldBackgroundColor: golfFoxDarkBlock,
    );

    return ThemeBundle(light: light, dark: dark);
  }
}

class ThemeBundle {
  final ThemeData light;
  final ThemeData dark;
  const ThemeBundle({required this.light, required this.dark});
}

enum StatusTone { success, warning, danger, info }

Color statusColor(StatusTone tone) {
  switch (tone) {
    case StatusTone.success:
      return AppTheme.success;
    case StatusTone.warning:
      return AppTheme.warning;
    case StatusTone.danger:
      return AppTheme.danger;
    case StatusTone.info:
      return AppTheme.golfFoxPrimary;
  }
}


