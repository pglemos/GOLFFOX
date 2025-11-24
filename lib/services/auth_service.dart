import 'package:golffox/models/user.dart' as app_user;
import 'package:golffox/services/supabase_service.dart';

enum AuthErrorCode {
  invalidCredentials,
  emailNotVerified,
  profileMissing,
  unknown
}

class AuthFailure implements Exception {
  final AuthErrorCode code;
  final String message;
  const AuthFailure(this.code, this.message);
  @override
  String toString() => 'AuthFailure($code): $message';
}

class AuthService {
  final SupabaseService supabaseService;
  AuthService({required this.supabaseService});

  Future<app_user.User> signInWithEmail(String email, String password) async {
    if (!email.contains('@')) {
      throw const AuthFailure(AuthErrorCode.unknown, 'invalid email');
    }
    if (password.length < 6) {
      throw const AuthFailure(AuthErrorCode.unknown, 'weak password');
    }
    final resp = await supabaseService.signInWithEmail(email, password);
    final user = resp.user;
    final session = resp.session;
    if (user == null) {
      throw const AuthFailure(
          AuthErrorCode.invalidCredentials, 'invalid credentials');
    }
    if (user.emailConfirmedAt == null) {
      throw const AuthFailure(
          AuthErrorCode.emailNotVerified, 'email not verified');
    }
    if (session == null) {
      throw const AuthFailure(
          AuthErrorCode.invalidCredentials, 'invalid credentials');
    }
    final profile = await supabaseService.getCurrentUserProfile();
    if (profile == null) {
      throw const AuthFailure(AuthErrorCode.profileMissing, 'profile missing');
    }
    return profile;
  }

  Future<void> signOut() async {
    await supabaseService.client.auth.signOut();
  }

  Future<void> deleteUser(dynamic context) async {
    throw UnimplementedError();
  }

  Future<app_user.User> createAccountWithEmail(
      dynamic context, String email, String password) async {
    // A criação de usuários continua sendo disparada pelos painéis (admin,
    // transportadora e operador); este método apenas executa o fluxo de
    // cadastro via e-mail quando solicitado por esses pontos de entrada.
    final resp = await supabaseService.client.auth
        .signUp(email: email, password: password);
    final createdUser = resp.user;
    final session = resp.session;

    if (createdUser == null) {
      throw const AuthFailure(AuthErrorCode.unknown, 'user creation failed');
    }

    final now = DateTime.now();
    final profile = app_user.User(
      id: createdUser.id,
      email: createdUser.email ?? email,
      role: 'user',
      name: createdUser.userMetadata?['name']?.toString(),
      createdAt: now,
      updatedAt: now,
    );

    final accessToken = session?.accessToken;
    final hasAccessToken = accessToken != null && accessToken.isNotEmpty;

    if (!hasAccessToken) {
      // Quando o fluxo de confirmacao de e-mail esta ativo (ou o Supabase nao
      // retorna access token), nao ha sessao imediata; o cliente nao possui
      // token para gravar o perfil. Retornamos o perfil gerado para que a UI
      // possa orientar o usuario sem falhar.
      return profile;
    }

    return supabaseService.upsertUserProfile(profile);
  }
}
