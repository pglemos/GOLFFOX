import 'dart:async';
import 'dart:developer' as developer;
import 'package:flutter/foundation.dart';

import '../config/app_config.dart';

/// Níveis de log
enum LogLevel {
  debug,
  info,
  warning,
  error,
  critical,
}

/// Sistema de logging seguro da aplicação
class AppLogger {
  static const String _name = 'GolfFox';
  static final List<LogRecordHandler> _externalHandlers = [];
  
  // Palavras-chave sensíveis que devem ser mascaradas
  static const List<String> _sensitiveKeywords = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'bearer',
    'credential',
    'auth',
    'session',
    'cookie',
    'jwt',
    'api_key',
    'private',
  ];

  /// Registra manipuladores externos (Crashlytics, Sentry, etc).
  /// Retorna uma callback que remove o handler.
  static VoidCallback registerExternalHandler(LogRecordHandler handler) {
    _externalHandlers.add(handler);
    return () => _externalHandlers.remove(handler);
  }

  /// Log de debug (apenas em modo debug)
  static void debug(String message, {String? tag, Object? error, StackTrace? stackTrace}) {
    if (!kDebugMode) return;
    _log(LogLevel.debug, message, tag: tag, error: error, stackTrace: stackTrace);
  }

  /// Log de informação
  static void info(String message, {String? tag, Object? error, StackTrace? stackTrace}) {
    _log(LogLevel.info, message, tag: tag, error: error, stackTrace: stackTrace);
  }

  /// Log de aviso
  static void warning(String message, {String? tag, Object? error, StackTrace? stackTrace}) {
    _log(LogLevel.warning, message, tag: tag, error: error, stackTrace: stackTrace);
  }

  /// Log de erro
  static void error(String message, {String? tag, Object? error, StackTrace? stackTrace}) {
    _log(LogLevel.error, message, tag: tag, error: error, stackTrace: stackTrace);
  }

  /// Log crítico
  static void critical(String message, {String? tag, Object? error, StackTrace? stackTrace}) {
    _log(LogLevel.critical, message, tag: tag, error: error, stackTrace: stackTrace);
  }

  /// Log de requisição HTTP (com dados sensíveis mascarados)
  static void httpRequest({
    required String method,
    required String url,
    Map<String, dynamic>? headers,
    Object? body,
    String? tag,
  }) {
    if (!AppConfig.debugMode) return;

    final sanitizedHeaders = _sanitizeData(headers);
    final sanitizedBody = _sanitizeData(body);

    final message = '''
HTTP Request:
Method: $method
URL: $url
Headers: $sanitizedHeaders
Body: $sanitizedBody
''';

    debug(message, tag: tag ?? 'HTTP');
  }

  /// Log de resposta HTTP (com dados sensíveis mascarados)
  static void httpResponse({
    required int statusCode,
    required String url,
    Map<String, dynamic>? headers,
    Object? body,
    Duration? duration,
    String? tag,
  }) {
    if (!AppConfig.debugMode) return;

    final sanitizedHeaders = _sanitizeData(headers);
    final sanitizedBody = _sanitizeData(body);

    final message = '''
HTTP Response:
Status: $statusCode
URL: $url
Duration: ${duration?.inMilliseconds ?? 'N/A'}ms
Headers: $sanitizedHeaders
Body: $sanitizedBody
''';

    if (statusCode >= 400) {
      error(message, tag: tag ?? 'HTTP');
    } else {
      debug(message, tag: tag ?? 'HTTP');
    }
  }

  /// Log de navegação
  static void navigation(String from, String to, {Map<String, dynamic>? params}) {
    if (!AppConfig.debugMode) return;

    final sanitizedParams = _sanitizeData(params);
    debug('Navigation: $from -> $to (params: $sanitizedParams)', tag: 'Navigation');
  }

  /// Log de autenticação (sem dados sensíveis)
  static void auth(String action, {String? userId, bool success = true}) {
    final message = 'Auth $action: ${success ? 'SUCCESS' : 'FAILED'}${userId != null ? ' (user: ${_maskUserId(userId)})' : ''}';
    
    if (success) {
      info(message, tag: 'Auth');
    } else {
      warning(message, tag: 'Auth');
    }
  }

  /// Log de performance
  static void performance(String operation, Duration duration, {String? tag, Map<String, dynamic>? metadata}) {
    final sanitizedMetadata = _sanitizeData(metadata);
    final message = 'Performance: $operation took ${duration.inMilliseconds}ms (metadata: $sanitizedMetadata)';
    
    if (duration.inMilliseconds > 1000) {
      warning(message, tag: tag ?? 'Performance');
    } else {
      debug(message, tag: tag ?? 'Performance');
    }
  }

  /// Log interno
  static void _log(
    LogLevel level,
    String message, {
    String? tag,
    Object? error,
    StackTrace? stackTrace,
    Map<String, Object?>? metadata,
  }) {
    final now = DateTime.now();
    final timestamp = now.toIso8601String();
    final levelStr = level.name.toUpperCase().padRight(8);
    final tagStr = tag != null ? '[$tag] ' : '';
    final sanitizedMessage = _sanitizeMessage(message);

    final logMessage = '[$timestamp] $levelStr $tagStr$sanitizedMessage';
    final record = LogRecord(
      level: level,
      message: sanitizedMessage,
      timestamp: now,
      tag: tag,
      error: error,
      stackTrace: stackTrace,
      metadata: metadata,
    );

    developer.log(
      logMessage,
      time: now,
      level: _getLevelValue(level),
      name: _name,
      error: error,
      stackTrace: stackTrace,
    );

    if (!kDebugMode && (level == LogLevel.error || level == LogLevel.critical)) {
      _sendToExternalService(record);
    }
  }
  /// Sanitiza dados removendo informações sensíveis
  static dynamic _sanitizeData(Object? data) {
    if (data == null) {
      return null;
    }

    if (data is String) {
      return _sanitizeMessage(data);
    }

    if (data is Map) {
      final sanitized = <String, dynamic>{};
      data.forEach((key, value) {
        final keyStr = key.toString().toLowerCase();
        if (_sensitiveKeywords.any(keyStr.contains)) {
          sanitized[keyStr] = _maskValue(value.toString());
        } else {
          sanitized[keyStr] = _sanitizeData(value);
        }
      });
      return sanitized;
    }

    if (data is List) {
      return data.map(_sanitizeData).toList();
    }

    return data;
  }

  /// Sanitiza mensagem de log
  static String _sanitizeMessage(String message) {
    var sanitized = message;
    
    for (final keyword in _sensitiveKeywords) {
      // Regex para encontrar padrões como "password: value" ou "password=value"
      final regex = RegExp(
        '$keyword\\s*[:=]\\s*["\']?([^\\s,"\']+)["\']?',
        caseSensitive: false,
      );
      
      sanitized = sanitized.replaceAllMapped(regex, (match) {
        final full = match.group(0)!;
        final captured = match.group(1)!;
        final idx = full.indexOf(captured);
        final prefix = idx >= 0 ? full.substring(0, idx) : full;
        return '$prefix${_maskValue(captured)}';
      });
    }
    
    return sanitized;
  }

  /// Mascara valor sensível
  static String _maskValue(String value) {
    if (value.length <= 4) {
      return '***';
    }
    return '${value.substring(0, 2)}${'*' * (value.length - 4)}${value.substring(value.length - 2)}';
  }

  /// Mascara ID de usuário
  static String _maskUserId(String userId) {
    if (userId.length <= 8) {
      return '***';
    }
    return '${userId.substring(0, 4)}***${userId.substring(userId.length - 4)}';
  }

  /// Converte nível de log para valor numérico
  static int _getLevelValue(LogLevel level) {
    switch (level) {
      case LogLevel.debug:
        return 500;
      case LogLevel.info:
        return 800;
      case LogLevel.warning:
        return 900;
      case LogLevel.error:
        return 1000;
      case LogLevel.critical:
        return 1200;
    }
  }

  /// Envia logs críticos para serviços externos (em produção)
  static void _sendToExternalService(LogRecord record) {
    if (_externalHandlers.isEmpty) {
      if (kDebugMode) {
        debugPrint('External log handler not configured. '
            'Record skipped: ${record.level.name} - ${record.message}');
      }
      return;
    }

    for (final handler in List<LogRecordHandler>.from(_externalHandlers)) {
      try {
        final result = handler(record);
        if (result is Future) {
          unawaited(result);
        }
      } on Exception catch (error, stackTrace) {
        debugPrint('Failed to forward log record: $error');
        debugPrintStack(stackTrace: stackTrace);
      } on Error catch (error, stackTrace) {
        debugPrint('Failed to forward log record: $error');
        debugPrintStack(stackTrace: stackTrace);
      }
    }
  }

  /// Wrapper para medir performance de operações
  static Future<T> measurePerformance<T>(
    String operation,
    Future<T> Function() function, {
    String? tag,
    Map<String, dynamic>? metadata,
  }) async {
    final stopwatch = Stopwatch()..start();
    
    try {
      final result = await function();
      stopwatch.stop();
      performance(operation, stopwatch.elapsed, tag: tag, metadata: metadata);
      return result;
    } catch (error, stackTrace) {
      stopwatch.stop();
      performance('$operation (FAILED)', stopwatch.elapsed, tag: tag, metadata: metadata);
      AppLogger.error('Operation failed: $operation', error: error, stackTrace: stackTrace, tag: tag);
      rethrow;
    }
  }

  /// Wrapper para medir performance de operações síncronas
  static T measurePerformanceSync<T>(
    String operation,
    T Function() function, {
    String? tag,
    Map<String, dynamic>? metadata,
  }) {
    final stopwatch = Stopwatch()..start();
    
    try {
      final result = function();
      stopwatch.stop();
      performance(operation, stopwatch.elapsed, tag: tag, metadata: metadata);
      return result;
    } catch (error, stackTrace) {
      stopwatch.stop();
      performance('$operation (FAILED)', stopwatch.elapsed, tag: tag, metadata: metadata);
      AppLogger.error('Operation failed: $operation', error: error, stackTrace: stackTrace, tag: tag);
      rethrow;
    }
  }
}

/// Estrutura de um registro de log
class LogRecord {
  const LogRecord({
    required this.level,
    required this.message,
    required this.timestamp,
    this.tag,
    this.error,
    this.stackTrace,
    this.metadata,
  });

  final LogLevel level;
  final String message;
  final DateTime timestamp;
  final String? tag;
  final Object? error;
  final StackTrace? stackTrace;
  final Map<String, Object?>? metadata;
}

/// Assinatura de manipuladores externos de log (Crashlytics, Sentry, etc.)
typedef LogRecordHandler = FutureOr<void> Function(LogRecord record);
