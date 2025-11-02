// ========================================
// GolfFox Design Tokens v11.0 - Clear Theme
// Baseado na paleta do site https://golffox.com.br
// ========================================
import 'package:flutter/material.dart';

class GfTokens {
  // ========================================
  // CORES DO SITE (tema claro)
  // ========================================
  static const page = 0xFFF5F6F8; // Fundo principal claro
  static const pageAlt = 0xFFF9FAFB; // Fundo alternativo
  static const surface = 0xFFFFFFFF; // Superficie branca
  static const surfaceMuted = 0xFFEFF1F4; // Superficie suave
  static const stroke = 0xFFE2E8F0; // Bordas claras
  static const strokeMuted = 0xFFF1F5F9; // Bordas mais suaves

  // ========================================
  // TIPOGRAFIA
  // ========================================
  static const textTitle = 0xFF0F172A; // Navy para titulos
  static const textBody = 0xFF1F2937; // Cinza escuro para corpo
  static const textMuted = 0xFF64748B; // Cinza medio para texto secundario
  static const textLight = 0xFF94A3B8; // Cinza claro para placeholders

  // ========================================
  // CORES DE MARCA
  // ========================================
  static const brand = 0xFFEA5E02; // Laranja CTA Golf Fox
  static const brandLight = 0xFFFED7AA; // Laranja claro
  static const accent = 0xFF0B1120; // Navy accent
  static const accentLight = 0xFF334155; // Navy mais claro

  // ========================================
  // CORES SEMANTICAS
  // ========================================
  static const success = 0xFF059669; // Verde sucesso
  static const successLight = 0xFFD1FAE5; // Verde claro
  static const warning = 0xFFF59E0B; // Amarelo aviso
  static const warningLight = 0xFFFEF3C7; // Amarelo claro
  static const danger = 0xFFEF4444; // Vermelho erro
  static const dangerLight = 0xFFFEE2E2; // Vermelho claro
  static const info = 0xFF3B82F6; // Azul informacao
  static const infoLight = 0xFFDBEAFE; // Azul claro

  // ========================================
  // DIMENSOES
  // ========================================
  static const radius = 18.0; // Border radius padrao
  static const radiusSmall = 12.0; // Border radius pequeno
  static const radiusLarge = 24.0; // Border radius grande

  // Aliases para compatibilidade
  static const radiusXs = 4.0;
  static const radiusSm = radiusSmall; // 12.0
  static const radiusMd = radius; // 18.0
  static const radiusLg = radiusLarge; // 24.0

  // ========================================
  // ESPACAMENTOS
  // ========================================
  static const space1 = 4.0;
  static const space2 = 8.0;
  static const space3 = 12.0;
  static const space4 = 16.0;
  static const space5 = 20.0;
  static const space6 = 24.0;
  static const space8 = 32.0;
  static const space10 = 40.0;
  static const space12 = 48.0;
  static const space16 = 64.0;

  // Aliases para compatibilidade
  static const spacingXs = space1; // 4.0
  static const spacingSm = space2; // 8.0
  static const spacingMd = space4; // 16.0
  static const spacingLg = space6; // 24.0
  static const spacingXl = space8; // 32.0

  // ========================================
  // ELEVACOES (sombras)
  // ========================================
  static const elevationLow = 2.0;
  static const elevationMedium = 4.0;
  static const elevationHigh = 8.0;

  // ========================================
  // TIPOGRAFIA - TAMANHOS
  // ========================================
  static const fontSizeXs = 12.0;
  static const fontSizeSm = 14.0;
  static const fontSizeMd = 16.0;
  static const fontSizeLg = 18.0;
  static const fontSizeXl = 20.0;

  // ========================================
  // CORES SEMANTICAS ADICIONAIS
  // ========================================
  static const colorPrimary = brand; // 0xFFEA5E02
  static const colorSecondary = accent; // 0xFF0B1120
  static const colorSuccess = success; // 0xFF059669
  static const colorWarning = warning; // 0xFFF59E0B
  static const colorError = danger; // 0xFFEF4444
  static const colorOnSurface = textTitle; // 0xFF0F172A
  static const colorOnSurfaceVariant = textMuted; // 0xFF64748B
  static const colorSurfaceBackground = surface; // 0xFFFFFFFF
  static const colorSurface = surface; // 0xFFFFFFFF
  static const colorBorder = stroke; // 0xFFE2E8F0
  static const colorOutlineVariant = stroke; // alias de stroke
  static const colorOnPrimary = surface; // texto sobre primaria (branco)
  static const colorInfo = info; // 0xFF3B82F6
  static const colorErrorContainer = dangerLight; // container de erro claro
  static const colorOnErrorContainer = danger; // texto sobre container de erro
  static const colorSurfaceVariant = surfaceMuted; // variacao de surface
  static const colorBackground = page; // fundo padrao da pagina
  static const colorOnSecondaryContainer =
      textBody; // texto sobre container secundario
  static const colorShadow = 0xFF000000; // sombra padrao (preto)

  // ========================================
  // DIMENSOES DO SHELL
  // ========================================
  static const topBarHeight = 60.0;
  static const sideNavWidth = 280.0;
  static const sideNavWidthCollapsed = 72.0;

