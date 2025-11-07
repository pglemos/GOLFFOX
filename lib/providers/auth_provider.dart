import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/user.dart' as app_user;
import '../services/auth_service.dart';

final authServiceProvider = Provider<AuthService>((ref) => AuthService());

final authStateProvider = StreamProvider<Session?>((ref) {
  final authService = ref.watch(authServiceProvider);
  return authService.sessionStream;
});

final currentUserProvider = FutureProvider<app_user.User?>((ref) async {
  final authService = ref.watch(authServiceProvider);
  final session = ref.watch(authStateProvider).asData?.value;
  if (session != null) {
    return authService.getCurrentUser();
  }
  return null;
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  final authState = ref.watch(authStateProvider);

  return authState.when(
    data: (session) {
      if (session == null) return false;
      final expiresAt = session.expiresAt;
      if (expiresAt != null) {
        final expires = DateTime.fromMillisecondsSinceEpoch(expiresAt * 1000);
        if (DateTime.now().isAfter(expires)) return false;
      }
      return true;
    },
    loading: () => false,
    error: (_, __) => false,
  );
});

final isFullyAuthenticatedProvider = FutureProvider<bool>((ref) async {
  final authenticated = ref.watch(isAuthenticatedProvider);
  if (!authenticated) return false;
  final user = await ref.watch(currentUserProvider.future);
  return user != null;
});

final tokenValidationProvider = FutureProvider<bool>((ref) async {
  final authService = ref.watch(authServiceProvider);
  try {
    return await authService.validateToken();
  } catch (_) {
    return false;
  }
});

class AuthNotifier extends StateNotifier<AsyncValue<app_user.User?>> {
  AuthNotifier(this._authService) : super(const AsyncValue.loading()) {
    _init();
  }

  final AuthService _authService;

  Future<void> _init() async {
    try {
      final user = await _authService.getCurrentUser();
      state = AsyncValue.data(user);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> signIn(
    BuildContext context,
    String email,
    String password,
  ) async {
    state = const AsyncValue.loading();
    try {
      final user = await _authService.signInWithEmail(
        context,
        email,
        password,
      );
      state = AsyncValue.data(user);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> signOut() async {
    try {
      await _authService.signOut();
      state = const AsyncValue.data(null);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> refresh() async {
    try {
      final user = await _authService.getCurrentUser();
      state = AsyncValue.data(user);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }
}

final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<app_user.User?>>((ref) {
  final authService = ref.watch(authServiceProvider);
  return AuthNotifier(authService);
});
