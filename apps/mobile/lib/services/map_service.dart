// ========================================
// GolfFox Map Service v11.0
// Servico para gerenciar dados do mapa
// ========================================

import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/services/logger_service.dart';
import '../models/vehicle_position.dart';
import 'supabase_service.dart';
import 'vehicle_position_simulator.dart';
import 'vehicle_status_service.dart';

class MapService {
  MapService(this._supabaseService);
  final SupabaseService _supabaseService;
  Timer? _updateTimer;
  RealtimeChannel? _realtimeSubscription;
  final StreamController<List<VehiclePosition>> _vehiclePositionsController =
      StreamController<List<VehiclePosition>>.broadcast();

  Stream<List<VehiclePosition>> get vehiclePositionsStream =>
      _vehiclePositionsController.stream;

  // Simulacao de dados para demonstracao
  List<VehiclePosition> _generateMockVehiclePositions() {
    final random = Random();
    const baseLatitude = -23.5505; // Sao Paulo
    const baseLongitude = -46.6333;

    return List.generate(15, (index) {
      final latOffset = (random.nextDouble() - 0.5) * 0.1;
      final lngOffset = (random.nextDouble() - 0.5) * 0.1;

      return VehiclePosition(
        id: 'pos_$index',
        vehicleId: 'vehicle_$index',
        licensePlate: 'ABC-${1000 + index}',
        driverName: _getRandomDriverName(index),
        position: LatLng(
          baseLatitude + latOffset,
          baseLongitude + lngOffset,
        ),
        status:
            VehicleStatus.values[random.nextInt(VehicleStatus.values.length)],
        speed: random.nextDouble() * 80,
        heading: random.nextDouble() * 360,
        lastUpdate: DateTime.now().subtract(
          Duration(minutes: random.nextInt(10)),
        ),
        routeId: 'route_${(index % 5) + 1}', // Distribui entre 5 rotas
        routeName: 'Rota ${(index % 5) + 1}',
        passengerCount: random.nextInt(30),
        capacity: 30 + random.nextInt(20),
      );
    });
  }

  String _getRandomDriverName(int index) {
    final names = [
      'Joao Silva',
      'Maria Santos',
      'Pedro Oliveira',
      'Ana Costa',
      'Carlos Ferreira',
      'Lucia Almeida',
      'Roberto Lima',
      'Fernanda Souza',
      'Marcos Pereira',
      'Juliana Rodrigues',
      'Antonio Barbosa',
      'Camila Martins',
      'Rafael Gomes',
      'Beatriz Carvalho',
      'Eduardo Nascimento',
    ];
    return names[index % names.length];
  }

  Future<List<VehiclePosition>> getVehiclePositions({
    List<VehicleStatus>? statusFilter,
    String? routeFilter,
  }) async {
    try {
      final response = await _supabaseService.client
          .from('vehicle_positions')
          .select()
          .order('last_update', ascending: false);

      final positions = response
          .map<VehiclePosition>((json) => VehiclePosition(
                id: json['id'] as String,
                vehicleId: json['vehicle_id'] as String,
                licensePlate: json['license_plate'] as String,
                driverName: json['driver_name'] as String,
                position: LatLng(
                  (json['latitude'] as num).toDouble(),
                  (json['longitude'] as num).toDouble(),
                ),
                status: VehicleStatus.values.firstWhere(
                  (s) => s.name == json['status'],
                  orElse: () => VehicleStatus.active,
                ),
                speed: (json['speed'] as num?)?.toDouble() ?? 0.0,
                heading: (json['heading'] as num?)?.toDouble() ?? 0.0,
                lastUpdate: DateTime.parse(json['last_update'] as String),
                routeId: json['route_id'] as String?,
                routeName: json['route_name'] as String?,
                passengerCount: json['passenger_count'] as int? ?? 0,
                capacity: json['capacity'] as int? ?? 30,
              ))
          .toList();

      return _applyLocalFilters(
        positions,
        statusFilter: statusFilter,
        routeFilter: routeFilter,
      );
    } on Exception catch (error) {
      LoggerService.instance.error(
        'Erro ao buscar posicoes dos veiculos',
        error,
      );
      // Fallback para dados mock em caso de erro
      final fallback = _generateMockVehiclePositions();
      return _applyLocalFilters(
        fallback,
        statusFilter: statusFilter,
        routeFilter: routeFilter,
      );
    }
  }

