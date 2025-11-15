import 'app_error.dart';

/// Utilitários para padronizar formatação de erros e metadados
class ErrorUtils {
  /// Formata uma mensagem de erro legível para logs e UI
  static String formatError(
    Object error, {
    String? context,
    Map<String, dynamic>? additionalData,
  }) =>
      () {
        final code = _extractCode(error);
        final message = _extractMessage(error);
        final ctx = context != null ? ' [ctx: $context]' : '';
        final meta = (additionalData == null || additionalData.isEmpty)
            ? ''
            : ' ${_safeMeta(additionalData)}';
        return '$code: $message$ctx$meta';
      }();

  /// Produz metadados padronizados de erro para analytics/crashlytics
  static Map<String, dynamic> getErrorMeta(
    Object error, {
    String? context,
    Map<String, dynamic>? additionalData,
  }) =>
      {
        'type': _typeOf(error),
        'code': _extractCode(error),
        'message': _extractMessage(error),
        'context': context,
        'timestamp': DateTime.now().toIso8601String(),
        if (additionalData != null) 'meta': _safeMeta(additionalData),
      };

  static String _typeOf(Object error) => error.runtimeType.toString();

  static String _extractCode(Object error) {
    if (error is AppError) return error.code ?? 'error.unknown';
    // Heurística simples para códigos em strings
    final s = error.toString();
    final m = RegExp(r'(\w+[.:]\w+)|([a-zA-Z_]+\d{3,})').firstMatch(s);
    return m?.group(0) ?? 'error.unknown';
  }

  static String _extractMessage(Object error) {
    if (error is AppError) return error.message;
    return error.toString();
  }

  static Map<String, dynamic> _safeMeta(Map<String, dynamic> meta) {
    // Remover campos possivelmente sensíveis
    const blacklist = ['password', 'token', 'secret', 'key', 'authorization'];
    final out = <String, dynamic>{};
    meta.forEach((k, v) {
      final l = k.toLowerCase();
      out[k] = blacklist.any(l.contains) ? '***' : v;
    });
    return out;
  }
}
