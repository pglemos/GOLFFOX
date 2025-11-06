import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'core/theme/unified_theme.dart';

/// =====================
///  Semantic extensions
/// =====================
@immutable
class AppSemanticColors extends ThemeExtension<AppSemanticColors> {

  const AppSemanticColors({
    required this.success,
    required this.onSuccess,
    required this.warning,
    required this.onWarning,
    required this.info,
    required this.onInfo,
    required this.accent,
  });
  final Color success;
  final Color onSuccess;
  final Color warning;
  final Color onWarning;
  final Color info;
  final Color onInfo;
  final Color accent;

  @override
  AppSemanticColors copyWith({
    Color? success,
    Color? onSuccess,
    Color? warning,
    Color? onWarning,
    Color? info,
    Color? onInfo,
    Color? accent,
  }) => AppSemanticColors(
      success: success ?? this.success,
      onSuccess: onSuccess ?? this.onSuccess,
      warning: warning ?? this.warning,
      onWarning: onWarning ?? this.onWarning,
      info: info ?? this.info,
      onInfo: onInfo ?? this.onInfo,
      accent: accent ?? this.accent,
    );

  @override
  AppSemanticColors lerp(ThemeExtension<AppSemanticColors>? other, double t) {
    if (other is! AppSemanticColors) return this;
    Color lerpColor(Color a, Color b) => Color.lerp(a, b, t)!;
    return AppSemanticColors(
      success: lerpColor(success, other.success),
      onSuccess: lerpColor(onSuccess, other.onSuccess),
      warning: lerpColor(warning, other.warning),
      onWarning: lerpColor(onWarning, other.onWarning),
      info: lerpColor(info, other.info),
      onInfo: lerpColor(onInfo, other.onInfo),
      accent: lerpColor(accent, other.accent),
    );
  }
}

/// =====================
///  Light / Dark Seeds
/// =====================
class _Seeds {
  // Azul eletrico (brand) como seed principal
  static const lightSeed = Color(0xFF2563EB);
  static const darkSeed = Color(0xFF60A5FA);

  // Acentos adicionais que queremos preservar (Nubank vibe)
  static const lightAccent = Color(0xFF8B5CF6);
  static const darkAccent = Color(0xFFA855F7);

  // Semanticas
  static const lightSuccess = Color(0xFF16A34A);
  static const lightWarning = Color(0xFFF59E0B);
  static const lightInfo = Color(0xFF0EA5E9);

  static const darkSuccess = Color(0xFF22C55E);
  static const darkWarning = Color(0xFFFBBF24);
  static const darkInfo = Color(0xFF38BDF8);
}

/// =====================
///  Typography helpers
/// =====================
TextTheme _typography(ColorScheme cs) {
  // Base Inter
  final base = GoogleFonts.interTextTheme();
  // Harmoniza com o esquema de cores
  final applied = base.apply(
    bodyColor: cs.onSurface,
    displayColor: cs.onSurface,
  );

  // Ajuste fino de pesos e tamanhos principais (M3-friendly)
  return applied.copyWith(
    displayLarge: applied.displayLarge?.copyWith(fontWeight: FontWeight.w700),
    displayMedium: applied.displayMedium?.copyWith(fontWeight: FontWeight.w700),
    displaySmall: applied.displaySmall?.copyWith(fontWeight: FontWeight.w700),
    headlineLarge: applied.headlineLarge?.copyWith(fontWeight: FontWeight.w700),
    headlineMedium:
        applied.headlineMedium?.copyWith(fontWeight: FontWeight.w600),
    headlineSmall: applied.headlineSmall?.copyWith(fontWeight: FontWeight.w600),
    titleLarge: applied.titleLarge
        ?.copyWith(fontWeight: FontWeight.w700, letterSpacing: 0.1),
    titleMedium: applied.titleMedium?.copyWith(fontWeight: FontWeight.w600),
    titleSmall: applied.titleSmall?.copyWith(fontWeight: FontWeight.w600),
    labelLarge: applied.labelLarge?.copyWith(fontWeight: FontWeight.w700),
    labelMedium: applied.labelMedium?.copyWith(fontWeight: FontWeight.w600),
    labelSmall: applied.labelSmall?.copyWith(fontWeight: FontWeight.w600),
    bodyLarge: applied.bodyLarge?.copyWith(height: 1.25),
    bodyMedium: applied.bodyMedium?.copyWith(height: 1.25),
    bodySmall: applied.bodySmall?.copyWith(height: 1.25),
  );
}

