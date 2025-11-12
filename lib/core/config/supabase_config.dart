import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../supa/supa_env.dart';
import '../services/error_service.dart';

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

    await ErrorService.instance.withRetry<void>(
      () => Supabase.initialize(
        url: supabaseUrl,
        anonKey: supabaseAnonKey,
        debug: kDebugMode,
      ),
      maxAttempts: 3,
      delay: const Duration(seconds: 1),
      context: 'supabase.initialize',
    );

    if (kDebugMode) {
      debugPrint('[SupabaseConfig] Supabase inicializado com sucesso');
    }
  }

  static SupabaseClient get client => Supabase.instance.client;
  static GoTrueClient get auth => client.auth;

  static bool get isConfigured => supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;

  /// Valida uma conexão mínima ao Supabase (checa sessão e acessa o endpoint de usuário)
  static Future<bool> validateConnection() async {
    try {
      // Tentativa simples de chamada que exige rede
      await auth.getUser();
      return true;
    } on Exception catch (e, stack) {
      await ErrorService.instance.reportError(
        e,
        stack,
        context: 'supabase.validateConnection',
        severity: ErrorSeverity.warning,
      );
      return false;
    }
  }

  /// Garante que há sessão válida; tenta renovar tokens quando necessário
  static Future<void> ensureAuthenticated() async {
    try {
      final session = await auth.getSession();
      if (session == null) {
        // Nenhuma sessão: nada a renovar; aplicativos públicos podem seguir sem auth
        return;
      }
      // Tenta renovar sessão (caso expirada ou próxima do vencimento)
      await auth.refreshSession();
    } on AuthException catch (e, stack) {
      await ErrorService.instance.reportError(
        e,
        stack,
        context: 'supabase.ensureAuthenticated',
        additionalData: {'type': 'AuthException'},
        severity: ErrorSeverity.warning,
      );
      rethrow;
    } on Exception catch (e, stack) {
      await ErrorService.instance.reportError(
        e,
        stack,
        context: 'supabase.ensureAuthenticated',
        severity: ErrorSeverity.warning,
      );
      rethrow;
    }
  }

  /// Verifica se o Supabase está pronto antes de operações críticas
  static Future<void> checkReadyOrThrow() async {
    if (!isConfigured) {
      throw Exception('Supabase não configurado');
    }
    await ensureAuthenticated();
    final ok = await validateConnection();
    if (!ok) {
      throw Exception('Supabase indisponível no momento');
    }
  }
}
