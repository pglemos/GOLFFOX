// ========================================
// GolfFox Unified Design System v12.0
// Design profissional e responsivo
// ========================================

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class GolfFoxTheme {
  // ========================================
  // CORES PRINCIPAIS
  // ========================================
  static const Color primaryOrange = Color(0xFFEA5E02);
  static const Color primaryNavy = Color(0xFF0B1120);
  static const Color primaryBlue = Color(0xFF2563FF);

  // ========================================
  // CORES DE FUNDO
  // ========================================
  static const Color backgroundLight = Color(0xFFF7F9FC);
  static const Color backgroundDark = Color(0xFF0B1220);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF1E293B);

  // ========================================
  // CORES DE TEXTO
  // ========================================
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textMuted = Color(0xFF94A3B8);
  static const Color textOnDark = Color(0xFFE2E8F0);

  // ========================================
  // CORES SEMANTICAS
  // ========================================
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // ========================================
  // DIMENSOES RESPONSIVAS
  // ========================================
  static const double mobileBreakpoint = 768;
  static const double tabletBreakpoint = 1024;
  static const double desktopBreakpoint = 1280;

  // ========================================
  // ESPACAMENTOS
  // ========================================
  static const double space1 = 4;
  static const double space2 = 8;
  static const double space3 = 12;
  static const double space4 = 16;
  static const double space5 = 20;
  static const double space6 = 24;
  static const double space8 = 32;
  static const double space10 = 40;
  static const double space12 = 48;
  static const double space16 = 64;

  // ========================================
  // BORDER RADIUS
  // ========================================
  static const double radiusSmall = 8;
  static const double radiusMedium = 12;
  static const double radiusLarge = 16;
  static const double radiusXLarge = 24;

  // ========================================
  // ELEVACOES
  // ========================================
  static const double elevationLow = 2;
  static const double elevationMedium = 4;
  static const double elevationHigh = 8;
  static const double elevationXHigh = 16;

  // ========================================
  // TEMA CLARO
  // ========================================
  static ThemeData get lightTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primaryOrange,
      primary: primaryOrange,
      secondary: primaryBlue,
      surface: surfaceLight,
      error: error,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: _buildTextTheme(colorScheme),
      elevatedButtonTheme: _buildElevatedButtonTheme(colorScheme),
      inputDecorationTheme: _buildInputDecorationTheme(colorScheme),
      cardTheme: _buildCardTheme(colorScheme),
      appBarTheme: _buildAppBarTheme(colorScheme),
      scaffoldBackgroundColor: backgroundLight,
      fontFamily: GoogleFonts.inter().fontFamily,
    );
  }

  // ========================================
  // TEMA ESCURO
  // ========================================
  static ThemeData get darkTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primaryOrange,
      brightness: Brightness.dark,
      primary: primaryOrange,
      secondary: primaryBlue,
      surface: surfaceDark,
      error: error,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: _buildTextTheme(colorScheme),
      elevatedButtonTheme: _buildElevatedButtonTheme(colorScheme),
      inputDecorationTheme: _buildInputDecorationTheme(colorScheme),
      cardTheme: _buildCardTheme(colorScheme),
      appBarTheme: _buildAppBarTheme(colorScheme),
      scaffoldBackgroundColor: backgroundDark,
      fontFamily: GoogleFonts.inter().fontFamily,
    );
  }

  // ========================================
  // COMPONENTES DE TEMA
  // ========================================
  static TextTheme _buildTextTheme(ColorScheme colorScheme) => GoogleFonts.interTextTheme().copyWith(
      displayLarge: GoogleFonts.inter(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        color: colorScheme.onSurface,
      ),
      displayMedium: GoogleFonts.inter(
        fontSize: 28,
        fontWeight: FontWeight.w600,
        color: colorScheme.onSurface,
      ),
      headlineLarge: GoogleFonts.inter(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        color: colorScheme.onSurface,
      ),
      headlineMedium: GoogleFonts.inter(
        fontSize: 20,
        fontWeight: FontWeight.w500,
        color: colorScheme.onSurface,
      ),
      titleLarge: GoogleFonts.inter(
        fontSize: 18,
        fontWeight: FontWeight.w500,
        color: colorScheme.onSurface,
      ),
      bodyLarge: GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: colorScheme.onSurface,
      ),
      bodyMedium: GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: colorScheme.onSurface,
      ),
      bodySmall: GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: textSecondary,
      ),
    );

  static ElevatedButtonThemeData _buildElevatedButtonTheme(
      ColorScheme colorScheme) => ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
        elevation: elevationLow,
        padding: const EdgeInsets.symmetric(
          horizontal: space6,
          vertical: space4,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMedium),
        ),
        textStyle: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
      ),
    );

  static InputDecorationTheme _buildInputDecorationTheme(
      ColorScheme colorScheme) => InputDecorationTheme(
      filled: true,
      fillColor: colorScheme.surface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMedium),
        borderSide: BorderSide(color: colorScheme.outline),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMedium),
        borderSide: BorderSide(color: colorScheme.outline),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMedium),
        borderSide: BorderSide(color: colorScheme.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMedium),
        borderSide: BorderSide(color: colorScheme.error),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: space4,
        vertical: space4,
      ),
      labelStyle: GoogleFonts.inter(
        fontSize: 14,
        color: textSecondary,
      ),
    );

  static CardThemeData _buildCardTheme(ColorScheme colorScheme) => CardThemeData(
      elevation: elevationLow,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(radiusLarge),
      ),
      color: colorScheme.surface,
    );

  static AppBarTheme _buildAppBarTheme(ColorScheme colorScheme) => AppBarTheme(
      backgroundColor: colorScheme.surface,
      foregroundColor: colorScheme.onSurface,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.inter(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: colorScheme.onSurface,
      ),
    );

  // ========================================
  // UTILITARIOS RESPONSIVOS
  // ========================================
  static bool isMobile(BuildContext context) => MediaQuery.of(context).size.width < mobileBreakpoint;

  static bool isTablet(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    return width >= mobileBreakpoint && width < desktopBreakpoint;
  }

  static bool isDesktop(BuildContext context) => MediaQuery.of(context).size.width >= desktopBreakpoint;

  static double getResponsivePadding(BuildContext context) {
    if (isMobile(context)) return space4;
    if (isTablet(context)) return space6;
    return space8;
  }

  static double getResponsiveCardWidth(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (isMobile(context)) return width * 0.9;
    if (isTablet(context)) return 500;
    return 420;
  }
}
