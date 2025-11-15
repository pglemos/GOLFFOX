// ========================================
// GolfFox Theme v11.0 - Clear Theme
// Tema claro inspirado em Apple/Tesla/SpaceX
// ========================================

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'gf_tokens.dart';

class GfTheme {
  // ========================================
  // TEMA CLARO (padrao)
  // ========================================
  static ThemeData light() {
    const page = Color(GfTokens.page);
    const surface = Color(GfTokens.surface);
    const stroke = Color(GfTokens.stroke);
    const brand = Color(GfTokens.brand);
    const textTitle = Color(GfTokens.textTitle);
    const textBody = Color(GfTokens.textBody);

    final textTheme = GoogleFonts.interTextTheme().apply(
      bodyColor: textBody,
      displayColor: textTitle,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,

      // ========================================
      // CORES PRINCIPAIS
      // ========================================
      scaffoldBackgroundColor: page,
      colorScheme: ColorScheme.fromSeed(
        seedColor: brand,
        surface: surface,
        onSurface: textBody,
        primary: brand,
        onPrimary: surface,
      ),

      // ========================================
      // TIPOGRAFIA
      // ========================================
      textTheme: textTheme.copyWith(
        // Titulos
        headlineLarge: textTheme.headlineLarge?.copyWith(
          color: textTitle,
          fontWeight: FontWeight.w700,
          fontSize: 32,
        ),
        headlineMedium: textTheme.headlineMedium?.copyWith(
          color: textTitle,
          fontWeight: FontWeight.w600,
          fontSize: 24,
        ),
        headlineSmall: textTheme.headlineSmall?.copyWith(
          color: textTitle,
          fontWeight: FontWeight.w600,
          fontSize: 20,
        ),

        // Corpo
        bodyLarge: textTheme.bodyLarge?.copyWith(
          color: textBody,
          fontSize: 16,
          fontWeight: FontWeight.w400,
        ),
        bodyMedium: textTheme.bodyMedium?.copyWith(
          color: textBody,
          fontSize: 14,
          fontWeight: FontWeight.w400,
        ),
        bodySmall: textTheme.bodySmall?.copyWith(
          color: const Color(GfTokens.textMuted),
          fontSize: 12,
          fontWeight: FontWeight.w400,
        ),

        // Labels
        labelLarge: textTheme.labelLarge?.copyWith(
          color: textBody,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        labelMedium: textTheme.labelMedium?.copyWith(
          color: textBody,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),

      // ========================================
      // APP BAR
      // ========================================
      appBarTheme: AppBarTheme(
        backgroundColor: surface,
        foregroundColor: textTitle,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        titleTextStyle: textTheme.headlineSmall?.copyWith(
          color: textTitle,
          fontWeight: FontWeight.w600,
        ),
        iconTheme: const IconThemeData(color: textTitle),
      ),

      // ========================================
      // CARDS
      // ========================================
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(GfTokens.radius),
          side: const BorderSide(color: stroke),
        ),
        margin: EdgeInsets.zero,
      ),

      // ========================================
      // BOTOES
      // ========================================
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: brand,
          foregroundColor: surface,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(GfTokens.radius),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: GfTokens.space6,
            vertical: GfTokens.space4,
          ),
          textStyle: textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: textBody,
          side: const BorderSide(color: stroke),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(GfTokens.radius),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: GfTokens.space6,
            vertical: GfTokens.space4,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: brand,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(GfTokens.radius),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: GfTokens.space4,
            vertical: GfTokens.space2,
          ),
        ),
      ),

      // ========================================
      // INPUTS
      // ========================================
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(GfTokens.radius),
          borderSide: const BorderSide(color: stroke),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(GfTokens.radius),
          borderSide: const BorderSide(color: stroke),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(GfTokens.radius),
          borderSide: const BorderSide(color: brand, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(GfTokens.radius),
          borderSide: const BorderSide(color: Color(GfTokens.danger)),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: GfTokens.space4,
          vertical: GfTokens.space4,
        ),
        hintStyle: textTheme.bodyMedium?.copyWith(
          color: const Color(GfTokens.textMuted),
        ),
      ),

      // ========================================
      // CHIPS
      // ========================================
      chipTheme: ChipThemeData(
        backgroundColor: const Color(GfTokens.surfaceMuted),
        selectedColor: brand,
        labelStyle: textTheme.labelMedium,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: GfTokens.space3,
          vertical: GfTokens.space1,
        ),
      ),

      // ========================================
      // DIVIDERS
      // ========================================
      dividerTheme: const DividerThemeData(
        color: stroke,
        thickness: 1,
        space: 1,
      ),

      // ========================================
      // ICON THEME
      // ========================================
      iconTheme: const IconThemeData(
        color: textBody,
        size: 24,
      ),

      // ========================================
      // LIST TILES
      // ========================================
      listTileTheme: ListTileThemeData(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: GfTokens.space4,
          vertical: GfTokens.space2,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
        ),
        titleTextStyle: textTheme.bodyLarge,
        subtitleTextStyle: textTheme.bodyMedium?.copyWith(
          color: const Color(GfTokens.textMuted),
        ),
      ),
    );
  }

  // ========================================
  // TEMA ESCURO (fallback)
  // ========================================
  static ThemeData dark() => ThemeData.dark().copyWith(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(GfTokens.brand),
          brightness: Brightness.dark,
        ),
      );

  // ========================================
  // CORES UTILITARIAS
  // ========================================
  static const Color success = Color(GfTokens.success);
  static const Color warning = Color(GfTokens.warning);
  static const Color danger = Color(GfTokens.danger);
  static const Color info = Color(GfTokens.info);
  static const Color brand = Color(GfTokens.brand);
  static const Color accent = Color(GfTokens.accent);
}
