import 'package:flutter/material.dart';
import '../core/services/snackbar_service.dart';

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
      showGxToast(context, message);
}

void showGxToast(BuildContext context, String message,
    {GxToastType type = GxToastType.info}) {
  switch (type) {
    case GxToastType.success:
      SnackBarService.successText(context, message);
      break;
    case GxToastType.warn:
      SnackBarService.warnText(context, message);
      break;
    case GxToastType.error:
      SnackBarService.errorText(context, message);
      break;
    case GxToastType.info:
      SnackBarService.infoText(context, message);
      break;
  }
}
