import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/services/logger_service.dart';
import '../models/driver_position.dart';
import '../models/trip.dart';
import '../models/user.dart' as app_user;

typedef Json = Map<String, dynamic>;

enum SbErrorCode { auth, network, rls, notFound, conflict, invalid, unknown }

class SbFailure implements Exception {
  SbFailure(this.code, this.message, [this.cause]);
  final SbErrorCode code;
  final String message;
  final Object? cause;
  @override
  String toString() => 'SbFailure($code): $message';
}

class SupabaseService {
  SupabaseService._();
  static final SupabaseService instance = SupabaseService._();

  SupabaseClient get client {
    if (!Supabase.instance.isInitialized) {
      throw Exception(
          'Supabase não foi inicializado. Chame SupaClient.initialize() primeiro.');
    }
    return Supabase.instance.client;
  }

  /* ===================== Auth helpers ===================== */

  Session? get currentSession => client.auth.currentSession;
  User? get currentUser => client.auth.currentUser;
  String? get currentUserId => currentUser?.id;
  bool get isAuthenticated => currentSession != null;
  GoTrueClient get auth => client.auth;

  Future<T> _withTimeout<T>(Future<T> f, {Duration? timeout}) =>
      f.timeout(timeout ?? const Duration(seconds: 20));

  SbFailure _mapPostgrest(PostgrestException e) {
    final m = e.message.toLowerCase();
    if (m.contains('permission') || m.contains('rls')) {
      return SbFailure(SbErrorCode.rls, 'Permissao negada (RLS).', e);
    }
    if (e.code == '404' || m.contains('not found')) {
      return SbFailure(SbErrorCode.notFound, 'Record not found.', e);
    }
    if (e.code == '409' || m.contains('duplicate') || m.contains('conflict')) {
      return SbFailure(SbErrorCode.conflict, 'Conflito de dados.', e);
    }
    return SbFailure(SbErrorCode.unknown, e.message, e);
  }

  SbFailure _mapAuth(AuthException e) {
    final m = e.message.toLowerCase();
    if (m.contains('invalid') || m.contains('credential')) {
      return SbFailure(SbErrorCode.auth, 'Credenciais invalidas.', e);
    }
    if (m.contains('email not confirmed') || m.contains('verify')) {
      return SbFailure(SbErrorCode.auth, 'E-mail nao verificado.', e);
    }
    if (m.contains('network') || m.contains('timeout')) {
      return SbFailure(SbErrorCode.network, 'Falha de rede.', e);
    }
    return SbFailure(SbErrorCode.auth, e.message, e);
  }

  Future<void> ensureAuth() async {
    if (currentUser == null) {
      throw SbFailure(SbErrorCode.auth, 'User not authenticated.');
    }
  }

  /* ===================== Auth API ===================== */

  Future<AuthResponse> signInWithEmail(String email, String password) async {
    try {
      return await _withTimeout(
        client.auth.signInWithPassword(email: email, password: password),
      );
    } on AuthException catch (e) {
      throw _mapAuth(e);
    } on TimeoutException catch (e) {
      throw SbFailure(SbErrorCode.network, 'Connection timeout.', e);
    }
  }

  // Backward-compat wrapper used by AuthManager
  Future<AuthResponse> signInWithPassword({required String email, required String password}) => signInWithEmail(email, password);

  Future<void> signOut() async {
    await client.auth.signOut();
  }

  Future<AuthResponse> signUp({
    required String email,
    required String password,
    Map<String, dynamic>? data,
  }) async {
    try {
      return await _withTimeout(
        client.auth.signUp(
          email: email,
          password: password,
          data: data,
        ),
      );
    } on AuthException catch (e) {
      throw _mapAuth(e);
    } on TimeoutException catch (e) {
      throw SbFailure(SbErrorCode.network, 'Connection timeout.', e);
    }
  }

  Future<void> resetPassword(String email) async {
    try {
      await _withTimeout(client.auth.resetPasswordForEmail(email));
    } on AuthException catch (e) {
      throw _mapAuth(e);
    } on TimeoutException catch (e) {
      throw SbFailure(SbErrorCode.network, 'Connection timeout.', e);
    }
  }

  /* ===================== Profiles / Users ===================== */

