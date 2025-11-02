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
  }) {
    final timestamp = DateTime.now().toIso8601String();
    final levelStr = level.name.toUpperCase().padRight(8);
    final tagStr = tag != null ? '[$tag] ' : '';
    final sanitizedMessage = _sanitizeMessage(message);

    final logMessage = '[$timestamp] $levelStr $tagStr$sanitizedMessage';

    // Log no console em modo debug
    if (kDebugMode) {
      print(logMessage);
      
      if (error != null) {
        print('Error: $error');
      }
      
      if (stackTrace != null) {
        print('StackTrace: $stackTrace');
      }
    }

    // Log usando developer.log para melhor integração com ferramentas
    developer.log(
      sanitizedMessage,
      time: DateTime.now(),
      level: _getLevelValue(level),
      name: _name,
      error: error,
      stackTrace: stackTrace,
    );

    // Em produção, enviar logs críticos para serviços externos
    if (!kDebugMode && (level == LogLevel.error || level == LogLevel.critical)) {
      _sendToExternalService(level, sanitizedMessage, error, stackTrace);
    }
  }

  /// Sanitiza dados removendo informações sensíveis
  static dynamic _sanitizeData(dynamic data) {
    if (data == null) return null;

    if (data is String) {
      return _sanitizeMessage(data);
    }

    if (data is Map) {
      final sanitized = <String, dynamic>{};
      data.forEach((key, value) {
        final keyStr = key.toString().toLowerCase();
        if (_sensitiveKeywords.any((keyword) => keyStr.contains(keyword))) {
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
    String sanitized = message;
    
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
  static void _sendToExternalService(
    LogLevel level,
    String message,
    Object? error,
    StackTrace? stackTrace,
  ) {
    // Aqui você pode integrar com serviços como:
    // - Firebase Crashlytics
    // - Sentry
    // - LogRocket
    // - Datadog
    // etc.
    
    // Exemplo de estrutura de dados para envio:
    final logData = {
      'level': level.name,
      'message': message,
      'timestamp': DateTime.now().toIso8601String(),
      'platform': 'flutter',
      'version': '1.0.0', // Versão da app
      if (error != null) 'error': error.toString(),
      if (stackTrace != null) 'stackTrace': stackTrace.toString(),
    };

    // TODO: Implementar envio para serviço externo
    if (kDebugMode) {
      print('📤 Would send to external service: $logData');
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
