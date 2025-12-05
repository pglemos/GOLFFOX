import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';

import '../theme/gf_tokens.dart';

/// GolfFox Accessibility System
/// Ensures WCAG AA compliance and inclusive design
class GxA11y {
  /// Minimum touch target size (44x44 logical pixels)
  static const double minTouchTarget = 44;

  /// Minimum contrast ratios
  static const double contrastNormal = 4.5; // AA for normal text
  static const double contrastLarge = 3; // AA for large text
  static const double contrastAAA = 7; // AAA for normal text

  /// Focus management
  static void requestFocus(BuildContext context, FocusNode focusNode) {
    FocusScope.of(context).requestFocus(focusNode);
  }

  /// Announce to screen readers
  static void announce(BuildContext context, String message) {
    SemanticsService.sendAnnouncement(
        View.of(context), message, TextDirection.ltr);
  }

  /// Create semantic label for complex widgets
  static String createLabel({
    required String primary,
    String? secondary,
    String? state,
    String? hint,
  }) {
    final parts = <String>[primary];
    if (secondary != null) parts.add(secondary);
    if (state != null) parts.add(state);
    if (hint != null) parts.add(hint);
    return parts.join(', ');
  }

  /// Check if text size is considered large (18pt+ or 14pt+ bold)
  static bool isLargeText(TextStyle? style) {
    if (style == null) return false;
    final fontSize = style.fontSize ?? 14.0;
    final fontWeight = style.fontWeight ?? FontWeight.normal;

    return fontSize >= 18.0 ||
        (fontSize >= 14.0 && fontWeight.index >= FontWeight.bold.index);
  }

  /// Ensure minimum touch target size
  static Widget ensureTouchTarget({
    required Widget child,
    double minSize = minTouchTarget,
  }) =>
      ConstrainedBox(
        constraints: BoxConstraints(
          minWidth: minSize,
          minHeight: minSize,
        ),
        child: child,
      );

  /// Create accessible button with proper semantics
  static Widget buttonSemantic({
    required String label,
    required Widget child,
    VoidCallback? onPressed,
    String? tooltip,
    bool excludeSemantics = false,
  }) {
    var button = child;

    if (tooltip != null) {
      button = Tooltip(
        message: tooltip,
        child: button,
      );
    }

    if (!excludeSemantics) {
      button = Semantics(
        label: label,
        button: true,
        enabled: onPressed != null,
        child: ExcludeSemantics(child: button),
      );
    }

    return ensureTouchTarget(child: button);
  }

  /// Create accessible form field with proper labels
  static Widget accessibleFormField({
    required Widget child,
    String? label,
    String? hint,
    String? error,
    bool required = false,
  }) {
    String? semanticLabel;
    if (label != null) {
      semanticLabel = label;
      if (required) semanticLabel += ', obrigatorio';
      if (hint != null) semanticLabel += ', $hint';
      if (error != null) semanticLabel += ', erro: $error';
    }

    return Semantics(
      label: semanticLabel,
      textField: true,
      child: child,
    );
  }

  /// Create accessible list item
  static Widget accessibleListItem({
    required Widget child,
    String? semanticLabel,
    VoidCallback? onTap,
    int? index,
    int? totalItems,
  }) {
    var label = semanticLabel;
    if (index != null && totalItems != null) {
      label = '$semanticLabel, item ${index + 1} de $totalItems';
    }

    return Semantics(
      label: label,
      button: onTap != null,
      child: child,
    );
  }

  /// Create accessible status indicator
  static Widget accessibleStatus({
    required Widget child,
    required String status,
    String? description,
  }) {
    final label = description != null ? '$status, $description' : status;

    return Semantics(
      label: label,
      liveRegion: true,
      child: child,
    );
  }

  /// Screen reader announcements for state changes
  static void announceStateChange(BuildContext context, String message) {
    // Delay to ensure the UI has updated
    Future.delayed(GfTokens.durationFast, () {
      if (context.mounted) {
        announce(context, message);
      }
    });
  }

  /// Check if reduce motion is enabled
  static bool shouldReduceMotion(BuildContext context) =>
      MediaQuery.of(context).disableAnimations;

  /// Get appropriate animation duration based on accessibility settings
  static Duration getAnimationDuration(
    BuildContext context,
    Duration defaultDuration,
  ) =>
      shouldReduceMotion(context) ? Duration.zero : defaultDuration;
}

/// Accessibility-focused widget extensions
extension GxA11yWidget on Widget {
  /// Add semantic label to any widget
  Widget withSemantics({
    String? label,
    String? hint,
    String? value,
    bool? button,
    bool? textField,
    bool? selected,
    bool? enabled,
    VoidCallback? onTap,
  }) =>
      Semantics(
        label: label,
        hint: hint,
        value: value,
        button: button,
        textField: textField,
        selected: selected,
        enabled: enabled,
        onTap: onTap,
        child: this,
      );

  /// Exclude from semantics tree
  Widget excludeSemantics() => ExcludeSemantics(child: this);

  /// Ensure minimum touch target
  Widget withTouchTarget({double minSize = GxA11y.minTouchTarget}) =>
      GxA11y.ensureTouchTarget(child: this, minSize: minSize);
}