  /// Busca o perfil do usuario atual:
  /// 1) tenta na VIEW `profiles` (recomendada)
  /// 2) fallback: tabela `users`
  /// Usa maybeSingle() para nao lancar quando 0 linhas e normaliza role/name.
  Future<app_user.User?> getCurrentUserProfile() async {
    final user = currentUser;
    if (user == null) return null;

    // 1) profiles
    try {
      final row = await _withTimeout(
        client.from('profiles').select().eq('id', user.id).maybeSingle(),
      );
      if (row != null) {
        try {
          final normalizedRow = _normalizeUserRow(row);
          return app_user.User.fromJson(normalizedRow);
        } on Exception catch (error) {
          LoggerService.instance.error(
            'getCurrentUserProfile[profiles] serialization error',
            error,
          );
          LoggerService.instance.debug('Raw row data: $row');
          LoggerService.instance.debug(
            'Normalized row data: ${_normalizeUserRow(row)}',
          );
          // continua para o fallback
        }
      }
    } on PostgrestException catch (e) {
      LoggerService.instance.error(
        'getCurrentUserProfile[profiles] error',
        e,
      );
      // continua para o fallback
    }

    // 2) users (fallback)
    try {
      final row = await _withTimeout(
        client.from('users').select().eq('id', user.id).maybeSingle(),
      );
      if (row != null) {
        try {
          final normalizedRow = _normalizeUserRow(row);
          return app_user.User.fromJson(normalizedRow);
        } on Exception catch (error, stackTrace) {
          LoggerService.instance.error(
            'getCurrentUserProfile[users] serialization error',
            error,
            stackTrace,
          );
          LoggerService.instance.debug('Raw row data: $row');
          LoggerService.instance.debug(
            'Normalized row data: ${_normalizeUserRow(row)}',
          );
          throw SbFailure(
            SbErrorCode.unknown,
            'Erro ao processar dados do usuario: $error',
            stackTrace,
          );
        }
      }
    } on PostgrestException catch (e) {
      LoggerService.instance.error(
        'getCurrentUserProfile[users] error',
        e,
      );
      throw _mapPostgrest(e);
    }

    return null;
  }

  /// Normaliza o payload do PostgREST para o seu AppUser.User:
  /// - role enum/text  String
  /// - name  fallback do prefixo do e-mail quando ausente
  /// Mantem snake_case para company_id/carrier_id (compativel com seu model).
  Map<String, dynamic> _normalizeUserRow(Map<String, dynamic> row) {
    final email = row['email']?.toString();
    final fallbackName =
        email != null && email.contains('@') ? email.split('@').first : null;

    final now = DateTime.now();

    return <String, dynamic>{
      'id': row['id'],
      'email': email,
      'name': row['name'] ?? fallbackName,
      'role': row['role']?.toString(),
      'company_id': row['company_id'],
      'carrier_id': row['carrier_id'],
      'created_at': row['created_at'] ?? now.toIso8601String(),
      'updated_at': row['updated_at'] ?? now.toIso8601String(),
    };
  }

