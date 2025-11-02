import 'package:flutter/material.dart';

enum GxToastType { info, success, warn, error }

/// Static methods for showing toasts with different types
class GxToast {
  static void success(BuildContext context, String message) =>
      showGxToast(context, message, type: GxToastType.success);

  static void error(BuildContext context, String message) =>
      showGxToast(context, message, type: GxToastType.error);

  static void warn(BuildContext context, String message) =>
      showGxToast(context, message, type: GxToastType.warn);

  static void info(BuildContext context, String message) =>
      showGxToast(context, message, type: GxToastType.info);
}

void showGxToast(BuildContext context, String message,
    {GxToastType type = GxToastType.info}) {
  final cs = Theme.of(context).colorScheme;
  final Color bg = switch (type) {
    GxToastType.success => cs.primaryContainer,
    GxToastType.warn => cs.tertiaryContainer,
    GxToastType.error => cs.errorContainer,
    _ => cs.inverseSurface,
  };
  final Color fg = switch (type) {
    GxToastType.success => cs.onPrimaryContainer,
    GxToastType.warn => cs.onTertiaryContainer,
    GxToastType.error => cs.onErrorContainer,
    _ => cs.onInverseSurface,
  };
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      behavior: SnackBarBehavior.floating,
      backgroundColor: bg,
      content: Text(message, style: TextStyle(color: fg)),
    ),
  );
}
