import 'package:flutter/foundation.dart';

import '../config/env_config.dart';

/// Comprehensive logging service for GolfFox
///
/// Features:
/// - Multiple log levels
/// - Conditional logging based on environment
/// - Structured logging with context
/// - Performance monitoring
/// - Memory-efficient buffering
class LoggerService {
  static LoggerService? _instance;
  static LoggerService get instance => _instance ??= LoggerService._();
  LoggerService._();

  final List<LogEntry> _buffer = [];
  static const int _maxBufferSize = 1000;
  bool _isInitialized = false;

  /// Initialize the logger service
  Future<void> initialize() async {
    if (_isInitialized) return;

    _isInitialized = true;

    if (EnvConfig.enableDebugLogs) {
      info(' Logger service initialized');
      debug('Logger configuration: ${_getLoggerConfig()}');
    }
  }

  /// Log debug information (only in debug mode)
  void debug(String message, [Object? data]) {
    if (kDebugMode && EnvConfig.enableDebugLogs) {
      _log(LogLevel.debug, message, data: data);
    }
  }

  /// Log general information
  void info(String message, [Object? data]) {
    _log(LogLevel.info, message, data: data);
  }

  /// Log warnings
  void warning(String message, [Object? data]) {
    _log(LogLevel.warning, message, data: data);
  }

  /// Log errors
  void error(String message, [Object? error, StackTrace? stackTrace]) {
    _log(
      LogLevel.error,
      message,
      error: error,
      stackTrace: stackTrace,
    );
  }

  /// Log success messages
  void success(String message, [Object? data]) {
    _log(LogLevel.success, message, data: data);
  }

  /// Log performance metrics
  void performance(String operation, Duration duration,
      [Map<String, dynamic>? metrics]) {
    if (EnvConfig.enableDebugLogs) {
      final data = {
        'duration_ms': duration.inMilliseconds,
        'operation': operation,
        if (metrics != null) ...metrics,
      };
      _log(LogLevel.performance, 'Performance: $operation', data: data);
    }
  }

  /// Measure and log performance of an operation
  Future<T> measurePerformance<T>(
    String operation,
    Future<T> Function() function, {
    Map<String, dynamic>? additionalMetrics,
  }) async {
    final stopwatch = Stopwatch()..start();

    try {
      final result = await function();
      stopwatch.stop();

      performance(operation, stopwatch.elapsed, {
        'status': 'success',
        if (additionalMetrics != null) ...additionalMetrics,
      });

      return result;
    } catch (error) {
      stopwatch.stop();

      performance(operation, stopwatch.elapsed, {
        'status': 'error',
        'error': error.toString(),
        if (additionalMetrics != null) ...additionalMetrics,
      });

      rethrow;
    }
  }

  /// Get recent log entries
  List<LogEntry> getRecentLogs({int? limit}) {
    final logs = List<LogEntry>.from(_buffer);
    if (limit != null && logs.length > limit) {
      return logs.sublist(logs.length - limit);
    }
    return logs;
  }

  /// Clear log buffer
  void clearLogs() {
    _buffer.clear();
    debug('Log buffer cleared');
  }

  /// Export logs as formatted string
  String exportLogs({LogLevel? minLevel}) {
    final filteredLogs = minLevel != null
        ? _buffer.where((log) => log.level.index >= minLevel.index)
        : _buffer;

    return filteredLogs.map((log) => log.toString()).join('\n');
  }

  // Private methods

  void _log(
    LogLevel level,
    String message, {
    Object? data,
    Object? error,
    StackTrace? stackTrace,
  }) {
    final entry = LogEntry(
      level: level,
      message: message,
      timestamp: DateTime.now(),
      data: data,
      error: error,
      stackTrace: stackTrace,
    );

    // Add to buffer
    _buffer.add(entry);

    // Maintain buffer size
    if (_buffer.length > _maxBufferSize) {
      _buffer.removeAt(0);
    }

    // Print to console if enabled
    if (_shouldPrint(level)) {
      _printToConsole(entry);
    }
  }

  bool _shouldPrint(LogLevel level) {
    if (!EnvConfig.enableDebugLogs && level == LogLevel.debug) {
      return false;
    }

    // Always print errors and warnings
    if (level == LogLevel.error || level == LogLevel.warning) {
      return true;
    }

    // Print info and success in debug mode or development
    if (kDebugMode || EnvConfig.isDevelopment) {
      return true;
    }

    return false;
  }

  void _printToConsole(LogEntry entry) {
    final emoji = _getEmojiForLevel(entry.level);
    final timestamp = entry.timestamp.toIso8601String().substring(11, 23);
    final prefix = '[$timestamp] $emoji';

    debugPrint('$prefix ${entry.message}');

    if (entry.data != null) {
      debugPrint('  Data: ${entry.data}');
    }

    if (entry.error != null) {
      debugPrint('  Error: ${entry.error}');
    }

    if (entry.stackTrace != null && EnvConfig.enableDebugLogs) {
      debugPrint('  Stack trace:\n${entry.stackTrace}');
    }
  }

  String _getEmojiForLevel(LogLevel level) {
    switch (level) {
      case LogLevel.debug:
        return '[DBG]';
      case LogLevel.info:
        return '[INF]';
      case LogLevel.warning:
        return '[WRN]';
      case LogLevel.error:
        return '[ERR]';
      case LogLevel.success:
        return '[OK]';
      case LogLevel.performance:
        return '[PERF]';
    }
  }

  Map<String, dynamic> _getLoggerConfig() => {
        'enableDebugLogs': EnvConfig.enableDebugLogs,
        'environment': EnvConfig.environment,
        'maxBufferSize': _maxBufferSize,
        'currentBufferSize': _buffer.length,
      };
}

/// Log levels in order of severity
enum LogLevel {
  debug,
  info,
  success,
  performance,
  warning,
  error,
}

/// Individual log entry
class LogEntry {
  final LogLevel level;
  final String message;
  final DateTime timestamp;
  final Object? data;
  final Object? error;
  final StackTrace? stackTrace;

  const LogEntry({
    required this.level,
    required this.message,
    required this.timestamp,
    this.data,
    this.error,
    this.stackTrace,
  });

  @override
  String toString() {
    final buffer = StringBuffer();
    buffer.write('[${timestamp.toIso8601String()}] ');
    buffer.write('${level.name.toUpperCase()}: ');
    buffer.write(message);

    if (data != null) {
      buffer.write(' | Data: $data');
    }

    if (error != null) {
      buffer.write(' | Error: $error');
    }

    return buffer.toString();
  }
}
