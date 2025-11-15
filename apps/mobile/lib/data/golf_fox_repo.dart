// ========================================
// GolfFox Repository v11.0 - Supabase Integration
// Repositorio principal para dados do Golf Fox
// ========================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/utils/result.dart';

// ========================================
// PROVIDER
// ========================================
final golfFoxRepoProvider = Provider<GolfFoxRepo>((ref) => GolfFoxRepo(Supabase.instance.client));

class GolfFoxRepo {

  GolfFoxRepo(this._client);
  final SupabaseClient _client;

  // ========================================
  // METRICAS DO DASHBOARD
  // ========================================
  Future<Result<Map<String, int>, Exception>> loadDashboardMetrics() async {
    try {
      // Busca dados respeitando RLS - cada consulta sera filtrada automaticamente
      // baseada no papel do usuario logado (admin, operator, carrier, etc.)

      final results = await Future.wait([
        _getInTransitCount(),
        _getActiveVehiclesCount(),
        _getRoutesTodayCount(),
        _getCriticalAlertsCount(),
      ]);

      return Ok({
        'inTransit': results[0],
        'activeVehicles': results[1],
        'routesToday': results[2],
        'criticalAlerts': results[3],
      });
    } on Exception catch (e) {
      return Err(Exception('Erro ao carregar metricas: $e'));
    }
  }

  // ========================================
  // COLABORADORES EM TRANSITO
  // ========================================
  Future<int> _getInTransitCount() async {
    try {
      final response =
          await _client.from('trips').select('id').eq('status', 'inProgress');

      return (response as List).length;
    } on Exception catch (_) {
      return 0;
    }
  }

  // ========================================
  // VEICULOS ATIVOS
  // ========================================
  Future<int> _getActiveVehiclesCount() async {
    try {
      final response = await _client.from('vehicles').select('id, status');

      // Filtra veiculos com status ativo
      final activeVehicles = response.where((vehicle) {
        final status = (vehicle['status'] ?? '').toString().toLowerCase();
        return status.contains('active') ||
            status.contains('ativo') ||
            status.contains('movimento') ||
            status.contains('mov');
      }).length;

      return activeVehicles;
    } on Exception catch (_) {
      return 0;
    }
  }

  // ========================================
  // ROTAS DO DIA
  // ========================================
  Future<int> _getRoutesTodayCount() async {
    try {
      // Como nao ha coluna de data especifica na tabela routes,
      // vamos contar todas as rotas disponiveis
      final response = await _client.from('routes').select('id');

      return (response as List).length;
    } on Exception catch (_) {
      return 0;
    }
  }

  // ========================================
  // ALERTAS CRITICOS
  // ========================================
  Future<int> _getCriticalAlertsCount() async {
    try {
      final response = await _client
          .from('trip_events')
          .select('id')
          .eq('severity', 'critical');

      return (response as List).length;
    } on Exception catch (_) {
      return 0;
    }
  }

  // ========================================
  // DADOS PARA O MAPA
  // ========================================
  Future<Result<List<Map<String, dynamic>>, Exception>>
      loadDriverPositions() async {
    try {
      final response = await _client.from('driver_positions').select('''
            id,
            lat,
            lng,
            speed,
            timestamp,
            trip_id,
            driver_id,
            trips!inner(
              id,
              status,
              routes!inner(
                id,
                name
              )
            )
          ''').order('timestamp', ascending: false).limit(100);

      return Ok(List<Map<String, dynamic>>.from(response));
    } on Exception catch (e) {
      return Err(Exception('Erro ao carregar posicoes: $e'));
    }
  }

  // ========================================
  // DADOS PARA ROTAS
  // ========================================
  Future<Result<List<Map<String, dynamic>>, Exception>> loadRoutes() async {
    try {
      final response = await _client.from('routes').select('''
            id,
            name,
            created_at,
            companies!inner(
              id,
              name
            ),
            carriers!inner(
              id,
              name
            )
          ''').order('created_at', ascending: false);

      return Ok(List<Map<String, dynamic>>.from(response));
    } on Exception catch (e) {
      return Err(Exception('Erro ao carregar rotas: $e'));
    }
  }

