import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../logging/app_logger.dart';
import '../services/snackbar_service.dart';
import 'app_error.dart';

/// Handler global de erros da aplicação
class ErrorHandler {
  static bool _initialized = false;

  /// Inicializa o handler global de erros
  static void initialize() {
    if (_initialized) {
      return;
    }

    // Capturar erros do Flutter
    FlutterError.onError = _handleFlutterError;

    // Capturar erros assíncronos não tratados
    PlatformDispatcher.instance.onError = (error, stack) {
      _handlePlatformError(error, stack);
      return true;
    };

    _initialized = true;

    if (kDebugMode) {
      debugPrint('ErrorHandler initialized');
    }
  }

  /// Trata erros do Flutter
  static void _handleFlutterError(FlutterErrorDetails details) {
    final error = details.exception;
    final stack = details.stack;

    if (kDebugMode) {
      // Em modo debug, mostra o erro completo
      FlutterError.presentError(details);
    } else {
      // Em produção, registra o erro
      _logError(error, stack, 'Flutter Error');
    }

    // Reportar erro se necessário
    _reportError(error, stack);
  }

  /// Trata erros de plataforma
  static bool _handlePlatformError(Object error, StackTrace stack) {
    if (kDebugMode) {
      debugPrint('Platform Error: $error');
      debugPrint('Stack: $stack');
    } else {
      _logError(error, stack, 'Platform Error');
    }

    // Reportar erro se necessário
    _reportError(error, stack);

    return true;
  }

  /// Reporta erro para serviços de analytics/crash reporting
  static void _reportError(Object error, StackTrace? stack) {
    // Aqui você pode integrar com serviços como:
    // - Firebase Crashlytics
    // - Sentry
    // - Bugsnag
    // etc.

    final appError = ErrorFactory.fromException(error, stack);
    
    if (appError.shouldReport) {
      // Exemplo de integração com serviço de crash reporting
      // FirebaseCrashlytics.instance.recordError(error, stack);
      
      if (kDebugMode) {
        debugPrint(
          'Error reported: ${appError.type} - ${appError.message}',
        );
      }
    }
  }

  /// Trata erro de forma manual
  static void handleError(Object error, [StackTrace? stack]) {
    final appError = ErrorFactory.fromException(error, stack);
    
    _logError(error, stack, 'Manual Error');
    
    if (appError.shouldReport) {
      _reportError(error, stack);
    }
  }

  /// Registra erro centralmente (compatibilidade com chamadas existentes)
  static void _logError(Object error, StackTrace? stack, String context) {
    AppLogger.error(
      context,
      tag: 'ErrorHandler',
      error: error,
      stackTrace: stack,
    );
  }

  /// Mostra erro para o usuário
  static void showErrorToUser(BuildContext context, AppError error) {
    // Usar SnackBar para erros simples
    if (error.type == AppErrorType.validation || 
        error.type == AppErrorType.network) {
      _showSnackBar(context, error);
      return;
    }

    // Usar Dialog para erros mais sérios
    _showErrorDialog(context, error);
  }

  /// Mostra SnackBar com erro
  static void _showSnackBar(BuildContext context, AppError error) {
    if (!context.mounted) return;
    // Delegar ao SnackBarService para mensagens e estilo padronizados
    SnackBarService.error(context, error);
  }

  /// Mostra dialog com erro
  static void _showErrorDialog(BuildContext context, AppError error) {
    if (!context.mounted) {
      return;
    }

    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              _getErrorIcon(error.type),
              color: _getErrorColor(error.type),
            ),
            const SizedBox(width: 8),
            const Text('Erro'),
          ],
        ),
        content: Text(error.userMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
          if (kDebugMode && error.originalError != null)
            TextButton(
              onPressed: () {
                _showDebugInfo(context, error);
              },
              child: const Text('Debug'),
            ),
        ],
      ),
    );
  }

  /// Mostra informações de debug
  static void _showDebugInfo(BuildContext context, AppError error) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Debug Info'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Type: ${error.type}'),
              Text('Code: ${error.code ?? 'N/A'}'),
              Text('Message: ${error.message}'),
              if (error.originalError != null)
                Text('Original: ${error.originalError}'),
              if (error.stackTrace != null)
                Text('Stack: ${error.stackTrace}'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Clipboard.setData(ClipboardData(
                text: error.toString(),
              ));
              Navigator.of(context).pop();
            },
            child: const Text('Copiar'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Fechar'),
          ),
        ],
      ),
    );
  }

  /// Retorna cor baseada no tipo de erro
  static Color _getErrorColor(AppErrorType type) {
    switch (type) {
      case AppErrorType.validation:
        return Colors.orange;
      case AppErrorType.network:
        return Colors.blue;
      case AppErrorType.authentication:
      case AppErrorType.authorization:
        return Colors.red;
      case AppErrorType.notFound:
        return Colors.grey;
      case AppErrorType.serverError:
        return Colors.deepOrange;
      case AppErrorType.timeout:
        return Colors.purple;
      case AppErrorType.fileSystem:
        return Colors.brown;
      case AppErrorType.permission:
        return Colors.indigo;
      case AppErrorType.unknown:
        return Colors.red;
    }
  }

  /// Retorna ícone baseado no tipo de erro
  static IconData _getErrorIcon(AppErrorType type) {
    switch (type) {
      case AppErrorType.validation:
        return Icons.warning;
      case AppErrorType.network:
        return Icons.wifi_off;
      case AppErrorType.authentication:
        return Icons.lock;
      case AppErrorType.authorization:
        return Icons.security;
      case AppErrorType.notFound:
        return Icons.search_off;
      case AppErrorType.timeout:
        return Icons.timer_off;
      case AppErrorType.serverError:
        return Icons.cloud_off;
      case AppErrorType.fileSystem:
        return Icons.insert_drive_file;
      case AppErrorType.permission:
        return Icons.shield;
      case AppErrorType.unknown:
        return Icons.error;
    }
  }

  /// Wrapper para executar código com tratamento de erro
  static Future<T?> safeExecute<T>(
    Future<T> Function() operation, {
    BuildContext? context,
    String? errorMessage,
    bool showError = true,
  }) async {
    try {
      return await operation();
    } on Object catch (error, stack) {
      final appError = ErrorFactory.fromException(error, stack);
      
      handleError(error, stack);
      
      if (showError && context != null && context.mounted) {
        showErrorToUser(context, appError);
      }
      
      return null;
    }
  }

  /// Wrapper para executar código síncrono com tratamento de erro
  static T? safeExecuteSync<T>(
    T Function() operation, {
    BuildContext? context,
    String? errorMessage,
    bool showError = true,
  }) {
    try {
      return operation();
    } on Object catch (error, stack) {
      final appError = ErrorFactory.fromException(error, stack);
      
      handleError(error, stack);
      
      if (showError && context != null && context.mounted) {
        showErrorToUser(context, appError);
      }
      
      return null;
    }
  }
}
