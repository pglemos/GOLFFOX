import 'dart:async';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/env_config.dart';
import '../error/error_utils.dart';
import 'logger_service.dart';

/// Comprehensive error handling service for GolfFox
///
/// Features:
/// - Centralized error reporting
/// - Error categorization
/// - User-friendly error messages
/// - Automatic retry logic
/// - Error analytics
class ErrorService {
  ErrorService._();
  static ErrorService? _instance;
  // ignore: prefer_constructors_over_static_methods
  static ErrorService get instance => _instance ??= ErrorService._();

  final _logger = LoggerService.instance;
  final List<ErrorReport> _errorHistory = [];
  static const int _maxErrorHistory = 100;

  /// Initialize the error service
  Future<void> initialize() async {
    _logger.info('Error service initialized');
  }

  /// Execute an async operation with standardized error handling and logging
  Future<T> executeWithHandling<T>(
    Future<T> Function() operation, {
    String? context,
    Map<String, dynamic>? additionalData,
    ErrorSeverity severityOnError = ErrorSeverity.error,
  }) async {
    try {
      return await operation();
    } on PlatformException catch (e, stack) {
      await reportError(
        e,
        stack,
        context: context ?? 'Platform operation',
        additionalData: additionalData,
        severity: ErrorSeverity.warning,
      );
      rethrow;
    } on PostgrestException catch (e, stack) {
      await reportError(
        e,
        stack,
        context: context ?? 'Supabase operation',
        additionalData: {
          ...?additionalData,
          'errorType': 'supabase',
          'errorCode': e.code,
        },
      );
      rethrow;
    } on TimeoutException catch (e, stack) {
      await reportError(
        e,
        stack,
        context: context ?? 'Timeout',
        additionalData: additionalData,
        severity: ErrorSeverity.warning,
      );
      rethrow;
    } on Exception catch (e, stack) {
      // ArgumentError é uma subclasse de Error, não Exception, então será capturado aqui
      // se for lançado como Exception ou no catch genérico abaixo
      await reportError(
        e,
        stack,
        context: context,
        additionalData: additionalData,
        severity: severityOnError,
      );
      rethrow;
    } on Object catch (e, stack) {
      await reportError(
        e,
        stack,
        context: context,
        additionalData: additionalData,
        severity: severityOnError,
      );
      rethrow;
    }
  }

  /// Report an error with context
  Future<void> reportError(
    Object error,
    StackTrace? stackTrace, {
    String? context,
    Map<String, dynamic>? additionalData,
    ErrorSeverity severity = ErrorSeverity.error,
  }) async {
    final safeData = _sanitizeData(additionalData);
    final report = ErrorReport(
      error: error,
      stackTrace: stackTrace,
      context: context,
      additionalData: safeData,
      severity: severity,
      timestamp: DateTime.now(),
    );

    // Add to history
    _errorHistory.add(report);
    if (_errorHistory.length > _maxErrorHistory) {
      _errorHistory.removeAt(0);
    }

    // Log the error
    final formatted = ErrorUtils.formatError(error,
        context: context, additionalData: safeData);
    _logger.error('Error reported: $formatted', error, stackTrace);

    // Send to external services if enabled
    if (EnvConfig.enableCrashlytics) {
      await _sendToCrashlytics(report);
    }

    // Send to analytics if enabled
    if (EnvConfig.enableAnalytics) {
      await _sendToAnalytics(report);
    }
  }

  /// Unified handler: categorizes, logs and returns a standardized GxError
  Future<GxError> handle(Object error, {String? context}) async {
    final gxError = from(error);
    await reportError(
      error,
      StackTrace.current,
      context: context,
      severity: gxError.severity,
      additionalData: {'code': gxError.code},
    );
    return gxError;
  }

  /// Handle Supabase-specific errors
  Future<GxError> handleSupabaseError(Object error, {String? context}) async {
    final gxError = _categorizeSupabaseError(error);

    await reportError(
      error,
      StackTrace.current,
      context: context ?? 'Supabase operation',
      severity: gxError.severity,
      additionalData: {
        'errorType': 'supabase',
        'errorCode': gxError.code,
      },
    );

    return gxError;
  }

  /// Handle network errors
  Future<GxError> handleNetworkError(Object error, {String? context}) async {
    final gxError = _categorizeNetworkError(error);

    await reportError(
      error,
      StackTrace.current,
      context: context ?? 'Network operation',
      severity: gxError.severity,
      additionalData: {
        'errorType': 'network',
        'errorCode': gxError.code,
      },
    );

    return gxError;
  }

  /// Get user-friendly error message
  String getUserFriendlyMessage(Object error) {
    if (error is GxError) {
      return error.userMessage;
    }
    return _getErrorMessage(error);
  }

