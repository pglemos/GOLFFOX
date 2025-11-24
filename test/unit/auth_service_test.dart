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
      authService = AuthService(supabaseService: mockSupabaseService);
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
        final result =
            await authService.signInWithEmail(email, password);

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
        when(mockAuthResponse.session).thenReturn(null);
        
        when(mockSupabaseService.signInWithEmail(email, password))
            .thenAnswer((_) async => mockAuthResponse);

        // Act & Assert
        await expectLater(
          authService.signInWithEmail(email, password),
          throwsA(isA<AuthFailure>().having(
            (e) => e.code,
            'code',
            AuthErrorCode.invalidCredentials,
          )),
        );
      });

      test('should throw AuthFailure with emailNotVerified quando email não confirmado', () async {
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
        await expectLater(
          authService.signInWithEmail(email, password),
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
        await expectLater(
          authService.signInWithEmail(email, password),
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
        await expectLater(
          authService.signInWithEmail(invalidEmail, password),
          throwsA(isA<AuthFailure>()),
        );
      });

      test('should validate password rules', () async {
        // Arrange
        const email = 'test@example.com';
        const weakPassword = '123'; // Too short

        // Act & Assert
        await expectLater(
          authService.signInWithEmail(email, weakPassword),
          throwsA(isA<AuthFailure>()),
        );
      });
    });

    group('createAccountWithEmail', () {
      test('should upsert profile and return created user when session is available', () async {
        // Arrange
        const email = 'newuser@example.com';
        const password = 'password123';

        final mockUser = MockUser();
        final mockAuthResponse = MockAuthResponse();
        final mockSession = MockSession();
        when(mockAuthResponse.user).thenReturn(mockUser);
        when(mockAuthResponse.session).thenReturn(mockSession);
        when(mockSession.accessToken).thenReturn('token');

        when(mockUser.id).thenReturn('new-id');
        when(mockUser.email).thenReturn(email);

        final mockGoTrueClient = MockGoTrueClient();
        when(mockSupabaseService.client).thenReturn(mockSupabaseClient);
        when(mockSupabaseClient.auth).thenReturn(mockGoTrueClient);
        when(mockGoTrueClient.signUp(email: email, password: password))
            .thenAnswer((_) async => mockAuthResponse);

        final createdProfile = app_user.User(
          id: 'new-id',
          email: email,
          role: 'user',
          name: null,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        when(mockSupabaseService.upsertUserProfile(any))
            .thenAnswer((_) async => createdProfile);

        // Act
        final result = await authService.createAccountWithEmail(mockContext, email, password);

        // Assert
        expect(result, equals(createdProfile));
        verify(mockGoTrueClient.signUp(email: email, password: password)).called(1);
        verify(mockSupabaseService.upsertUserProfile(any)).called(1);
      });

      test(
          'should return generated profile without upserting when session is null',
          () async {
        // Arrange
        const email = 'newuser@example.com';
        const password = 'password123';

        final mockUser = MockUser();
        final mockAuthResponse = MockAuthResponse();
        when(mockAuthResponse.user).thenReturn(mockUser);
        when(mockAuthResponse.session).thenReturn(null);

        when(mockUser.id).thenReturn('new-id');
        when(mockUser.email).thenReturn(email);

        final mockGoTrueClient = MockGoTrueClient();
        when(mockSupabaseService.client).thenReturn(mockSupabaseClient);
        when(mockSupabaseClient.auth).thenReturn(mockGoTrueClient);
        when(mockGoTrueClient.signUp(email: email, password: password))
            .thenAnswer((_) async => mockAuthResponse);

        // Act
        final result =
            await authService.createAccountWithEmail(mockContext, email, password);

        // Assert
        expect(result.id, equals('new-id'));
        expect(result.email, equals(email));
        verifyNever(mockSupabaseService.upsertUserProfile(any));
      });

      test(
          'should return generated profile without upserting when session lacks access token',
          () async {
        // Arrange
        const email = 'newuser@example.com';
        const password = 'password123';

        final mockUser = MockUser();
        final mockAuthResponse = MockAuthResponse();
        final mockSession = MockSession();
        when(mockAuthResponse.user).thenReturn(mockUser);
        when(mockAuthResponse.session).thenReturn(mockSession);

        when(mockUser.id).thenReturn('new-id');
        when(mockUser.email).thenReturn(email);

        final mockGoTrueClient = MockGoTrueClient();
        when(mockSupabaseService.client).thenReturn(mockSupabaseClient);
        when(mockSupabaseClient.auth).thenReturn(mockGoTrueClient);
        when(mockGoTrueClient.signUp(email: email, password: password))
            .thenAnswer((_) async => mockAuthResponse);

        // Act
        final result =
            await authService.createAccountWithEmail(mockContext, email, password);

        // Assert
        expect(result.id, equals('new-id'));
        expect(result.email, equals(email));
        verifyNever(mockSupabaseService.upsertUserProfile(any));
      });

      test('should skip upsert when session access token is empty string',
          () async {
        // Arrange
        const email = 'newuser@example.com';
        const password = 'password123';

        final mockUser = MockUser();
        final mockAuthResponse = MockAuthResponse();
        final mockSession = MockSession();

        when(mockAuthResponse.user).thenReturn(mockUser);
        when(mockAuthResponse.session).thenReturn(mockSession);
        when(mockSession.accessToken).thenReturn('');

        when(mockUser.id).thenReturn('new-id');
        when(mockUser.email).thenReturn(email);

        final mockGoTrueClient = MockGoTrueClient();
        when(mockSupabaseService.client).thenReturn(mockSupabaseClient);
        when(mockSupabaseClient.auth).thenReturn(mockGoTrueClient);
        when(mockGoTrueClient.signUp(email: email, password: password))
            .thenAnswer((_) async => mockAuthResponse);

        // Act
        final result =
            await authService.createAccountWithEmail(mockContext, email, password);

        // Assert
        expect(result.id, equals('new-id'));
        expect(result.email, equals(email));
        verifyNever(mockSupabaseService.upsertUserProfile(any));
      });

      test('should throw AuthFailure when user creation fails', () async {
        // Arrange
        const email = 'newuser@example.com';
        const password = 'password123';

        final mockAuthResponse = MockAuthResponse();
        when(mockAuthResponse.user).thenReturn(null);

        final mockGoTrueClient = MockGoTrueClient();
        when(mockSupabaseService.client).thenReturn(mockSupabaseClient);
        when(mockSupabaseClient.auth).thenReturn(mockGoTrueClient);
        when(mockGoTrueClient.signUp(email: email, password: password))
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

        verifyNever(mockSupabaseService.upsertUserProfile(any));
      });
    });

    group('signOut', () {
      test('should call supabase signOut', () async {
        // Arrange
        final mockGoTrueClient = MockGoTrueClient();
        when(mockSupabaseService.client).thenReturn(mockSupabaseClient);
        when(mockSupabaseClient.auth).thenReturn(mockGoTrueClient);
        when(mockGoTrueClient.signOut()).thenAnswer((_) async {});

        // Act
        await authService.signOut();

        // Assert
        verify(mockGoTrueClient.signOut()).called(1);
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
