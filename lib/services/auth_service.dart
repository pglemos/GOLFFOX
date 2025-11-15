import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:golffox/models/user.dart' as app_user;
import 'package:golffox/services/supabase_service.dart';

enum AuthErrorCode { invalidCredentials, emailNotVerified, profileMissing, unknown }

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
      throw const AuthFailure(AuthErrorCode.invalidCredentials, 'invalid credentials');
    }
    if (user.emailConfirmedAt == null) {
      throw const AuthFailure(AuthErrorCode.emailNotVerified, 'email not verified');
    }
    if (session == null) {
      throw const AuthFailure(AuthErrorCode.invalidCredentials, 'invalid credentials');
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

  Future<dynamic> createAccountWithEmail(dynamic context, String email, String password) async {
    final resp = await supabaseService.client.auth.signUp(email: email, password: password);
    if (resp.user == null) {
      throw const AuthFailure(AuthErrorCode.unknown, 'user creation failed');
    }
    return null;
  }
}
