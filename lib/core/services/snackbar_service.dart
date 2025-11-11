import 'package:flutter/material.dart';

import '../error/app_error.dart';
import '../error/error_utils.dart';
import '../i18n/i18n.dart';

/// Serviço padronizado para exibir SnackBars com i18n e metadados
class SnackBarService {
  const SnackBarService._();

  static void success(BuildContext context, String messageKey, {Map<String, String>? params, SnackBarAction? action}) {
    _show(context,
        text: I18n.t(context, messageKey, params: params),
        type: _SnackType.success,
        action: action);
  }

  static void info(BuildContext context, String messageKey, {Map<String, String>? params, SnackBarAction? action}) {
    _show(context,
        text: I18n.t(context, messageKey, params: params),
        type: _SnackType.info,
        action: action);
  }

  static void warn(BuildContext context, String messageKey, {Map<String, String>? params, SnackBarAction? action}) {
    _show(context,
        text: I18n.t(context, messageKey, params: params),
        type: _SnackType.warn,
        action: action);
  }

  static void error(BuildContext context, Object error, {String? fallbackKey, Map<String, String>? params, SnackBarAction? action}) {
    String text;
    if (error is AppError) {
      text = error.userMessage;
    } else if (fallbackKey != null) {
      text = I18n.t(context, fallbackKey, params: params);
    } else {
      text = ErrorUtils.formatError(error);
    }
    _show(context, text: text, type: _SnackType.error, action: action);
  }

  static void _show(BuildContext context, {required String text, required _SnackType type, SnackBarAction? action}) {
    if (!context.mounted) return;
    final cs = Theme.of(context).colorScheme;
    final bg = switch (type) {
      _SnackType.success => cs.primaryContainer,
      _SnackType.warn => cs.tertiaryContainer,
      _SnackType.error => cs.errorContainer,
      _SnackType.info => cs.inverseSurface,
    };
    final fg = switch (type) {
      _SnackType.success => cs.onPrimaryContainer,
      _SnackType.warn => cs.onTertiaryContainer,
      _SnackType.error => cs.onErrorContainer,
      _SnackType.info => cs.onInverseSurface,
    };
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: bg,
          content: Text(text, style: TextStyle(color: fg)),
          action: action,
        ),
      );
  }

  // Exibe texto bruto mantendo padronização visual
  static void successText(BuildContext context, String text, {SnackBarAction? action}) {
    _show(context, text: text, type: _SnackType.success, action: action);
  }
  static void infoText(BuildContext context, String text, {SnackBarAction? action}) {
    _show(context, text: text, type: _SnackType.info, action: action);
  }
  static void warnText(BuildContext context, String text, {SnackBarAction? action}) {
    _show(context, text: text, type: _SnackType.warn, action: action);
  }
  static void errorText(BuildContext context, String text, {SnackBarAction? action}) {
    _show(context, text: text, type: _SnackType.error, action: action);
  }
}

enum _SnackType { info, success, warn, error }