/// =====================
///  Component themes
/// =====================
AppBarTheme _appBar(ColorScheme cs) => AppBarTheme(
      elevation: 0,
      backgroundColor: cs.surface.withOpacity(0.75),
      foregroundColor: cs.onSurface,
      centerTitle: false,
      titleTextStyle: GoogleFonts.inter(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: cs.onSurface,
      ),
      toolbarHeight: kToolbarHeight,
      surfaceTintColor: Colors.transparent,
    );

InputDecorationTheme _inputs(ColorScheme cs) => InputDecorationTheme(
      filled: true,
      fillColor: cs.surfaceContainerHighest.withOpacity(0.65),
      contentPadding: const EdgeInsets.symmetric(
          horizontal: GolfFoxTheme.space4, vertical: GolfFoxTheme.space4),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(GolfFoxTheme.radiusMedium),
        borderSide: BorderSide(color: cs.outlineVariant),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(GolfFoxTheme.radiusMedium),
        borderSide: BorderSide(color: cs.outlineVariant),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(GolfFoxTheme.radiusMedium),
        borderSide: BorderSide(color: cs.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(GolfFoxTheme.radiusMedium),
        borderSide: BorderSide(color: cs.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(GolfFoxTheme.radiusMedium),
        borderSide: BorderSide(color: cs.error, width: 2),
      ),
      hintStyle: const TextStyle(color: GolfFoxTheme.textSecondary),
      labelStyle: TextStyle(color: cs.onSurface.withOpacity(0.8)),
      prefixIconColor: cs.primary,
      suffixIconColor: cs.onSurfaceVariant,
    );

CardThemeData _cards(ColorScheme cs) => CardThemeData(
      color: cs.surfaceContainerHighest,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      margin: EdgeInsets.zero,
      surfaceTintColor: Colors.transparent,
    );

ButtonStyle _primaryButton(ColorScheme cs) => FilledButton.styleFrom(
      backgroundColor: cs.primary,
      foregroundColor: cs.onPrimary,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      textStyle: GoogleFonts.inter(fontWeight: FontWeight.w700),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 0,
    );

ButtonStyle _outlinedButton(ColorScheme cs) => OutlinedButton.styleFrom(
      side: BorderSide(color: cs.outlineVariant),
      foregroundColor: cs.onSurface,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      textStyle: GoogleFonts.inter(fontWeight: FontWeight.w700),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    );

ChipThemeData _chips(ColorScheme cs) => ChipThemeData(
      backgroundColor: cs.surfaceContainerHighest,
      selectedColor: cs.primary.withOpacity(0.12),
      labelStyle: GoogleFonts.inter(color: cs.onSurface),
      secondaryLabelStyle: GoogleFonts.inter(color: cs.onSurface),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      side: BorderSide(color: cs.outlineVariant),
    );

SnackBarThemeData _snack(ColorScheme cs) => SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      backgroundColor: cs.inverseSurface,
      contentTextStyle: GoogleFonts.inter(color: cs.onInverseSurface),
      actionTextColor: cs.inversePrimary,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    );

NavigationBarThemeData _navBar(ColorScheme cs) => NavigationBarThemeData(
      height: 64,
      backgroundColor: cs.surface,
      indicatorColor: cs.primary.withOpacity(0.15),
      labelTextStyle: WidgetStateProperty.all(
        GoogleFonts.inter(fontWeight: FontWeight.w600),
      ),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return IconThemeData(
            color: selected ? cs.primary : cs.onSurfaceVariant);
      }),
    );

NavigationRailThemeData _navRail(ColorScheme cs) => NavigationRailThemeData(
      backgroundColor: cs.surface,
      indicatorColor: cs.primary.withOpacity(0.15),
      selectedIconTheme: IconThemeData(color: cs.primary),
      selectedLabelTextStyle: GoogleFonts.inter(
        fontWeight: FontWeight.w700,
        color: cs.primary,
      ),
    );

DividerThemeData _divider(ColorScheme cs) => DividerThemeData(
      space: 1,
      thickness: 1,
      color: cs.outlineVariant,
    );