  // ========================================
  // DADOS PARA VEICULOS
  // ========================================
  Future<Result<List<Map<String, dynamic>>, Exception>> loadVehicles() async {
    try {
      final response = await _client.from('vehicles').select('''
            id,
            plate,
            model,
            created_at,
            carriers!inner(
              id,
              name
            )
          ''').order('created_at', ascending: false);

      return Ok(List<Map<String, dynamic>>.from(response));
    } on Exception catch (e) {
      return Err(Exception('Erro ao carregar veiculos: $e'));
    }
  }

  // ========================================
  // DADOS PARA VIAGENS
  // ========================================
  Future<Result<List<Map<String, dynamic>>, Exception>> loadTrips() async {
    try {
      final response = await _client.from('trips').select('''
            id,
            status,
            scheduled_at,
            started_at,
            completed_at,
            routes!inner(
              id,
              name
            ),
            vehicles(
              id,
              plate,
              model
            ),
            users!trips_driver_id_fkey(
              id,
              email
            )
          ''').order('scheduled_at', ascending: false).limit(50);

      return Ok(List<Map<String, dynamic>>.from(response));
    } on Exception catch (e) {
      return Err(Exception('Erro ao carregar viagens: $e'));
    }
  }

  // ========================================
  // DADOS PARA ALERTAS
  // ========================================
  Future<Result<List<Map<String, dynamic>>, Exception>> loadAlerts() async {
    try {
      final response = await _client
          .from('trip_events')
          .select('''
            id,
            event_type,
            description,
            timestamp,
            severity,
            trips!inner(
              id,
              routes!inner(
                id,
                name
              )
            )
          ''')
          .inFilter('severity', ['critical', 'high', 'medium'])
          .order('timestamp', ascending: false)
          .limit(20);

      return Ok(List<Map<String, dynamic>>.from(response));
    } on Exception catch (e) {
      return Err(Exception('Erro ao carregar alertas: $e'));
    }
  }

  // ========================================
  // DADOS PARA EMPRESAS
  // ========================================
  Future<Result<List<Map<String, dynamic>>, Exception>> loadCompanies() async {
    try {
      final response = await _client
          .from('companies')
          .select('id, name, created_at')
          .order('name', ascending: true);

      return Ok(List<Map<String, dynamic>>.from(response));
    } on Exception catch (e) {
      return Err(Exception('Erro ao carregar empresas: $e'));
    }
  }

  // ========================================
  // DADOS PARA TRANSPORTADORAS
  // ========================================
  Future<Result<List<Map<String, dynamic>>, Exception>> loadCarriers() async {
    try {
      final response = await _client
          .from('carriers')
          .select('id, name, created_at')
          .order('name', ascending: true);

      return Ok(List<Map<String, dynamic>>.from(response));
    } on Exception catch (e) {
      return Err(Exception('Erro ao carregar transportadoras: $e'));
    }
  }

  // ========================================
  // DADOS PARA USUARIOS/MOTORISTAS
  // ========================================
  Future<Result<List<Map<String, dynamic>>, Exception>> loadUsers(
      {String? role}) async {
    try {
      var query = _client.from('users').select('''
            id,
            email,
            role,
            created_at,
            companies(
              id,
              name
            ),
            carriers(
              id,
              name
            )
          ''');

      if (role != null) {
        query = query.eq('role', role);
      }

      final response = await query.order('created_at', ascending: false);

      return Ok(List<Map<String, dynamic>>.from(response));
    } on Exception catch (e) {
      return Err(Exception('Erro ao carregar usuarios: $e'));
    }
  }

  // ========================================
  // REALTIME SUBSCRIPTION PARA POSICOES
  // ========================================
  RealtimeChannel subscribeToDriverPositions(
    void Function(List<Map<String, dynamic>>) onData,
  ) => _client
        .channel('driver_positions')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'driver_positions',
          callback: (payload) async {
            // Recarrega as posicoes quando ha mudancas
            final result = await loadDriverPositions();
            if (result.isOk) {
              onData(result.ok!);
            }
          },
        )
        .subscribe();

  // ========================================
  // REALTIME SUBSCRIPTION PARA ALERTAS
  // ========================================
  RealtimeChannel subscribeToAlerts(
    void Function(List<Map<String, dynamic>>) onData,
  ) => _client
        .channel('trip_events')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'trip_events',
          callback: (payload) async {
            // Recarrega os alertas quando ha novos eventos
            final result = await loadAlerts();
            if (result.isOk) {
              onData(result.ok!);
            }
          },
        )
        .subscribe();
}
