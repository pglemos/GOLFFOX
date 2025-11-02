import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/env_config.dart';
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
  static ErrorService? _instance;
  static ErrorService get instance => _instance ??= ErrorService._();
  ErrorService._();

  final _logger = LoggerService.instance;
  final List<ErrorReport> _errorHistory = [];
  static const int _maxErrorHistory = 100;

  /// Initialize the error service
  Future<void> initialize() async {
    _logger.info('Error service initialized');
  }

  /// Report an error with context
  Future<void> reportError(
    Object error,
    StackTrace? stackTrace, {
    String? context,
    Map<String, dynamic>? additionalData,
    ErrorSeverity severity = ErrorSeverity.error,
  }) async {
    final report = ErrorReport(
      error: error,
      stackTrace: stackTrace,
      context: context,
      additionalData: additionalData,
      severity: severity,
      timestamp: DateTime.now(),
    );

    // Add to history
    _errorHistory.add(report);
    if (_errorHistory.length > _maxErrorHistory) {
      _errorHistory.removeAt(0);
    }

    // Log the error
    _logger.error(
      'Error reported: ${_getErrorMessage(error)}',
      error,
      stackTrace,
    );

    // Send to external services if enabled
    if (EnvConfig.enableCrashlytics) {
      await _sendToCrashlytics(report);
    }

    // Send to analytics if enabled
    if (EnvConfig.enableAnalytics) {
      await _sendToAnalytics(report);
    }
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

    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt == maxAttempts || !shouldRetry(error, attempt)) {
          await reportError(
            error,
            StackTrace.current,
            context: context,
            additionalData: {
              'attempt': attempt,
              'maxAttempts': maxAttempts,
            },
          );
          rethrow;
        }

        _logger.warning(
          'operation failed (attempt $attempt/$maxAttempts), retrying...',
          {'error': error.toString(), 'context': context},
        );

        await Future.delayed(delay * attempt);
      }
    }

    throw lastError!;
  }

  // Private methods

  GxError _categorizeSupabaseError(Object error) {
    if (error is AuthException) {
      return GxError(
        code: 'auth_error',
        message: error.message,
        userMessage: 'Erro de autenticacao. Tente fazer login novamente.',
        severity: ErrorSeverity.warning,
      );
    }

    if (error is PostgrestException) {
      final message = error.message.toLowerCase();

      if (message.contains('permission') || message.contains('rls')) {
        return GxError(
          code: 'permission_denied',
          message: error.message,
          userMessage: 'Voce nao tem permissao para esta operacao.',
          severity: ErrorSeverity.warning,
        );
      }

      if (error.code == '404' || message.contains('not found')) {
        return GxError(
          code: 'not_found',
          message: error.message,
          userMessage: 'Registro nao encontrado.',
          severity: ErrorSeverity.info,
        );
      }

      if (error.code == '409' || message.contains('duplicate')) {
        return GxError(
          code: 'conflict',
          message: error.message,
          userMessage: 'Este registro ja existe.',
          severity: ErrorSeverity.warning,
        );
      }
    }

    return GxError(
      code: 'supabase_error',
      message: error.toString(),
      userMessage: 'Erro no servidor. Tente novamente.',
      severity: ErrorSeverity.error,
    );
  }

  GxError _categorizeNetworkError(Object error) {
    if (error is TimeoutException) {
      return GxError(
        code: 'timeout',
        message: 'operation timed out',
        userMessage: 'Operacao demorou muito. Verifique sua conexao.',
        severity: ErrorSeverity.warning,
      );
    }

    final errorString = error.toString().toLowerCase();

    if (errorString.contains('network') || errorString.contains('connection')) {
      return GxError(
        code: 'network_error',
        message: error.toString(),
        userMessage: 'Erro de conexao. Verifique sua internet.',
        severity: ErrorSeverity.warning,
      );
    }

    return GxError(
      code: 'unknown_error',
      message: error.toString(),
      userMessage: 'Erro inesperado. Tente novamente.',
      severity: ErrorSeverity.error,
    );
  }

  String _getErrorMessage(Object error) {
    if (error is Exception) {
      return error.toString();
    }
    return error.toString();
  }

  Future<void> _sendToCrashlytics(ErrorReport report) async {
    // TODO: Implement Crashlytics integration
    _logger.debug('Would send to Crashlytics: ${report.error}');
  }

  Future<void> _sendToAnalytics(ErrorReport report) async {
    // TODO: Implement Analytics integration
    _logger.debug('Would send to Analytics: ${report.error}');
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
  final String code;
  final String message;
  final String userMessage;
  final ErrorSeverity severity;
  final Map<String, dynamic>? additionalData;

  const GxError({
    required this.code,
    required this.message,
    required this.userMessage,
    this.severity = ErrorSeverity.error,
    this.additionalData,
  });

  @override
  String toString() => 'GxError($code): $message';
}

/// Error report for tracking and analytics
class ErrorReport {
  final Object error;
  final StackTrace? stackTrace;
  final String? context;
  final Map<String, dynamic>? additionalData;
  final ErrorSeverity severity;
  final DateTime timestamp;

  const ErrorReport({
    required this.error,
    this.stackTrace,
    this.context,
    this.additionalData,
    required this.severity,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'error': error.toString(),
        'context': context,
        'additionalData': additionalData,
        'severity': severity.name,
        'timestamp': timestamp.toIso8601String(),
      };
}