ListTileThemeData _listTile(ColorScheme cs) => ListTileThemeData(
      iconColor: cs.onSurfaceVariant,
      textColor: cs.onSurface,
      dense: false,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    );

PageTransitionsTheme _transitions = const PageTransitionsTheme(
  builders: {
    TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
    TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
    TargetPlatform.macOS: CupertinoPageTransitionsBuilder(),
    TargetPlatform.windows: FadeUpwardsPageTransitionsBuilder(),
    TargetPlatform.linux: FadeUpwardsPageTransitionsBuilder(),
  },
);

/// =====================
///  Theme builders
/// =====================
ThemeData buildLightTheme() {
  final cs = ColorScheme.fromSeed(
    seedColor: _Seeds.lightSeed,
    primary: _Seeds.lightSeed,
    secondary: const Color(0xFF16A34A),
    tertiary: const Color(0xFFF59E0B),
    surface: const Color(0xFFFAFAFA),
    error: const Color(0xFFDC2626),
  );

  final text = _typography(cs);
  const semantic = AppSemanticColors(
    success: _Seeds.lightSuccess,
    onSuccess: Colors.white,
    warning: _Seeds.lightWarning,
    onWarning: const Color(0xFF1A1611),
    info: _Seeds.lightInfo,
    onInfo: Colors.white,
    accent: _Seeds.lightAccent,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: cs,
    textTheme: text,
    scaffoldBackgroundColor: cs.surface,
    visualDensity: VisualDensity.adaptivePlatformDensity,
    materialTapTargetSize: MaterialTapTargetSize.padded,
    pageTransitionsTheme: _transitions,
    appBarTheme: _appBar(cs),
    inputDecorationTheme: _inputs(cs),
    cardTheme: _cards(cs),
    chipTheme: _chips(cs),
    snackBarTheme: _snack(cs),
    navigationBarTheme: _navBar(cs),
    navigationRailTheme: _navRail(cs),
    dividerTheme: _divider(cs),
    listTileTheme: _listTile(cs),
    filledButtonTheme: FilledButtonThemeData(style: _primaryButton(cs)),
    elevatedButtonTheme: ElevatedButtonThemeData(style: _primaryButton(cs)),
    outlinedButtonTheme: OutlinedButtonThemeData(style: _outlinedButton(cs)),
    extensions: [semantic],
  );
}

ThemeData buildDarkTheme() {
  final cs = ColorScheme.fromSeed(
    seedColor: _Seeds.darkSeed,
    brightness: Brightness.dark,
    primary: _Seeds.darkSeed,
    secondary: const Color(0xFF22C55E),
    tertiary: const Color(0xFFFBBF24),
    surface: const Color(0xFF0F172A),
    error: const Color(0xFFF87171),
  );

  final text = _typography(cs);
  const semantic = AppSemanticColors(
    success: _Seeds.darkSuccess,
    onSuccess: const Color(0xFF0F1A14),
    warning: _Seeds.darkWarning,
    onWarning: const Color(0xFF1A1611),
    info: _Seeds.darkInfo,
    onInfo: const Color(0xFF07131A),
    accent: _Seeds.darkAccent,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: cs,
    textTheme: text,
    scaffoldBackgroundColor: cs.surface,
    visualDensity: VisualDensity.adaptivePlatformDensity,
    materialTapTargetSize: MaterialTapTargetSize.padded,
    pageTransitionsTheme: _transitions,
    appBarTheme: _appBar(cs),
    inputDecorationTheme: _inputs(cs),
    cardTheme: _cards(cs),
    chipTheme: _chips(cs),
    snackBarTheme: _snack(cs),
    navigationBarTheme: _navBar(cs),
    navigationRailTheme: _navRail(cs),
    dividerTheme: _divider(cs),
    listTileTheme: _listTile(cs),
    filledButtonTheme: FilledButtonThemeData(style: _primaryButton(cs)),
    elevatedButtonTheme: ElevatedButtonThemeData(style: _primaryButton(cs)),
    outlinedButtonTheme: OutlinedButtonThemeData(style: _outlinedButton(cs)),
    extensions: [semantic],
  );
}

// Convenient top-level themes to match current usage in main.dart
final ThemeData lightTheme = buildLightTheme();
final ThemeData darkTheme = buildDarkTheme();