  // ========================================
  // CORES ESPECIFICAS DO SHELL
  // ========================================
  static const shellTopBarBg = surface;
  static const shellSideNavBg = surface;
  static const shellSideNavItemActive = 0xFFF3F4F6;
  static const shellSideNavItemHover = 0xFFF8FAFC;
  static const shellBrandBar = brand;

  // ========================================
  // CORES DOS PILLS (TopBar)
  // ========================================
  static const pillActive = brand;
  static const pillActiveText = surface;
  static const pillInactive = surfaceMuted;
  static const pillInactiveText = textMuted;

  // ========================================
  // CORES DOS KPIs (Dashboard)
  // ========================================
  static const kpiInTransit = info;
  static const kpiActiveVehicles = success;
  static const kpiRoutesToday = warning;
  static const kpiCriticalAlerts = danger;

  // ========================================
  // DURACOES DE ANIMACAO (compatibilidade com GxTokens)
  // ========================================
  static const Duration durationFast = Duration(milliseconds: 150);
  static const Duration duration = Duration(milliseconds: 200);
  static const Duration durationSlow = Duration(milliseconds: 300);
  static const Duration durationSlower = Duration(milliseconds: 500);

  // ========================================
  // ALIASES PARA COMPATIBILIDADE COM GxTokens
  // ========================================
  static const primary = brand; // Alias para brand
  static const error = danger; // Alias para danger

  // Spacing aliases (GxTokens compatibility)
  static const double gap = space2; // 8.0
  static const double gap2 = space4; // 16.0
  static const double gap3 = space6; // 24.0
  static const double gap4 = space8; // 32.0
  static const double gap6 = space12; // 48.0
  static const double gap8 = space16; // 64.0

  // Radius aliases (GxTokens compatibility)
  static const double radius2 = radiusLg; // 24.0
  static const double radius3xl = 32.0;

  // Elevation aliases (GxTokens compatibility)
  static const double elevation1 = 1.0;
  static const double elevation2 = elevationLow; // 2.0
  static const double elevation3 = elevationMedium; // 4.0
  static const double elevation4 = elevationHigh; // 8.0

  // Typography aliases (GxTokens compatibility)
  static const double textXs = fontSizeXs; // 12.0
  static const double textSm = fontSizeSm; // 14.0
  static const double textBase = fontSizeMd; // 16.0
  static const double textLg = fontSizeLg; // 18.0
  static const double textXl = fontSizeXl; // 20.0
  static const double text2xl = 24.0;
  static const double text3xl = 30.0;
  static const double text4xl = 36.0;

  // Icon sizes (GxTokens compatibility)
  static const double iconXs = 12.0;
  static const double iconSm = 16.0;
  static const double icon = 20.0;
  static const double iconLg = 24.0;
  static const double iconXl = 32.0;
  static const double icon2xl = 48.0;

  // Breakpoints (GxTokens compatibility)
  static const double breakpointSm = 640.0;
  static const double breakpointMd = 768.0;
  static const double breakpointLg = 1024.0;
  static const double breakpointXl = 1280.0;
  static const double breakpoint2xl = 1536.0;

  // Color aliases for GxTokens compatibility
  static const int ok = success; // 0xFF059669
  static const int warn = warning; // 0xFFF59E0B
  static const int err = danger; // 0xFFEF4444
}

// ========================================
// TEXT STYLES BASICOS (AUXILIARES)
// Uteis para telas que usam tokens diretos
// ========================================
class GfTextStyles {
  static const TextStyle headlineSmall = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.w600,
    color: Color(GfTokens.textTitle),
  );

  static const TextStyle bodyMedium = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: Color(GfTokens.textBody),
  );

  static const TextStyle labelSmall = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: Color(GfTokens.textMuted),
  );

  static const TextStyle labelLarge = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: Color(GfTokens.textTitle),
  );
}

// ========================================
// EXTENSOES DE CORES PARA INT (AUXILIAR)
// Permite usar constantes inteiras como Color diretamente, ex.:
//   GfTokens.brand.withOpacity(0.1)
//   GfTokens.brand.withOpacity(0.2)
//   GfTokens.brand.asColor
// ========================================
extension GfIntColorX on int {
  Color get asColor => Color(this);

  // Mantem compatibilidade com usos existentes de withOpacity em ints
  Color withOpacity(double opacity) => Color(this).withOpacity(opacity);

  // Versao compativel do Color.withValues (mantem suporte em versoes antigas do Flutter)
  Color withValues({double? alpha, double? red, double? green, double? blue}) {
    double clampUnit(double value) {
      if (value < 0) return 0;
      if (value > 1) return 1;
      return value;
    }

    final color = Color(this);
    final double normalizedAlpha = clampUnit(alpha ?? color.opacity);
    final double normalizedRed = clampUnit(red ?? color.red / 255.0);
    final double normalizedGreen = clampUnit(green ?? color.green / 255.0);
    final double normalizedBlue = clampUnit(blue ?? color.blue / 255.0);

    return Color.fromRGBO(
      (normalizedRed * 255).round(),
      (normalizedGreen * 255).round(),
      (normalizedBlue * 255).round(),
      normalizedAlpha,
    );
  }
}
