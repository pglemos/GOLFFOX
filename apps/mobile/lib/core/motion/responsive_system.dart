// ========================================
// GolfFox Responsive System v2.0
// Sistema completo de responsividade
// 100% adaptavel a todos os dispositivos
// ========================================

import 'package:flutter/material.dart';
import '../theme/gf_tokens.dart';

/// Tipos de dispositivos suportados
enum DeviceType {
  mobile,
  tablet,
  desktop,
  largeDesktop,
}

/// Orientacoes suportadas
enum DeviceOrientation {
  portrait,
  landscape,
}

/// Sistema de responsividade premium
class ResponsiveSystem {
  /// Breakpoints otimizados para todos os dispositivos
  static const double mobileMax = 640;
  static const double tabletMax = 1024;
  static const double desktopMax = 1440;

  /// Detecta o tipo de dispositivo baseado na largura
  static DeviceType getDeviceType(double width) {
    if (width <= mobileMax) return DeviceType.mobile;
    if (width <= tabletMax) return DeviceType.tablet;
    if (width <= desktopMax) return DeviceType.desktop;
    return DeviceType.largeDesktop;
  }

  /// Detecta a orientacao do dispositivo
  static DeviceOrientation getOrientation(BuildContext context) {
    final orientation = MediaQuery.of(context).orientation;
    return orientation == Orientation.portrait
        ? DeviceOrientation.portrait
        : DeviceOrientation.landscape;
  }

  /// Retorna padding responsivo baseado no dispositivo
  static EdgeInsets responsivePadding(BuildContext context) {
    final deviceType = getDeviceType(MediaQuery.of(context).size.width);

    switch (deviceType) {
      case DeviceType.mobile:
        return const EdgeInsets.all(GfTokens.gap2);
      case DeviceType.tablet:
        return const EdgeInsets.all(GfTokens.gap3);
      case DeviceType.desktop:
        return const EdgeInsets.all(GfTokens.gap4);
      case DeviceType.largeDesktop:
        return const EdgeInsets.all(GfTokens.gap6);
    }
  }

  /// Retorna tamanho de fonte responsivo
  static double responsiveFontSize(BuildContext context, double baseFontSize) {
    final deviceType = getDeviceType(MediaQuery.of(context).size.width);

    switch (deviceType) {
      case DeviceType.mobile:
        return baseFontSize * 0.9;
      case DeviceType.tablet:
        return baseFontSize;
      case DeviceType.desktop:
        return baseFontSize * 1.1;
      case DeviceType.largeDesktop:
        return baseFontSize * 1.2;
    }
  }

  /// Retorna numero de colunas para grid responsivo
  static int responsiveColumns(BuildContext context) {
    final deviceType = getDeviceType(MediaQuery.of(context).size.width);

    switch (deviceType) {
      case DeviceType.mobile:
        return 1;
      case DeviceType.tablet:
        return 2;
      case DeviceType.desktop:
        return 3;
      case DeviceType.largeDesktop:
        return 4;
    }
  }

  /// Retorna altura de card responsiva
  static double responsiveCardHeight(BuildContext context) {
    final deviceType = getDeviceType(MediaQuery.of(context).size.width);

    switch (deviceType) {
      case DeviceType.mobile:
        return 120;
      case DeviceType.tablet:
        return 140;
      case DeviceType.desktop:
        return 160;
      case DeviceType.largeDesktop:
        return 180;
    }
  }
}

/// Widget responsivo que adapta automaticamente
class ResponsiveWidget extends StatelessWidget {

  const ResponsiveWidget({
    required this.fallback,
    super.key,
    this.mobile,
    this.tablet,
    this.desktop,
    this.largeDesktop,
  });
  final Widget? mobile;
  final Widget? tablet;
  final Widget? desktop;
  final Widget? largeDesktop;
  final Widget fallback;

  @override
  Widget build(BuildContext context) {
    final deviceType = ResponsiveSystem.getDeviceType(
      MediaQuery.of(context).size.width,
    );

    switch (deviceType) {
      case DeviceType.mobile:
        return mobile ?? fallback;
      case DeviceType.tablet:
        return tablet ?? mobile ?? fallback;
      case DeviceType.desktop:
        return desktop ?? tablet ?? mobile ?? fallback;
      case DeviceType.largeDesktop:
        return largeDesktop ?? desktop ?? tablet ?? mobile ?? fallback;
    }
  }
}

/// Layout responsivo com grid adaptativo
class ResponsiveGrid extends StatelessWidget {

  const ResponsiveGrid({
    required this.children,
    super.key,
    this.spacing = GfTokens.gap2,
    this.runSpacing = GfTokens.gap2,
    this.forceColumns,
    this.childAspectRatio = 1,
  });
  final List<Widget> children;
  final double spacing;
  final double runSpacing;
  final int? forceColumns;
  final double? childAspectRatio;

