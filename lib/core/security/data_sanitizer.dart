import 'dart:convert';

/// Sistema de sanitização de dados
class DataSanitizer {
  // Caracteres perigosos que devem ser escapados
  static const Map<String, String> _htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  // Padrões de SQL injection
  static final List<RegExp> _sqlInjectionPatterns = [
    RegExp(r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)', caseSensitive: false),
    RegExp(r'(--|#|/\*|\*/)', caseSensitive: false),
    RegExp(r'(\b(OR|AND)\s+\d+\s*=\s*\d+)', caseSensitive: false),
    RegExp(r'(\b(OR|AND)\s+[\'\"]?\w+[\'\"]?\s*=\s*[\'\"]?\w+[\'\"]?)', caseSensitive: false),
    RegExp(r'(UNION\s+SELECT)', caseSensitive: false),
    RegExp(r'(;\s*(DROP|DELETE|INSERT|UPDATE))', caseSensitive: false),
  ];

  // Padrões de XSS
  static final List<RegExp> _xssPatterns = [
    RegExp('<script[^>]*>.*?</script>', caseSensitive: false, dotAll: true),
    RegExp('javascript:', caseSensitive: false),
    RegExp(r'on\w+\s*=', caseSensitive: false),
    RegExp('<iframe[^>]*>.*?</iframe>', caseSensitive: false, dotAll: true),
    RegExp('<object[^>]*>.*?</object>', caseSensitive: false, dotAll: true),
    RegExp('<embed[^>]*>', caseSensitive: false),
    RegExp('<link[^>]*>', caseSensitive: false),
    RegExp('<meta[^>]*>', caseSensitive: false),
    RegExp('vbscript:', caseSensitive: false),
    RegExp('data:text/html', caseSensitive: false),
  ];

  // Padrões de path traversal
  static final List<RegExp> _pathTraversalPatterns = [
    RegExp(r'\.\./'),
    RegExp(r'\.\.\\'),
    RegExp('%2e%2e%2f', caseSensitive: false),
    RegExp('%2e%2e%5c', caseSensitive: false),
    RegExp(r'\.\.%2f', caseSensitive: false),
    RegExp(r'\.\.%5c', caseSensitive: false),
  ];

  /// Sanitiza texto removendo caracteres perigosos
  static String sanitizeText(String? input) {
    if (input == null || input.isEmpty) return '';

    var sanitized = input;

    // Escape HTML entities
    _htmlEntities.forEach((char, entity) {
      sanitized = sanitized.replaceAll(char, entity);
    });

    return sanitized;
  }

  /// Sanitiza HTML removendo tags perigosas
  static String sanitizeHtml(String? input) {
    if (input == null || input.isEmpty) return '';

    var sanitized = input;

    for (final pattern in _xssPatterns) {
      sanitized = sanitized.replaceAll(pattern, '');
    }

    return sanitizeText(sanitized);
  }

  /// Sanitiza entrada para prevenir SQL injection
  static String sanitizeSql(String? input) {
    if (input == null || input.isEmpty) return '';

    var sanitized = input.trim();

    for (final pattern in _sqlInjectionPatterns) {
      sanitized = sanitized.replaceAll(pattern, '');
    }

    // Escape aspas
    sanitized = sanitized.replaceAll("'", "''");
    sanitized = sanitized.replaceAll('"', '""');

    return sanitized;
  }

  /// Sanitiza path para prevenir path traversal
  static String sanitizePath(String? input) {
    if (input == null || input.isEmpty) return '';

    var sanitized = input;

    for (final pattern in _pathTraversalPatterns) {
      sanitized = sanitized.replaceAll(pattern, '');
    }

    // Remove caracteres perigosos em paths
    sanitized = sanitized.replaceAll(RegExp('[<>:"|?*]'), '');
    // Normaliza separadores
    sanitized = sanitized.replaceAll(RegExp(r'[/\\]+'), '/');

    return sanitized;
  }

  /// Sanitiza nome de arquivo
  static String sanitizeFileName(String? input) {
    if (input == null || input.isEmpty) return '';

    var sanitized = input.trim();

    // Remove caracteres perigosos
    sanitized = sanitized.replaceAll(RegExp(r'[<>:"/\\|?*]'), '');

    // Remove pontos no início e fim
    sanitized = sanitized.replaceAll(RegExp(r'^\.+'), '');
    sanitized = sanitized.replaceAll(RegExp(r'\.+$'), '');

    return sanitized;
  }

  /// Sanitiza email
  static String sanitizeEmail(String? input) {
    if (input == null || input.isEmpty) return '';
    return input.trim().toLowerCase();
  }

  /// Sanitiza telefone
  static String sanitizePhone(String? input) {
    if (input == null || input.isEmpty) return '';
    return input.replaceAll(RegExp('[^0-9+]'), '');
  }

