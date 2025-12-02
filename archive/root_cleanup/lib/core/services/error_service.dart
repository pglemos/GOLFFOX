import 'dart:async';

enum ErrorSeverity { info, warning, error }

class GxError {
  final String code;
  final String message;
  final ErrorSeverity severity;
  const GxError(this.code, this.message, this.severity);
}

class ErrorEvent {
  final Object error;
  final StackTrace stack;
  final String? context;
  final DateTime timestamp;
  ErrorEvent(this.error, this.stack, {this.context}) : timestamp = DateTime.now();
}

class ErrorService {
  static final ErrorService instance = ErrorService._();
  ErrorService._();

  final List<ErrorEvent> _history = [];

  GxError from(Object error) {
    if (error is TimeoutException) {
      return const GxError('timeout', 'Operation timed out', ErrorSeverity.warning);
    }
    return const GxError('unknown', 'Unknown error', ErrorSeverity.error);
  }

  Future<void> initialize() async {}

  Future<void> reportError(Object error, StackTrace stack, {String? context, Map<String, Object?>? additionalData}) async {
    _history.add(ErrorEvent(error, stack, context: context));
  }

  List<ErrorEvent> getErrorHistory() => List.unmodifiable(_history);

  Future<T> executeWithHandling<T>(Future<T> Function() op, {String? context}) async {
    try {
      return await op();
    } catch (e, st) {
      await reportError(e, st, context: context);
      rethrow;
    }
  }
}