  @override
  Widget build(BuildContext context) {
    final columns = forceColumns ?? ResponsiveSystem.responsiveColumns(context);

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: columns,
        crossAxisSpacing: spacing,
        mainAxisSpacing: runSpacing,
        childAspectRatio: childAspectRatio ?? 1,
      ),
      itemCount: children.length,
      itemBuilder: (context, index) => children[index],
    );
  }
}

/// Container responsivo com padding e margin adaptativos
class ResponsiveContainer extends StatelessWidget {

  const ResponsiveContainer({
    required this.child,
    super.key,
    this.padding,
    this.margin,
    this.width,
    this.height,
    this.decoration,
    this.centerOnDesktop = true,
  });
  final Widget child;
  final EdgeInsets? padding;
  final EdgeInsets? margin;
  final double? width;
  final double? height;
  final Decoration? decoration;
  final bool centerOnDesktop;

  @override
  Widget build(BuildContext context) {
    final deviceType = ResponsiveSystem.getDeviceType(
      MediaQuery.of(context).size.width,
    );

    final responsivePadding =
        padding ?? ResponsiveSystem.responsivePadding(context);

    Widget container = Container(
      width: width,
      height: height,
      padding: responsivePadding,
      margin: margin,
      decoration: decoration,
      child: child,
    );

    // Centraliza em desktop para melhor UX
    if (centerOnDesktop &&
        (deviceType == DeviceType.desktop ||
            deviceType == DeviceType.largeDesktop)) {
      container = Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 1200),
          child: container,
        ),
      );
    }

    return container;
  }
}

/// Texto responsivo que adapta tamanho automaticamente
class ResponsiveWrap extends StatelessWidget {

  const ResponsiveWrap({
    required this.children,
    super.key,
    this.spacing = GfTokens.gap2,
    this.runSpacing = GfTokens.gap2,
    this.alignment = WrapAlignment.start,
    this.crossAxisAlignment = WrapCrossAlignment.start,
    this.runAlignment = WrapAlignment.start,
    this.forceColumns,
    this.childAspectRatio,
  });
  final List<Widget> children;
  final double spacing;
  final double runSpacing;
  final WrapAlignment alignment;
  final WrapCrossAlignment crossAxisAlignment;
  final WrapAlignment runAlignment;
  final int? forceColumns;
  final double? childAspectRatio;

  @override
  Widget build(BuildContext context) {
    final columns = forceColumns ?? ResponsiveSystem.responsiveColumns(context);

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: columns,
        crossAxisSpacing: spacing,
        mainAxisSpacing: runSpacing,
        childAspectRatio: childAspectRatio ?? 1.0,
      ),
      itemCount: children.length,
      itemBuilder: (context, index) => children[index],
    );
  }
}

class ResponsiveText extends StatelessWidget {

  const ResponsiveText(
    this.text, {
    super.key,
    this.style,
    this.baseFontSize = GfTokens.textBase,
    this.fontWeight,
    this.color,
    this.textAlign,
    this.maxLines,
    this.overflow,
  });
  final String text;
  final TextStyle? style;
  final double baseFontSize;
  final FontWeight? fontWeight;
  final Color? color;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;

  @override
  Widget build(BuildContext context) {
    final responsiveFontSize = ResponsiveSystem.responsiveFontSize(
      context,
      baseFontSize,
    );

    return Text(
      text,
      style: TextStyle(
        fontSize: responsiveFontSize,
        fontWeight: fontWeight,
        color: color,
      ),
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: overflow,
    );
  }
}

/// Extensoes para facilitar uso do sistema responsivo
extension ResponsiveExtensions on BuildContext {
  /// Retorna o tipo de dispositivo atual
  DeviceType get deviceType => ResponsiveSystem.getDeviceType(
        MediaQuery.of(this).size.width,
      );

  /// Retorna a orientacao atual
  DeviceOrientation get deviceOrientation =>
      ResponsiveSystem.getOrientation(this);

  /// Verifica se e mobile
  bool get isMobile => deviceType == DeviceType.mobile;

  /// Verifica se e tablet
  bool get isTablet => deviceType == DeviceType.tablet;

  /// Verifica se e desktop
  bool get isDesktop =>
      deviceType == DeviceType.desktop || deviceType == DeviceType.largeDesktop;

  /// Verifica se esta em modo portrait
  bool get isPortrait => deviceOrientation == DeviceOrientation.portrait;

  /// Verifica se esta em modo landscape
  bool get isLandscape => deviceOrientation == DeviceOrientation.landscape;

  /// Retorna padding responsivo
  EdgeInsets get responsivePadding => ResponsiveSystem.responsivePadding(this);

  /// Retorna numero de colunas responsivo
  int get responsiveColumns => ResponsiveSystem.responsiveColumns(this);
}