  /// Get error history
  List<ErrorReport> getErrorHistory({ErrorSeverity? minSeverity}) {
    if (minSeverity == null) {
      return List.from(_errorHistory);
    }

    return _errorHistory
        .where((report) => report.severity.index >= minSeverity.index)
        .toList();
  }

  /// Clear error history
  void clearErrorHistory() {
    _errorHistory.clear();
    _logger.debug('Error history cleared');
  }

  /// Check if should retry operation based on error
  bool shouldRetry(Object error, int attemptCount) {
    if (attemptCount >= 3) return false;

    // Retry network errors
    if (error is TimeoutException ||
        error.toString().contains('network') ||
        error.toString().contains('connection')) {
      return true;
    }

    // Retry certain Supabase errors
    if (error is PostgrestException) {
      final code = error.code;
      return code == '503' || code == '502' || code == '504';
    }

    return false;
  }

  /// Execute operation with automatic retry
  Future<T> withRetry<T>(
    Future<T> Function() operation, {
    int maxAttempts = 3,
    Duration delay = const Duration(seconds: 1),
    String? context,
  }) async {
    Object? lastError;

    for (var attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } on Object catch (error, stack) {
        lastError = error;

        if (attempt == maxAttempts || !shouldRetry(error, attempt)) {
          await reportError(
            error,
            stack,
            context: context,
            additionalData: {
              'attempt': attempt,
              'maxAttempts': maxAttempts,
            },
          );
          rethrow;
        }

        final formatted =
            ErrorUtils.formatError(error, context: context, additionalData: {
          'attempt': attempt,
          'maxAttempts': maxAttempts,
        });
        _logger.warning(
            'operation failed (attempt $attempt/$maxAttempts), retrying... $formatted');

        await Future<void>.delayed(delay * attempt);
      }
    }