  /// Sanitiza URL
  static String sanitizeUrl(String? input) {
    if (input == null || input.isEmpty) return '';
    return input.trim();
  }

  /// Sanitiza JSON recursivamente
  static Map<String, dynamic> sanitizeJson(Map<String, dynamic>? input) {
    if (input == null) return {};
    final result = <String, dynamic>{};
    input.forEach((key, value) {
      final k = sanitizeText(key);
      if (value is String) {
        result[k] = sanitizeText(value);
      } else if (value is Map<String, dynamic>) {
        result[k] = sanitizeJson(value);
      } else if (value is List) {
        result[k] = value.map((e) => e is String ? sanitizeText(e) : e).toList();
      } else {
        result[k] = value;
      }
    });
    return result;
  }

  /// Verifica se contém padrões perigosos
  static bool containsDangerousPatterns(String? input) {
    if (input == null || input.isEmpty) return false;

    for (final pattern in _sqlInjectionPatterns) {
      if (pattern.hasMatch(input)) return true;
    }
    for (final pattern in _xssPatterns) {
      if (pattern.hasMatch(input)) return true;
    }
    for (final pattern in _pathTraversalPatterns) {
      if (pattern.hasMatch(input)) return true;
    }
    return false;
  }

  /// Sanitiza entrada baseada no tipo
  static dynamic sanitizeByType(input, SanitizationType type) {
    if (input == null) return null;
    switch (type) {
      case SanitizationType.text:
        return sanitizeText(input.toString());
      case SanitizationType.html:
        return sanitizeHtml(input.toString());
      case SanitizationType.sql:
        return sanitizeSql(input.toString());
      case SanitizationType.path:
        return sanitizePath(input.toString());
      case SanitizationType.fileName:
        return sanitizeFileName(input.toString());
      case SanitizationType.email:
        return sanitizeEmail(input.toString());
      case SanitizationType.phone:
        return sanitizePhone(input.toString());
      case SanitizationType.url:
        return sanitizeUrl(input.toString());
      case SanitizationType.json:
        if (input is Map<String, dynamic>) {
          return sanitizeJson(input);
        } else if (input is String) {
          try {
            final decoded = jsonDecode(input);
            if (decoded is Map<String, dynamic>) {
              return sanitizeJson(decoded);
            }
            // Not a JSON object, sanitize as text
            return sanitizeText(input);
          } catch (e) {
            return sanitizeText(input);
          }
        }
        return input;
    }
  }

  /// Remove caracteres de controle
  static String removeControlCharacters(String? input) {
    if (input == null || input.isEmpty) return '';
    // Remove caracteres de controle (exceto \n, \r, \t)
    return input.replaceAll(RegExp(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]'), '');
  }

  /// Normaliza espaços em branco
  static String normalizeWhitespace(String? input) {
    if (input == null || input.isEmpty) return '';
    return input.replaceAll(RegExp(r'\s+'), ' ').trim();
  }

  /// Trunca texto mantendo palavras completas
  static String truncateText(String? input, int maxLength) {
    if (input == null || input.isEmpty) return '';
    if (input.length <= maxLength) return input;
    final truncated = input.substring(0, maxLength);
    final lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      return '${truncated.substring(0, lastSpace)}...';
    }
    return '$truncated...';
  }
}

/// Tipos de sanitização
enum SanitizationType {
  text,
  html,
  sql,
  path,
  fileName,
  email,
  phone,
  url,
  json,
}

/// Mixin para facilitar sanitização
mixin SanitizerMixin {
  /// Sanitiza texto
  String sanitizeText(String? input) => DataSanitizer.sanitizeText(input);

  /// Sanitiza HTML
  String sanitizeHtml(String? input) => DataSanitizer.sanitizeHtml(input);

  /// Sanitiza SQL
  String sanitizeSql(String? input) => DataSanitizer.sanitizeSql(input);

  /// Sanitiza path
  String sanitizePath(String? input) => DataSanitizer.sanitizePath(input);

  /// Sanitiza nome de arquivo
  String sanitizeFileName(String? input) => DataSanitizer.sanitizeFileName(input);

  /// Sanitiza email
  String sanitizeEmail(String? input) => DataSanitizer.sanitizeEmail(input);

  /// Sanitiza telefone
  String sanitizePhone(String? input) => DataSanitizer.sanitizePhone(input);

  /// Sanitiza URL
  String sanitizeUrl(String? input) => DataSanitizer.sanitizeUrl(input);

  /// Sanitiza JSON
  Map<String, dynamic> sanitizeJson(Map<String, dynamic>? input) => DataSanitizer.sanitizeJson(input);

  /// Verifica padrões perigosos
  bool containsDangerousPatterns(String? input) => DataSanitizer.containsDangerousPatterns(input);
}
