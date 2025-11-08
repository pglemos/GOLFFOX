import 'dart:async';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/theme/gf_tokens.dart';
import '../models/user.dart' as app_user;
import 'supabase_service.dart';

/// Codigos tipados para tratar erros no UI (snackbars, etc).
enum AuthErrorCode {
  invalidCredentials,
  emailNotVerified,
  profileMissing,
  network,
  rateLimited,
  unknown,
}

/// Excecao rica para a camada de apresentacao decidir mensagens/acoes.
class AuthFailure implements Exception {
  AuthFailure(this.code, this.message, [this.cause]);
  final AuthErrorCode code;
  final String message;
  final Object? cause;

  @override
  String toString() => 'AuthFailure($code): $message';
}

class AuthService {
  SupabaseService get _supabaseService => SupabaseService.instance;

  static const _timeout = Duration(seconds: 20);
  static const _propagateDelay = GfTokens.durationSlow;

  /// Assina com e-mail/senha + busca o perfil (com retry/backoff).
  Future<app_user.User?> signInWithEmail(
    String email,
    String password,
  ) async {
    try {
      _ensureEmailFormat(email);
      _ensurePasswordRules(password);

      final authResponse = await _supabaseService
          .signInWithEmail(email.trim(), password)
          .timeout(_timeout);

      final user = authResponse.user;
      final session = authResponse.session;

      if (user == null) {
        // Supabase nao retornou usuario => credenciais invalidas ou bloqueio.
        throw AuthFailure(AuthErrorCode.invalidCredentials,
            'Credenciais invalidas. Confira e tente novamente.');
      }

      // Caso comum: conta criada mas e-mail nao confirmado (session nula).
      if (session == null && user.emailConfirmedAt == null) {
        throw AuthFailure(
          AuthErrorCode.emailNotVerified,
          'Seu e-mail ainda nao foi confirmado. Verifique sua caixa de entrada.',
        );
      }

      // Aguarda a propagacao minima de sessao (web/mobile podem atrasar).
      await Future<void>.delayed(_propagateDelay);

      // Busca de perfil com retries (para evitar condicao de corrida com triggers/RLS).
      final profile = await _retry<app_user.User?>(
        () => _supabaseService.getCurrentUserProfile().timeout(_timeout),
        delays: [
          GfTokens.duration,
          GfTokens.durationSlow,
          GfTokens.durationSlower,
        ],
        until: (p) => p != null,
      );

      if (profile == null) {
        // Perfil nao esta pronto/ausente.
        throw AuthFailure(
          AuthErrorCode.profileMissing,
          'Perfil nao encontrado. Tente novamente em instantes ou contate o suporte.',
        );
      }

      return profile;
    } on AuthFailure {
      rethrow;
    } on AuthException catch (e) {
      // Excecoes do Supabase Auth (goTrue)
      throw _mapAuthException(e);
    } on TimeoutException catch (e) {
      throw AuthFailure(AuthErrorCode.network,
          'Tempo esgotado conectando ao servidor. Verifique sua internet.', e);
    } on PostgrestException catch (e) {
      // Erros de RLS/tabela ao buscar perfil.
      throw AuthFailure(
          AuthErrorCode.unknown, 'Falha ao acessar seus dados. (RLS/DB)', e);
    } on Object catch (error, stackTrace) {
      throw AuthFailure(AuthErrorCode.unknown, 'Falha no login: $error', error);
    }
  }

  /// Cria conta com e-mail/senha.
  /// Observacao: geralmente o Supabase enviara e-mail de verificacao
  /// e nao havera sessao imediata (depende da config). Mantemos o retorno `null`
  /// conforme sua implementacao original.
  Future<app_user.User?> createAccountWithEmail(
    BuildContext context,
    String email,
    String password,
  ) async {
    try {
      _ensureEmailFormat(email);
      _ensurePasswordRules(password);

      final authResponse = await _supabaseService.client.auth
          .signUp(email: email.trim(), password: password)
          .timeout(_timeout);

      if (authResponse.user == null) {
        throw AuthFailure(
            AuthErrorCode.unknown, 'Nao foi possivel criar a conta.');
      }

      // Retornamos null: UI deve instruir verificar o e-mail (fluxo de confirmacao).
      return null;
    } on AuthFailure {
      rethrow;
    } on AuthException catch (e) {
      throw _mapAuthException(e);
    } on TimeoutException catch (e) {
      throw AuthFailure(AuthErrorCode.network,
          'Tempo esgotado conectando ao servidor. Verifique sua internet.', e);
    } on Object catch (error, stackTrace) {
      throw AuthFailure(
        AuthErrorCode.unknown,
        'Falha ao criar conta: $error',
        error,
      );
    }
  }

  Future<void> signOut() async {
    await _supabaseService.client.auth.signOut();
  }

  Future<void> deleteUser(BuildContext context) async {
    // Dica: normalmente exige Service Role via edge function / backend.
    throw UnimplementedError(
        'Exclusao de usuario exige credenciais elevadas (service role).');
  }

  Future<void> updateEmail({
    required String email,
    required BuildContext context,
  }) async {
    try {
      _ensureEmailFormat(email);
      await _supabaseService.client.auth
          .updateUser(UserAttributes(email: email.trim()))
          .timeout(_timeout);
    } on AuthException catch (e) {
      throw _mapAuthException(e);
    } on TimeoutException catch (e) {
      throw AuthFailure(
          AuthErrorCode.network, 'Tempo esgotado conectando ao servidor.', e);
    } on Object catch (error, stackTrace) {
      throw AuthFailure(
        AuthErrorCode.unknown,
        'Falha ao atualizar e-mail: $error',
        error,
      );
    }
  }

