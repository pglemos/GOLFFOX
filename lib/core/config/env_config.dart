import 'package:flutter/foundation.dart';

/// Secure environment configuration for GolfFox
///
/// Usage:
/// ```bash
/// flutter run -d chrome --web-port 8080 \
///   --dart-define=SUPABASE_URL=your_url \
///   --dart-define=SUPABASE_ANON_KEY=your_key \
///   --dart-define=ENVIRONMENT=development
/// ```
class EnvConfig {
  // Supabase Configuration
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  // Environment Configuration
  static const String environment = String.fromEnvironment(
    'ENVIRONMENT',
    defaultValue: 'development',
  );

  // App Configuration
  static const String appName = String.fromEnvironment(
    'APP_NAME',
    defaultValue: 'GolfFox',
  );

  static const String appVersion = String.fromEnvironment(
    'APP_VERSION',
    defaultValue: '1.0.0',
  );

  // Feature Flags
  static const bool enableAnalytics = bool.fromEnvironment(
    'ENABLE_ANALYTICS',
  );

  static const bool enableCrashlytics = bool.fromEnvironment(
    'ENABLE_CRASHLYTICS',
  );

  // Development Configuration
  static const bool enableDebugLogs = bool.fromEnvironment(
    'ENABLE_DEBUG_LOGS',
    defaultValue: kDebugMode,
  );

  static const int webPort = int.fromEnvironment(
    'WEB_PORT',
    defaultValue: 60788,
  );

  // Validation
  static bool get isValidConfig => supabaseUrl.isNotEmpty &&
        supabaseAnonKey.isNotEmpty &&
        _isValidUrl(supabaseUrl);

  static bool get isDevelopment => environment == 'development';
  static bool get isProduction => environment == 'production';
  static bool get isStaging => environment == 'staging';

  // Private helpers
  static bool _isValidUrl(String url) {
    try {
      final uri = Uri.parse(url);
      return uri.hasScheme && uri.hasAuthority;
    } on FormatException {
      return false;
    }
  }

  // Debug information (safe for logging)
  static Map<String, dynamic> get debugInfo => {
        'environment': environment,
        'appName': appName,
        'appVersion': appVersion,
        'webPort': webPort,
        'hasSupabaseUrl': supabaseUrl.isNotEmpty,
        'hasSupabaseKey': supabaseAnonKey.isNotEmpty,
        'enableAnalytics': enableAnalytics,
        'enableCrashlytics': enableCrashlytics,
        'enableDebugLogs': enableDebugLogs,
        'isValidConfig': isValidConfig,
      };

  // Masked URL for safe logging
  static String get maskedSupabaseUrl {
    if (supabaseUrl.isEmpty) return 'NOT_SET';
    if (supabaseUrl.length <= 20) return '***';
    return '${supabaseUrl.substring(0, 20)}***';
  }
}
