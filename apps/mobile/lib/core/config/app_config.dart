import 'package:flutter/foundation.dart';

/// Configurações centralizadas da aplicação
class AppConfig {
  // Configurações de API
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: kDebugMode ? 'http://localhost:3000/api' : 'https://api.golffox.com',
  );

  static const int apiTimeout = int.fromEnvironment(
    'API_TIMEOUT',
    defaultValue: 30000,
  );

  // Configurações de Upload
  static const int maxFileSize = int.fromEnvironment(
    'MAX_FILE_SIZE',
    defaultValue: 10485760, // 10MB
  );

  static const List<String> allowedFileTypes = [
    'jpg', 'jpeg', 'png', 'pdf'
  ];

  // Configurações de Mapas
  static const String googleMapsApiKey = String.fromEnvironment(
    'GOOGLE_MAPS_API_KEY',
  );

  static const String mapboxAccessToken = String.fromEnvironment(
    'MAPBOX_ACCESS_TOKEN',
  );

  // Configurações de Debug
  static const bool debugMode = bool.fromEnvironment(
    'DEBUG_MODE',
    defaultValue: kDebugMode,
  );

  // Configurações de Rate Limiting
  static const bool rateLimitEnabled = bool.fromEnvironment(
    'RATE_LIMIT_ENABLED',
    defaultValue: true,
  );
  static const int rateLimitWindow = int.fromEnvironment(
    'RATE_LIMIT_WINDOW',
    defaultValue: 900000, // 15 minutos
  );

  static const int rateLimitMax = int.fromEnvironment(
    'RATE_LIMIT_MAX',
    defaultValue: 100,
  );

  // Configurações de Segurança
  static const String corsOrigin = String.fromEnvironment(
    'CORS_ORIGIN',
    defaultValue: kDebugMode ? 'http://localhost:8000' : 'https://golffox.com',
  );

  // Validações
  static bool get isApiConfigured => apiBaseUrl.isNotEmpty;
  static bool get isMapsConfigured => googleMapsApiKey.isNotEmpty || mapboxAccessToken.isNotEmpty;

  /// Valida se todas as configurações essenciais estão presentes
  static bool validateConfig() {
    final missingConfigs = <String>[];

    if (!isApiConfigured) {
      missingConfigs.add('API_BASE_URL');
    }

    if (missingConfigs.isNotEmpty) {
      if (debugMode) {
        debugPrint('⚠️ Configurações ausentes: ${missingConfigs.join(', ')}');
      }
      return false;
    }

    return true;
  }

  /// Retorna informações de configuração para debug
  static Map<String, dynamic> getDebugInfo() {
    if (!debugMode) return {};

    return {
      'apiBaseUrl': apiBaseUrl,
      'apiTimeout': apiTimeout,
      'maxFileSize': maxFileSize,
      'allowedFileTypes': allowedFileTypes,
      'isApiConfigured': isApiConfigured,
      'isMapsConfigured': isMapsConfigured,
      'debugMode': debugMode,
    };
  }
}