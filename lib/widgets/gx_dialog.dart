import 'package:flutter/material.dart';

/// Static methods for showing dialogs
class GxDialog {
  static Future<T?> show<T>({
    required BuildContext context,
    required String title,
    required String message,
    String confirmLabel = 'OK',
    String? cancelLabel,
  }) =>
      showGxDialog<T>(
        context: context,
        title: title,
        message: message,
        confirmLabel: confirmLabel,
        cancelLabel: cancelLabel,
      );

  static Future<bool?> confirm(
    BuildContext context, {
    required String title,
    required String message,
    String confirmText = 'Confirm',
    String cancelText = 'Cancel',
    bool isDestructive = false,
  }) =>
      showGxDialog<bool>(
        context: context,
        title: title,
        message: message,
        confirmLabel: confirmText,
        cancelLabel: cancelText,
      );
}

Future<T?> showGxDialog<T>({
  required BuildContext context,
  required String title,
  required String message,
  String confirmLabel = 'OK',
  String? cancelLabel,
}) {
  return showDialog<T>(
    context: context,
    builder: (ctx) {
      final t = Theme.of(ctx);
      return AlertDialog(
        title: Text(title,
            style:
                t.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
        content: Text(message),
        actions: [
          if (cancelLabel != null)
            TextButton(
                onPressed: () => Navigator.pop(ctx), child: Text(cancelLabel)),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true as T?),
              child: Text(confirmLabel)),
        ],
      );
    },
  );
}
