import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/error_service.dart';
import '../supa/supa_env.dart';

/// Deprecated: use SupaClient/SupaEnv instead.
/// Mantido por compatibilidade, sem segredos hardcoded.
class SupabaseConfig {
  // Configurações do Supabase (via ambiente)
  static const String supabaseUrl = SupaEnv.supabaseUrl;
  static const String supabaseAnonKey = SupaEnv.supabaseAnonKey;

  static Future<void> initialize() async {
    if (kDebugMode) {
      debugPrint('[SupabaseConfig] Inicializando Supabase...');
    }

    // Verifica se já foi inicializado
    if (Supabase.instance.isInitialized) {
      if (kDebugMode) {
        debugPrint('[SupabaseConfig] Supabase já estava inicializado');
      }
      return;
    }

    if (supabaseUrl.isEmpty || supabaseAnonKey.isEmpty) {
      throw Exception('Supabase não configurado: defina SUPABASE_URL e SUPABASE_ANON_KEY');
    }

    try {
      await ErrorService.instance.withRetry<void>(
        () => Supabase.initialize(
          url: supabaseUrl,
          anonKey: supabaseAnonKey,
          debug: kDebugMode,
        ),
        context: 'supabase.initialize',
      );

      if (kDebugMode) {
        debugPrint('[SupabaseConfig] Supabase inicializado com sucesso');
      }
    } on Exception catch (e, stack) {
      await ErrorService.instance.reportError(
        e,
        stack,
        context: 'supabase.initialize',
      );
      rethrow;
    }
  }

  static SupabaseClient get client {
    if (!Supabase.instance.isInitialized) {
      throw Exception(
        'Supabase não inicializado. Chame SupabaseConfig.initialize() primeiro.',
      );
    }
    return Supabase.instance.client;
  }

  static GoTrueClient get auth {
    if (!Supabase.instance.isInitialized) {
      throw Exception(
        'Supabase não inicializado. Chame SupabaseConfig.initialize() primeiro.',
      );
    }
    return client.auth;
  }

  static bool get isConfigured => supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;

  static bool get isInitialized => Supabase.instance.isInitialized;

  /// Valida uma conexão mínima ao Supabase (checa sessão e acessa o endpoint de usuário)
  static Future<bool> validateConnection() async {
    if (!isInitialized) {
      if (kDebugMode) {
        debugPrint('[SupabaseConfig] Supabase não inicializado para validação');
      }
      return false;
    }
    try {
      // Tentativa simples de chamada que exige rede
      await auth.getUser();
      return true;
    } on AuthException catch (e, stack) {
      await ErrorService.instance.reportError(
        e,
        stack,
        context: 'supabase.validateConnection',
        additionalData: {'type': 'AuthException'},
        severity: ErrorSeverity.warning,
      );
      return false;
    } on Exception catch (e, stack) {
      await ErrorService.instance.reportError(
        e,
        stack,
        context: 'supabase.validateConnection',
        severity: ErrorSeverity.warning,
      );
      return false;
    } on Object catch (e, stack) {
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
    if (!isInitialized) {
      if (kDebugMode) {
        debugPrint('[SupabaseConfig] Supabase não inicializado para autenticação');
      }
      return;
    }
    try {
      final session = auth.currentSession;
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
    } on Object catch (e, stack) {
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
    if (!isInitialized) {
      throw Exception(
        'Supabase não inicializado. Chame SupabaseConfig.initialize() primeiro.',
      );
    }
    await ensureAuthenticated();
    final ok = await validateConnection();
    if (!ok) {
      throw Exception('Supabase indisponível no momento');
    }
  }
}
