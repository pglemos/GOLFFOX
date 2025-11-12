import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../supa/supa_env.dart';

/// Deprecated: use SupaClient/SupaEnv instead.
/// Mantido por compatibilidade, sem segredos hardcoded.
class SupabaseConfig {
  // Configurações do Supabase (via ambiente)
  static final String supabaseUrl = SupaEnv.supabaseUrl;
  static final String supabaseAnonKey = SupaEnv.supabaseAnonKey;

  static Future<void> initialize() async {
    if (kDebugMode) {
      debugPrint('[SupabaseConfig] Inicializando Supabase...');
    }

    if (supabaseUrl.isEmpty || supabaseAnonKey.isEmpty) {
      throw Exception('Supabase não configurado: defina SUPABASE_URL e SUPABASE_ANON_KEY');
    }

    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      debug: kDebugMode,
    );

    if (kDebugMode) {
      debugPrint('[SupabaseConfig] Supabase inicializado com sucesso');
    }
  }

  static SupabaseClient get client => Supabase.instance.client;
  static GoTrueClient get auth => client.auth;

  static bool get isConfigured => supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;
}
