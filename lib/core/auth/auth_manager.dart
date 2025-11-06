import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../domain/user_role.dart';
import '../services/logger_service.dart';
import '../services/error_service.dart';
import '../../services/supabase_service.dart';

/// Comprehensive authentication manager for GolfFox
///
/// Features:
/// - Authentication state management
/// - User profile management
/// - Role-based access control
/// - Session persistence
/// - Automatic token refresh
class AuthManager extends ChangeNotifier {
  AuthManager._();
  static AuthManager? _instance;
  static AuthManager get instance => _instance ??= AuthManager._();

  final _logger = LoggerService.instance;
  final _errorService = ErrorService.instance;

  // Lazy getter para evitar inicialização prematura
  SupabaseService get _supabase => SupabaseService.instance;

  StreamSubscription<AuthState>? _authSubscription;
  UserProfile? _currentUserProfile;
  bool _isInitialized = false;

  /// Initialize the auth manager
  Future<void> initialize() async {
    if (_isInitialized) return;

    _logger.info(' Initializing AuthManager...');

    // Listen to auth state changes
    _authSubscription = _supabase.auth.onAuthStateChange.listen(
      _handleAuthStateChange,
      onError: (Object error) {
        _logger.error('Auth state change error', error);
        _errorService.reportError(error, StackTrace.current);
      },
    );

    // Load current user profile if authenticated
    if (isAuthenticated) {
      await _loadUserProfile();
    }

    _isInitialized = true;
    _logger.info(' AuthManager initialized');
  }

  /// Check if user is authenticated
  bool get isAuthenticated => _supabase.isAuthenticated;

  /// Get current session
  Session? get currentSession => _supabase.currentSession;

  /// Get current user
  User? get currentUser => _supabase.currentUser;

  /// Get current user ID
  String? get currentUserId => _supabase.currentUserId;

  /// Get current user profile
  UserProfile? get currentUserProfile => _currentUserProfile;

  /// Get current user role
  UserRole? get currentUserRole => _currentUserProfile?.role;