    if (lastError is Exception) {
      throw lastError;
    }
    if (lastError is Error) {
      throw lastError;
    }
    throw Exception(lastError.toString());
  }

  // Private methods

  /// Create standardized error from any exception
  GxError from(Object error) {
    // Supabase-auth specific
    if (error is AuthException || error is PostgrestException) {
      return _categorizeSupabaseError(error);
    }

    // Platform exceptions (e.g., permissions, clipboard)
    if (error is PlatformException) {
      final code = error.code.toLowerCase();
      if (code.contains('permission')) {
        return GxError(
          code: 'permission_denied',
          message: error.message ?? error.toString(),
          userMessage: 'Permissão negada para esta operação.',
          severity: ErrorSeverity.warning,
        );
      }
      if (code.contains('network')) {
        return GxError(
          code: 'network_error',
          message: error.message ?? error.toString(),
          userMessage: 'Erro de conexão. Verifique sua internet.',
          severity: ErrorSeverity.warning,
        );
      }
      return GxError(
        code: code.isEmpty ? 'platform_error' : code,
        message: error.message ?? error.toString(),
        userMessage: 'Erro de plataforma. Tente novamente.',
      );
    }

    // Common Dart exceptions
    if (error is TimeoutException) {
      return const GxError(
        code: 'timeout',
        message: 'operation timed out',
        userMessage: 'Operação demorou muito. Verifique sua conexão.',
        severity: ErrorSeverity.warning,
      );
    }
    if (error is FormatException) {
      return GxError(
        code: 'invalid_format',
        message: error.message,
        userMessage: 'Formato inválido dos dados informados.',
        severity: ErrorSeverity.warning,
      );
    }
    if (error is ArgumentError) {
      return GxError(
        code: 'invalid_argument',
        message: (error.message ?? error).toString(),
        userMessage: 'Parâmetro inválido fornecido.',
        severity: ErrorSeverity.warning,
      );
    }
    if (error is StateError) {
      return GxError(
        code: 'invalid_state',
        message: error.toString(),
        userMessage: 'Estado inválido para esta operação.',
      );
    }

    // Fallback
    return GxError(
      code: 'unknown_error',
      message: error.toString(),
      userMessage: 'Erro inesperado. Tente novamente.',
    );
  }

  GxError _categorizeSupabaseError(Object error) {
    if (error is AuthException) {
      return GxError(
        code: 'auth_error',
        message: error.message,
        userMessage: 'Erro de autenticação. Tente fazer login novamente.',
        severity: ErrorSeverity.warning,
      );
    }

    if (error is PostgrestException) {
      final message = error.message.toLowerCase();

      if (message.contains('permission') || message.contains('rls')) {
        return GxError(
          code: 'permission_denied',
          message: error.message,
          userMessage: 'Você não tem permissão para esta operação.',
          severity: ErrorSeverity.warning,
        );
      }

      if (error.code == '404' || message.contains('not found')) {
        return GxError(
          code: 'not_found',
          message: error.message,
          userMessage: 'Registro não encontrado.',
          severity: ErrorSeverity.info,
        );
      }

      if (error.code == '409' || message.contains('duplicate')) {
        return GxError(
          code: 'conflict',
          message: error.message,
          userMessage: 'Este registro já existe.',
          severity: ErrorSeverity.warning,
        );
      }
    }

    return GxError(
      code: 'supabase_error',
      message: error.toString(),
      userMessage: 'Erro no servidor. Tente novamente.',
    );
  }

  GxError _categorizeNetworkError(Object error) {
    if (error is TimeoutException) {
      return const GxError(
        code: 'timeout',
        message: 'operation timed out',
        userMessage: 'Operação demorou muito. Verifique sua conexão.',
        severity: ErrorSeverity.warning,
      );
    }

    final errorString = error.toString().toLowerCase();

    if (errorString.contains('network') || errorString.contains('connection')) {
      return GxError(
        code: 'network_error',
        message: error.toString(),
        userMessage: 'Erro de conexão. Verifique sua internet.',
        severity: ErrorSeverity.warning,
      );
    }

    return GxError(
      code: 'unknown_error',
      message: error.toString(),
      userMessage: 'Erro inesperado. Tente novamente.',
    );
  }

  String _getErrorMessage(Object error) {
    if (error is Exception) {
      return error.toString();
    }
    return error.toString();
  }

  /// Redact sensitive values in additionalData before logging/reporting
  Map<String, dynamic>? _sanitizeData(Map<String, dynamic>? data) {
    if (data == null) return null;
    final sensitive = <String>{
      'password',
      'senha',
      'token',
      'secret',
      'authorization',
      'auth',
      'cpf',
      'cnpj',
      'api_key',
      'apiKey',
      'key',
      'access_token',
      'refresh_token',
    };
    final sanitized = <String, dynamic>{};
    data.forEach((k, v) {
      final keyLower = k.toLowerCase();
      if (sensitive.any(keyLower.contains)) {
        sanitized[k] = '***redacted***';
      } else {
        sanitized[k] = v;
      }
    });
    return sanitized;
  }

  /// Send error report to Crashlytics service
  /// 
  /// This method is called automatically when [EnvConfig.enableCrashlytics] is true.
  /// To integrate with Firebase Crashlytics or another service, implement the actual
  /// reporting logic here.
  Future<void> _sendToCrashlytics(ErrorReport report) async {
    // Implementation placeholder for Crashlytics integration
    // Example: Firebase Crashlytics integration
    // await FirebaseCrashlytics.instance.recordError(
    //   report.error,
    //   report.stackTrace,
    //   reason: report.context,
    //   information: report.additionalData,
    // );
    try {
      _logger.debug('Error logged (Crashlytics disabled): ${report.error}');
    } on Exception catch (e, stack) {
      _logger.error('Crashlytics forwarding failed', e, stack);
    }
  }

  /// Send error report to Analytics service
  /// 
  /// This method is called automatically when [EnvConfig.enableAnalytics] is true.
  /// To integrate with Firebase Analytics or another service, implement the actual
  /// reporting logic here.
  Future<void> _sendToAnalytics(ErrorReport report) async {
    // Implementation placeholder for Analytics integration
    // Example: Firebase Analytics integration
    // await FirebaseAnalytics.instance.logEvent(
    //   name: 'error_occurred',
    //   parameters: {
    //     'error_code': report.severity.name,
    //     'context': report.context,
    //     ...report.additionalData ?? {},
    //   },
    // );
    try {
      _logger.debug('Error logged (Analytics disabled): ${report.error}');
    } on Exception catch (e, stack) {
      _logger.error('Analytics forwarding failed', e, stack);
    }
  }
}

/// Error severity levels
enum ErrorSeverity {
  info,
  warning,
  error,
  critical,
}

/// Standardized error class for GolfFox
class GxError implements Exception {
  const GxError({
    required this.code,
    required this.message,
    required this.userMessage,
    this.severity = ErrorSeverity.error,
    this.additionalData,
  });
  final String code;
  final String message;
  final String userMessage;
  final ErrorSeverity severity;
  final Map<String, dynamic>? additionalData;

  @override
  String toString() => 'GxError($code): $message';
}

/// Error report for tracking and analytics
class ErrorReport {
  const ErrorReport({
    required this.error,
    required this.severity,
    required this.timestamp,
    this.stackTrace,
    this.context,
    this.additionalData,
  });
  final Object error;
  final StackTrace? stackTrace;
  final String? context;
  final Map<String, dynamic>? additionalData;
  final ErrorSeverity severity;
  final DateTime timestamp;

  Map<String, dynamic> toJson() => {
        'error': error.toString(),
        'context': context,
        'additionalData': additionalData,
        'severity': severity.name,
        'timestamp': timestamp.toIso8601String(),
      };
}