  Future<void> resetPassword({
    required String email,
    required BuildContext context,
  }) async {
    try {
      _ensureEmailFormat(email);
      await _supabaseService.client.auth
          .resetPasswordForEmail(email.trim())
          .timeout(_timeout);
    } on AuthException catch (e) {
      throw _mapAuthException(e);
    } on TimeoutException catch (e) {
      throw AuthFailure(
          AuthErrorCode.network, 'Tempo esgotado conectando ao servidor.', e);
    } on Object catch (error, stackTrace) {
      throw AuthFailure(
        AuthErrorCode.unknown,
        'Falha ao enviar recuperacao: $error',
        error,
      );
    }
  }

  /// Recupera o perfil atual da tabela de usuarios (ja autenticado).
  Future<app_user.User?> getCurrentUser() async {
    try {
      return await _supabaseService.getCurrentUserProfile().timeout(_timeout);
    } on TimeoutException catch (error) {
      throw AuthFailure(
        AuthErrorCode.network,
        'Tempo esgotado ao carregar perfil.',
        error,
      );
    } on Object catch (error, stackTrace) {
      throw AuthFailure(
        AuthErrorCode.unknown,
        'Falha ao carregar perfil: $error',
        error,
      );
    }
  }

  /// Sessao presente e valida?
  Future<bool> get isAuthenticated async {
    try {
      final session = _supabaseService.client.auth.currentSession;
      if (session == null) return false;

      // Verificar se a sessao nao esta expirada
      final now = DateTime.now();
      final expiresAtTimestamp = session.expiresAt;
      if (expiresAtTimestamp == null) return false;

      final expiresAt =
          DateTime.fromMillisecondsSinceEpoch(expiresAtTimestamp * 1000);

      if (now.isAfter(expiresAt)) {
        // Sessao expirada, fazer logout automatico
        await signOut();
        return false;
      }

      return true;
    } on Exception {
      return false;
    }
  }

  /// ID do usuario autenticado (ou null).
  String? get currentUserId => _supabaseService.client.auth.currentUser?.id;

  /// Stream reativo de sessao - util para gates/guards.
  Stream<Session?> get sessionStream =>
      _supabaseService.client.auth.onAuthStateChange.map((e) => e.session);

  /// Verifica se o token e valido fazendo uma chamada real ao Supabase
  Future<bool> validateToken() async {
    try {
      final session = _supabaseService.client.auth.currentSession;
      if (session == null) return false;

      // Verificar se a sessao nao esta expirada
      final now = DateTime.now();
      final expiresAtTimestamp = session.expiresAt;
      if (expiresAtTimestamp == null) return false;

      final expiresAt =
          DateTime.fromMillisecondsSinceEpoch(expiresAtTimestamp * 1000);

      if (now.isAfter(expiresAt)) {
        await signOut();
        return false;
      }

      // Fazer uma chamada real ao Supabase para verificar se o token e valido
      await _supabaseService.client
          .from('users')
          .select('id')
          .limit(1)
          .timeout(_timeout);

      return true;
    } on Exception {
      // Se a chamada falhar, o token e invalido
      await signOut();
      return false;
    }
  }

  /* ===================== Helpers ===================== */

  void _ensureEmailFormat(String email) {
    final ok = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email.trim());
    if (!ok) {
      throw AuthFailure(AuthErrorCode.invalidCredentials, 'E-mail invalido.');
    }
  }

  void _ensurePasswordRules(String password) {
    if (password.isEmpty || password.length < 6) {
      throw AuthFailure(AuthErrorCode.invalidCredentials,
          'Senha deve ter ao menos 6 caracteres.');
    }
  }

  AuthFailure _mapAuthException(AuthException e) {
    final m = e.message.toLowerCase();
    if (m.contains('invalid login') || m.contains('invalid credentials')) {
      return AuthFailure(AuthErrorCode.invalidCredentials,
          'Credenciais invalidas. Confira e tente novamente.', e);
    }
    if (m.contains('email not confirmed') || m.contains('email not verified')) {
      return AuthFailure(AuthErrorCode.emailNotVerified,
          'Seu e-mail ainda nao foi confirmado.', e);
    }
    if (m.contains('too many') || m.contains('rate limit')) {
      return AuthFailure(AuthErrorCode.rateLimited,
          'Muitas tentativas. Aguarde um pouco e tente novamente.', e);
    }
    if (m.contains('network') || m.contains('timeout')) {
      return AuthFailure(AuthErrorCode.network,
          'Falha de conexao. Verifique sua internet.', e);
    }
    return AuthFailure(AuthErrorCode.unknown, e.message, e);
  }

  /// Retry generico com atrasos progressivos (ate condicao [until] ser satisfeita).
  Future<T> _retry<T>(
    Future<T> Function() op, {
    required List<Duration> delays,
    bool Function(T value)? until,
  }) async {
    var result = await op();
    if (until == null || until(result)) return result;

    for (final d in delays) {
      await Future<void>.delayed(d);
      result = await op();
      if (until(result)) return result;
    }
    return result;
  }
}
