import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golffox/models/user.dart' as app_user;
import 'package:golffox/services/auth_service.dart';
import 'package:golffox/services/supabase_service.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'auth_service_test.mocks.dart';

// Generate mocks
@GenerateMocks([SupabaseService, SupabaseClient, GoTrueClient, AuthResponse, User, Session])
void main() {
  group('AuthService Tests', () {
    late AuthService authService;
    late MockSupabaseService mockSupabaseService;
    late MockSupabaseClient mockSupabaseClient;
    late BuildContext mockContext;

    setUp(() {
      mockSupabaseService = MockSupabaseService();
      mockSupabaseClient = MockSupabaseClient();
      mockContext = MockBuildContext();
      
      authService = AuthService();
    });

    group('signInWithEmail', () {
      test('should return user profile on successful login', () async {
        // Arrange
        const email = 'test@example.com';
        const password = 'password123';
        
        final mockUser = MockUser();
        final mockSession = MockSession();
        final mockAuthResponse = MockAuthResponse();
        final mockProfile = app_user.User(
          id: '123',
          email: email,
          role: 'passenger',
          name: 'Test User',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        when(mockAuthResponse.user).thenReturn(mockUser);
        when(mockAuthResponse.session).thenReturn(mockSession);
        when(mockUser.emailConfirmedAt).thenReturn(DateTime.now().toIso8601String());
        
        when(mockSupabaseService.signInWithEmail(email, password))
            .thenAnswer((_) async => mockAuthResponse);
        when(mockSupabaseService.getCurrentUserProfile())
            .thenAnswer((_) async => mockProfile);

        // Act
        final result = await authService.signInWithEmail(mockContext, email, password);

        // Assert
        expect(result, equals(mockProfile));
        verify(mockSupabaseService.signInWithEmail(email, password)).called(1);
        verify(mockSupabaseService.getCurrentUserProfile()).called(1);
      });

      test('should throw AuthFailure with invalidCredentials when user is null', () async {
        // Arrange
        const email = 'test@example.com';
        const password = 'wrongpassword';
        
        final mockAuthResponse = MockAuthResponse();
        when(mockAuthResponse.user).thenReturn(null);
        
        when(mockSupabaseService.signInWithEmail(email, password))
            .thenAnswer((_) async => mockAuthResponse);

        // Act & Assert
        expect(
          () => authService.signInWithEmail(mockContext, email, password),
          throwsA(isA<AuthFailure>().having(
            (e) => e.code,
            'code',
            AuthErrorCode.invalidCredentials,
          )),
        );
      });

      test('should throw AuthFailure with emailNotVerified when email not confirmed', () async {
        // Arrange
        const email = 'test@example.com';
        const password = 'password123';
        
        final mockUser = MockUser();
        final mockAuthResponse = MockAuthResponse();
        
        when(mockAuthResponse.user).thenReturn(mockUser);
        when(mockAuthResponse.session).thenReturn(null);
        when(mockUser.emailConfirmedAt).thenReturn(null);
        
        when(mockSupabaseService.signInWithEmail(email, password))
            .thenAnswer((_) async => mockAuthResponse);

        // Act & Assert
        expect(
          () => authService.signInWithEmail(mockContext, email, password),
          throwsA(isA<AuthFailure>().having(
            (e) => e.code,
            'code',
            AuthErrorCode.emailNotVerified,
          )),
        );
      });

      test('should throw AuthFailure with profileMissing when profile is null', () async {
        // Arrange
        const email = 'test@example.com';
        const password = 'password123';
        
        final mockUser = MockUser();
        final mockSession = MockSession();
        final mockAuthResponse = MockAuthResponse();

        when(mockAuthResponse.user).thenReturn(mockUser);
        when(mockAuthResponse.session).thenReturn(mockSession);
        when(mockUser.emailConfirmedAt).thenReturn(DateTime.now().toIso8601String());
        
        when(mockSupabaseService.signInWithEmail(email, password))
            .thenAnswer((_) async => mockAuthResponse);
        when(mockSupabaseService.getCurrentUserProfile())
            .thenAnswer((_) async => null);

        // Act & Assert
        expect(
          () => authService.signInWithEmail(mockContext, email, password),
          throwsA(isA<AuthFailure>().having(
            (e) => e.code,
            'code',
            AuthErrorCode.profileMissing,
          )),
        );
      });

      test('should validate email format', () async {
        // Arrange
        const invalidEmail = 'invalid-email';
        const password = 'password123';

        // Act & Assert
        expect(
          () => authService.signInWithEmail(mockContext, invalidEmail, password),
          throwsA(isA<AuthFailure>()),
        );
      });

      test('should validate password rules', () async {
        // Arrange
        const email = 'test@example.com';
        const weakPassword = '123'; // Too short

        // Act & Assert
        expect(
          () => authService.signInWithEmail(mockContext, email, weakPassword),
          throwsA(isA<AuthFailure>()),
        );
      });
    });

    group('createAccountWithEmail', () {
      test('should return null on successful account creation', () async {
        // Arrange
        const email = 'newuser@example.com';
        const password = 'password123';
        
        final mockUser = MockUser();
        final mockAuthResponse = MockAuthResponse();
        when(mockAuthResponse.user).thenReturn(mockUser);
        
        when(mockSupabaseClient.auth.signUp(email: email, password: password))
            .thenAnswer((_) async => mockAuthResponse);

        // Act
        final result = await authService.createAccountWithEmail(mockContext, email, password);

        // Assert
        expect(result, isNull);
        verify(mockSupabaseClient.auth.signUp(email: email, password: password)).called(1);
      });

      test('should throw AuthFailure when user creation fails', () async {
        // Arrange
        const email = 'newuser@example.com';
        const password = 'password123';
        
        final mockAuthResponse = MockAuthResponse();
        when(mockAuthResponse.user).thenReturn(null);
        
        when(mockSupabaseClient.auth.signUp(email: email, password: password))
            .thenAnswer((_) async => mockAuthResponse);

        // Act & Assert
        expect(
          () => authService.createAccountWithEmail(mockContext, email, password),
          throwsA(isA<AuthFailure>().having(
            (e) => e.code,
            'code',
            AuthErrorCode.unknown,
          )),
        );
      });
    });

    group('signOut', () {
      test('should call supabase signOut', () async {
        // Arrange
        when(mockSupabaseClient.auth.signOut()).thenAnswer((_) async {});

        // Act
        await authService.signOut();

        // Assert
        verify(mockSupabaseClient.auth.signOut()).called(1);
      });
    });

    group('deleteUser', () {
      test('should throw UnimplementedError', () async {
        // Act & Assert
        expect(
          () => authService.deleteUser(mockContext),
          throwsA(isA<UnimplementedError>()),
        );
      });
    });
  });
}

// Mock BuildContext for testing
class MockBuildContext extends Mock implements BuildContext {}