  /// Sign in with email and password
  Future<AuthResult> signInWithPassword({
    required String email,
    required String password,
  }) async {
    try {
      _logger.info(' Signing in user: $email');

      final response = await _supabase.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user != null) {
        await _loadUserProfile();
        _logger.success(' User signed in successfully');

        return AuthResult.success(
          user: response.user!,
          profile: _currentUserProfile,
        );
      } else {
        throw Exception('Sign in failed: No user returned');
      }
    } catch (error) {
      _logger.error(' Sign in failed', error);
      final gxError = await _errorService.handleSupabaseError(error);
      return AuthResult.failure(gxError);
    }
  }

  /// Sign up with email and password
  Future<AuthResult> signUp({
    required String email,
    required String password,
    required String fullName,
    UserRole role = UserRole.passenger,
    Map<String, dynamic>? additionalData,
  }) async {
    try {
      _logger.info(' Signing up user: $email');

      final response = await _supabase.signUp(
        email: email,
        password: password,
        data: {
          'full_name': fullName,
          'role': role.name,
          ...?additionalData,
        },
      );

      if (response.user != null) {
        // Create user profile
        await _createUserProfile(
          userId: response.user!.id,
          email: email,
          fullName: fullName,
          role: role,
          additionalData: additionalData,
        );

        await _loadUserProfile();
        _logger.success(' User signed up successfully');

        return AuthResult.success(
          user: response.user!,
          profile: _currentUserProfile,
        );
      } else {
        throw Exception('Sign up failed: No user returned');
      }
    } catch (error) {
      _logger.error(' Sign up failed', error);
      final gxError = await _errorService.handleSupabaseError(error);
      return AuthResult.failure(gxError);
    }
  }

  /// Sign out
  Future<void> signOut() async {
    try {
      _logger.info(' Signing out user');

      await _supabase.signOut();
      _currentUserProfile = null;

      _logger.success(' User signed out successfully');
    } catch (error) {
      _logger.error(' Sign out failed', error);
      await _errorService.handleSupabaseError(error);
      rethrow;
    }
  }

  /// Reset password
  Future<void> resetPassword(String email) async {
    try {
      _logger.info(' Resetting password for: $email');

      await _supabase.resetPassword(email);

      _logger.success(' Password reset email sent');
    } catch (error) {
      _logger.error(' Password reset failed', error);
      await _errorService.handleSupabaseError(error);
      rethrow;
    }
  }

  /// Update user profile
  Future<void> updateProfile(Map<String, dynamic> updates) async {
    if (!isAuthenticated || currentUserId == null) {
      throw Exception('User not authenticated');
    }

    final userId = currentUserId;
    if (userId == null) {
      throw Exception('User ID is null');
    }

    try {
      _logger.info('🔄 Updating user profile');

      final updatedProfile = await _supabase.update(
        'users',
        updates,
        filter: 'id=$userId',
      );

      _currentUserProfile = UserProfile.fromJson(updatedProfile);
      notifyListeners();

      _logger.success(' Profile updated successfully');
    } catch (error) {
      _logger.error(' Profile update failed', error);
      await _errorService.handleSupabaseError(error);
      rethrow;
    }
  }

  /// Check if user has required role
  bool hasRole(UserRole requiredRole) => currentUserRole == requiredRole;

  /// Check if user has any of the required roles
  bool hasAnyRole(List<UserRole> requiredRoles) => currentUserRole != null && requiredRoles.contains(currentUserRole);

  /// Check if user has operator privileges
  bool get isOperator => hasRole(UserRole.operator);

  // Private methods

  void _handleAuthStateChange(AuthState authState) {
    _logger.debug('Auth state changed: ${authState.event}');

    switch (authState.event) {
      case AuthChangeEvent.signedIn:
        _loadUserProfile();
        break;
      case AuthChangeEvent.signedOut:
        _currentUserProfile = null;
        break;
      case AuthChangeEvent.tokenRefreshed:
        _logger.debug('Token refreshed');
        break;
      default:
        break;
    }

    notifyListeners();
  }

  Future<void> _loadUserProfile() async {
    if (!isAuthenticated || currentUserId == null) return;

    try {
      _logger.info('🔍 Loading user profile for ID: $currentUserId');

      // Load current user profile from SupabaseService
      final userProfile = await SupabaseService.instance
          .getCurrentUserProfile();

      if (userProfile != null) {
        _logger.info('📋 Profile data: ${userProfile.toJson()}');
        _currentUserProfile = UserProfile(
          id: userProfile.id,
          email: userProfile.email,
          fullName: userProfile.name,
          role: parseRole(userProfile.role) ?? UserRole.passenger,
          createdAt: userProfile.createdAt,
          updatedAt: userProfile.updatedAt,
        );
        _logger.info(
            '✅ User profile loaded: ${_currentUserProfile?.email} with role: ${_currentUserProfile?.role}');
      } else {
        _logger.warning(' No user profile found for user: $currentUserId');
        _logger.info(' Creating user profile automatically...');

        // Get user info from auth.users
        final currentUser = _supabase.currentUser;
        if (currentUser != null) {
          // Determine role based on email
          var role = UserRole.passenger; // default
          if (currentUser.email?.contains('operador') ?? false ||
              currentUser.email?.contains('operator') ?? false) {
            role = UserRole.operator;
          } else if (currentUser.email?.contains('transportadora') ?? false ||
              currentUser.email?.contains('carrier') ?? false) {
            role = UserRole.carrier;
          } else if (currentUser.email?.contains('motorista') ?? false ||
              currentUser.email?.contains('driver') ?? false) {
            role = UserRole.driver;
          }

          await _createUserProfile(
            userId: currentUser.id,
            email: currentUser.email ?? '',
            fullName: (currentUser.userMetadata?['full_name'] as String?) ??
                currentUser.email ??
                'User',
            role: role,
          );

          // Reload profile after creation
          await _loadUserProfile();
        }
      }
    } catch (error) {
      _logger.error(' Failed to load user profile', error);
      await _errorService.handleSupabaseError(error);
    }
  }

  Future<void> _createUserProfile({
    required String userId,
    required String email,
    required String fullName,
    required UserRole role,
    Map<String, dynamic>? additionalData,
  }) async {
    try {
      await _supabase.insert('users', {
        'id': userId,
        'email': email,
        'role': role.name,
        'created_at': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
        ...?additionalData,
      });

      _logger.debug('User profile created for: $email');
    } catch (error) {
      _logger.error('Failed to create user profile', error);
      rethrow;
    }
  }

  /// Dispose resources
  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }
}

/// User profile model
class UserProfile {

  const UserProfile({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.createdAt,
    required this.updatedAt,
    this.metadata,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      email: json['email'] as String,
      fullName: (json['full_name'] as String?) ?? (json['email'] as String),
      role: parseRole(json['role'] as String?) ?? UserRole.passenger,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }
  final String id;
  final String email;
  final String fullName;
  final UserRole role;
  final DateTime createdAt;
  final DateTime updatedAt;
  final Map<String, dynamic>? metadata;

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'full_name': fullName,
        'role': role.name,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
        'metadata': metadata,
      };
}

/// Authentication result
class AuthResult {

  const AuthResult._({
    required this.isSuccess,
    this.user,
    this.profile,
    this.error,
  });

  factory AuthResult.success({
    required User user,
    UserProfile? profile,
  }) {
    return AuthResult._(
      isSuccess: true,
      user: user,
      profile: profile,
    );
  }

  factory AuthResult.failure(GxError error) {
    return AuthResult._(
      isSuccess: false,
      error: error,
    );
  }
  final bool isSuccess;
  final User? user;
  final UserProfile? profile;
  final GxError? error;
}