  Future<app_user.User> upsertUserProfile(app_user.User user) async {
    try {
      final data = user.toJson();
      final res = await _withTimeout(client
          .from('users')
          .upsert(data, onConflict: 'id')
          .select()
          .single());
      return app_user.User.fromJson(res);
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  // Generic update helper used by AuthManager.updateProfile
  Future<Map<String, dynamic>> update(
    String table,
    Map<String, dynamic> updates, {
    required String filter,
  }) async {
    try {
      // Currently supports simple filter pattern: 'id=<value>'
      if (filter.startsWith('id=')) {
        final id = filter.substring(3);
        final res = await _withTimeout(
          client.from(table).update(updates).eq('id', id).select().single(),
        );
        return res;
      }
      // Fallback: no filter, perform update and return first row if any
      final res = await _withTimeout(
        client.from(table).update(updates).select().maybeSingle(),
      );
      return res ?? <String, dynamic>{};
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  /// Generic insert helper used by AuthManager._createUserProfile
  Future<void> insert(String table, Map<String, dynamic> values) async {
    try {
      await _withTimeout(client.from(table).insert(values));
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  /* ===================== Driver positions ===================== */

  Future<void> insertDriverPosition({
    required String tripId,
    required String driverId,
    required double latitude,
    required double longitude,
    double? accuracy,
    double? speed,
    double? heading,
  }) async {
    await ensureAuth();
    try {
      await _withTimeout(client.from('driver_positions').insert({
        'trip_id': tripId,
        'driver_id': driverId,
        'lat': latitude,
        'lng': longitude,
        if (accuracy != null) 'accuracy': accuracy,
        if (speed != null) 'speed': speed,
        if (heading != null) 'heading': heading,
        // deixe o DB preencher "timestamp" com default now() se houver; senao:
        'timestamp': DateTime.now().toIso8601String(),
      }));
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  Future<List<DriverPosition>> getDriverPositionsForTrip(String tripId) async {
    try {
      final res = await _withTimeout(
        client
            .from('driver_positions')
            .select()
            .eq('trip_id', tripId)
            .order('timestamp')
            .limit(200),
      );
      return (res as List)
          .cast<Json>()
          .map(DriverPosition.fromJson)
          .toList(growable: false);
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  Stream<List<DriverPosition>> streamDriverPositionsRealtime(String tripId) =>
      client
          .from('driver_positions')
          .stream(primaryKey: ['id'])
          .eq('trip_id', tripId)
          .order('timestamp')
          .map(
            (rows) => rows
                .cast<Json>()
                .map(DriverPosition.fromJson)
                .toList(growable: false),
          );

  /* ===================== Trips ===================== */

  Future<Trip?> getTripById(String tripId) async {
    try {
      final res = await _withTimeout(
        client.from('trips').select().eq('id', tripId).maybeSingle(),
      );
      return res == null ? null : Trip.fromJson(res);
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  Future<Trip> createTrip(Trip trip) async {
    try {
      final res = await _withTimeout(
          client.from('trips').insert(trip.toDbInsert()).select().single());
      return Trip.fromJson(res);
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  Future<Trip> updateTrip(Trip trip) async {
    try {
      final res = await _withTimeout(client
          .from('trips')
          .update(trip.toDbUpdate())
          .eq('id', trip.id)
          .select()
          .single());
      return Trip.fromJson(res);
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  Future<void> deleteTrip(String tripId) async {
    try {
      await _withTimeout(client.from('trips').delete().eq('id', tripId));
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  /// Trips do usuario atual por papel, com paginacao opcional.
  Future<List<Trip>> getTripsForUser({int? limit, int? offset}) async {
    final userProfile = await getCurrentUserProfile();
    if (userProfile == null) {
      throw SbFailure(SbErrorCode.auth, 'Usuario nao autenticado.');
    }

    PostgrestFilterBuilder<dynamic> q(String table) =>
        client.from(table).select();

    try {
      var results = const <Json>[];

      switch (userProfile.role) {
        case 'driver':
          var query = q('trips')
              .eq('driver_id', userProfile.id)
              .order('updated_at');
          if (limit != null) {
            final from = offset ?? 0;
            query = query.range(from, from + limit - 1);
          }
          results = (await _withTimeout(query) as List).cast<Json>();
          break;

        case 'passenger':
          final pass = await _withTimeout(
            client
                .from('trip_passengers')
                .select('trip_id')
                .eq('passenger_id', userProfile.id),
          );
          final tripIds = (pass as List)
              .cast<Json>()
              .map((row) => row['trip_id'] as String)
              .toList(growable: false);
          if (tripIds.isEmpty) return const [];

          var query = q('trips')
              .inFilter('id', tripIds)
              .order('updated_at');
          if (limit != null) {
            final from = offset ?? 0;
            query = query.range(from, from + limit - 1);
          }
          results = (await _withTimeout(query) as List).cast<Json>();
          break;

        default:
          var query = q('trips').order('updated_at');
          if (limit != null) {
            final from = offset ?? 0;
            query = query.range(from, from + limit - 1);
          }
          results = (await _withTimeout(query) as List).cast<Json>();
      }

      return results.map(Trip.fromJson).toList(growable: false);
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  /// Stream de um trip especifico (atualizacoes em tempo real).
  Stream<Trip?> streamTrip(String tripId) => client
      .from('trips')
      .stream(primaryKey: ['id'])
      .eq('id', tripId)
      .map(
        (rows) => rows.isNotEmpty
            ? Trip.fromJson(Map<String, dynamic>.from(rows.first as Map))
            : null,
      );

  /// Stream do status do trip como Json "cru", se voce realmente precisar.
  Stream<Json> streamTripStatus(String tripId) => client
      .from('trips')
      .stream(primaryKey: ['id'])
      .eq('id', tripId)
      .map(
        (data) => data.isNotEmpty
            ? Map<String, dynamic>.from(data.first as Map)
            : <String, dynamic>{},
      );

  /* ===================== Companies / Routes / Vehicles ===================== */

  Future<List<Json>> getCompanies() async {
    try {
      final res =
          await _withTimeout(client.from('companies').select().order('name'));
      return (res as List).cast<Json>();
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  Future<List<Json>> getRoutesForUser() async {
    final profile = await getCurrentUserProfile();
    if (profile == null) throw SbFailure(SbErrorCode.auth, 'Nao autenticado.');

    try {
      PostgrestFilterBuilder<dynamic> query =
          client.from('routes').select();
      final companyId = profile.companyId;
      final carrierId = profile.carrierId;

      if (profile.role == 'operator' &&
          (companyId?.isNotEmpty ?? false)) {
        query = query.eq('company_id', companyId!);
      } else if (profile.role == 'carrier' &&
          (carrierId?.isNotEmpty ?? false)) {
        query = query.eq('carrier_id', carrierId!);
      }
      final res = await _withTimeout(
        query.order('name'),
      );
      return (res as List).cast<Json>();
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  Future<List<Json>> getVehiclesForUser() async {
    final profile = await getCurrentUserProfile();
    if (profile == null) throw SbFailure(SbErrorCode.auth, 'Nao autenticado.');

    try {
      PostgrestFilterBuilder<dynamic> query =
          client.from('vehicles').select();
      final carrierId = profile.carrierId;

      if (profile.role == 'carrier' &&
          (carrierId?.isNotEmpty ?? false)) {
        query = query.eq('carrier_id', carrierId!);
      }
      final res = await _withTimeout(
        query.order('plate'),
      );
      return (res as List).cast<Json>();
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  /* ===================== Reports / Views ===================== */

  Future<List<Json>> getTripReports({
    DateTime? startDate,
    DateTime? endDate,
    String? status,
    int? limit,
    int? offset,
  }) async {
    try {
      var query = client.from('mvw_trip_report').select();

      if (startDate != null) {
        query = query.gte('created_at', startDate.toIso8601String());
      }
      if (endDate != null) {
        query = query.lte('created_at', endDate.toIso8601String());
      }
      if (status != null) {
        query = query.eq('status', status);
      }
      var ordered = query.order('created_at');

      if (limit != null) {
        final from = offset ?? 0;
        ordered = ordered.range(from, from + limit - 1);
      }

      final res = await _withTimeout(ordered);
      return (res as List).cast<Json>();
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  /* ===================== Checklist ===================== */

  Future<Json> createChecklist({
    required String tripId,
    required String type,
    Map<String, dynamic>? data,
  }) async {
    try {
      final payload = {
        'trip_id': tripId,
        'type': type,
        'completed_by': currentUser?.id,
        if (data != null) ...data,
        'created_at': DateTime.now().toIso8601String(),
      };
      final res = await _withTimeout(
        client.from('checklists').insert(payload).select().single(),
      );
      return res;
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  Future<List<Json>> getChecklistsForTrip(String tripId) async {
    try {
      final res = await _withTimeout(
        client
            .from('checklists')
            .select()
            .eq('trip_id', tripId)
            .order('created_at'),
      );
      return (res as List).cast<Json>();
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  /* ===================== RPCs ===================== */

  /// Exemplo de transicao de status via RPC com validacao basica.
  Future<Json> transitionTripStatus({
    required String tripId,
    required String newStatus,
    required String description,
    required double lat,
    required double lng,
    bool force = false,
  }) async {
    try {
      final res = await _withTimeout<Json?>(
        client.rpc(
          'rpc_trip_transition',
          params: {
            'p_trip': tripId,
            'p_new_status': newStatus,
            'p_description': description,
            'p_lat': lat,
            'p_lng': lng,
            'p_force': force,
          },
        ),
      );
      return res ?? <String, dynamic>{};
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    } on Exception catch (error) {
      // Quando RPC retorna erro nao-Postgrest.
      return {
        'success': false,
        'error': error.toString(),
      };
    }
  }

  Future<Json?> getTripSummary(String tripId) async {
    try {
      final res = await _withTimeout(client
          .from('trip_summary')
          .select()
          .eq('trip_id', tripId)
          .maybeSingle());
      return res;
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }

  Future<List<Json>> getTripEvents(String tripId) async {
    try {
      final res = await _withTimeout(
        client
            .from('trip_events')
            .select()
            .eq('trip_id', tripId)
            .order('created_at'),
      );
      return (res as List).cast<Json>();
    } on PostgrestException catch (e) {
      throw _mapPostgrest(e);
    }
  }
}