  void startRealTimeUpdates() {
    // Parar atualizacoes anteriores
    stopRealTimeUpdates();

    // Configurar subscription do Supabase Real-time
    _setupRealtimeSubscription();

    // Timer de fallback para garantir atualizacoes periodicas
    _updateTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      _updateVehiclePositions();
    });

    // Primeira atualizacao imediata
    _updateVehiclePositions();
  }

  void stopRealTimeUpdates() {
    _updateTimer?.cancel();
    _realtimeSubscription?.unsubscribe();
    _realtimeSubscription = null;
  }

  void _setupRealtimeSubscription() {
    try {
      _realtimeSubscription = _supabaseService.client
          .channel('vehicle_positions_realtime')
          .onPostgresChanges(
            event: PostgresChangeEvent.all,
            schema: 'public',
            table: 'vehicle_positions',
            callback: (payload) {
              LoggerService.instance.info(
                'Real-time update received: ${payload.eventType}',
              );
              _updateVehiclePositions();
            },
          )
          .subscribe();

      LoggerService.instance.info(
        'Real-time subscription configurada para vehicle_positions',
      );
    } on Exception catch (error) {
      LoggerService.instance.error(
        'Erro ao configurar real-time subscription',
        error,
      );
    }
  }

  Future<void> _updateVehiclePositions() async {
    try {
      final positions = await getVehiclePositions();
      _vehiclePositionsController.add(positions);
    } on Exception catch (error) {
      _vehiclePositionsController.addError(error);
    }
  }

  Future<List<VehiclePosition>> searchVehicles(String query) async {
    final allPositions = await getVehiclePositions();

    if (query.isEmpty) return allPositions;

    final lowerQuery = query.toLowerCase();
    return allPositions
        .where((vehicle) =>
            vehicle.licensePlate.toLowerCase().contains(lowerQuery) ||
            vehicle.driverName.toLowerCase().contains(lowerQuery) ||
            (vehicle.routeName?.toLowerCase().contains(lowerQuery) ?? false))
        .toList();
  }

  Future<VehiclePosition?> getVehicleById(String vehicleId) async {
    final positions = await getVehiclePositions();
    for (final position in positions) {
      if (position.vehicleId == vehicleId) {
        return position;
      }
    }
    return null;
  }

  // Calcular centro do mapa baseado nas posicoes dos veiculos
  LatLng calculateMapCenter(List<VehiclePosition> positions) {
    if (positions.isEmpty) {
      return const LatLng(-23.5505, -46.6333); // Sao Paulo como padrao
    }

    double totalLat = 0;
    double totalLng = 0;

    for (final position in positions) {
      totalLat += position.position.latitude;
      totalLng += position.position.longitude;
    }

    return LatLng(
      totalLat / positions.length,
      totalLng / positions.length,
    );
  }

  // Calcular zoom apropriado baseado na dispersao dos veiculos
  double calculateMapZoom(List<VehiclePosition> positions) {
    if (positions.length <= 1) return 12;

    var minLat = positions.first.position.latitude;
    var maxLat = positions.first.position.latitude;
    var minLng = positions.first.position.longitude;
    var maxLng = positions.first.position.longitude;

    for (final position in positions) {
      minLat = min(minLat, position.position.latitude);
      maxLat = max(maxLat, position.position.latitude);
      minLng = min(minLng, position.position.longitude);
      maxLng = max(maxLng, position.position.longitude);
    }

    final latDiff = maxLat - minLat;
    final lngDiff = maxLng - minLng;
    final maxDiff = max(latDiff, lngDiff);

    if (maxDiff > 0.1) return 10;
    if (maxDiff > 0.05) return 11;
    if (maxDiff > 0.02) return 12;
    if (maxDiff > 0.01) return 13;
    return 14;
  }

  void dispose() {
    stopRealTimeUpdates();
    _vehiclePositionsController.close();
  }

  List<VehiclePosition> _applyLocalFilters(
    List<VehiclePosition> positions, {
    List<VehicleStatus>? statusFilter,
    String? routeFilter,
  }) {
    Iterable<VehiclePosition> filtered = positions;

    if (statusFilter != null && statusFilter.isNotEmpty) {
      final allowedStatuses = statusFilter.toSet();
      filtered = filtered
          .where((position) => allowedStatuses.contains(position.status));
    }

    if (routeFilter != null && routeFilter.isNotEmpty) {
      filtered = filtered.where((position) => position.routeId == routeFilter);
    }

    return filtered.toList();
  }
}

// Provider para o SupabaseService
final supabaseServiceProvider =
    Provider<SupabaseService>((ref) => SupabaseService.instance);

// Provider para o MapService
final mapServiceProvider = Provider<MapService>((ref) {
  final supabaseService = ref.watch(supabaseServiceProvider);
  return MapService(supabaseService);
});

// Provider para stream de posicoes dos veiculos
final vehiclePositionsStreamProvider =
    StreamProvider<List<VehiclePosition>>((ref) {
  final mapService = ref.watch(mapServiceProvider)..startRealTimeUpdates();

  ref.onDispose(mapService.stopRealTimeUpdates);

  return mapService.vehiclePositionsStream;
});

// Provider para o VehicleStatusService
final vehicleStatusServiceProvider = Provider<VehicleStatusService>((ref) {
  final supabaseService = ref.read(supabaseServiceProvider);
  return VehicleStatusService(supabaseService);
});

// Provider para o simulador de posicoes (apenas em debug)
final vehiclePositionSimulatorProvider =
    Provider<VehiclePositionSimulator?>((ref) {
  if (!kDebugMode) return null;

  final supabaseService = ref.read(supabaseServiceProvider);
  return VehiclePositionSimulator(supabaseService);
});
