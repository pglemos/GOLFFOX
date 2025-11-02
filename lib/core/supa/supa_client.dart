import 'package:supabase_flutter/supabase_flutter.dart';

import 'supa_env.dart';

class SupaClient {
  static bool _initialized = false;

  static Future<void> initialize() async {
    if (_initialized) return;

    if (!SupaEnv.isConfigured) {
      throw Exception(
          'Supabase nao configurado: ${SupaEnv.configurationError}');
    }

    await Supabase.initialize(
      url: SupaEnv.supabaseUrl,
      anonKey: SupaEnv.supabaseAnonKey,
      debug: false,
    );

    _initialized = true;
  }

  static SupabaseClient get instance {
    if (!_initialized) {
      throw Exception(
          'Supabase nao inicializado. Chame SupaClient.initialize() primeiro.');
    }
    return Supabase.instance.client;
  }

  static bool get isInitialized => _initialized;

  static Future<bool> testConnection() async {
    try {
      final response = await instance.from('companies').select('id').limit(1);
      return response.isNotEmpty || response.isEmpty;
    } catch (e) {
      return false;
    }
  }

  static Map<String, dynamic> get status => {
        'initialized': _initialized,
        'configured': SupaEnv.isConfigured,
        'environment': SupaEnv.debugInfo,
      };
}
