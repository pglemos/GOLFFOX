// ========================================
// GolfFox Bus Stop Service v1.0
// Servico para gerenciar pontos de parada
// ========================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../core/services/logger_service.dart';
import '../models/bus_stop.dart';
import 'map_service.dart';
import 'supabase_service.dart';

class BusStopService {
  BusStopService(this._supabaseService);
  final SupabaseService _supabaseService;

  /// Busca pontos de parada por rota
  Future<List<BusStop>> getBusStopsByRoute(String routeId) async {
    try {
      final response = await _supabaseService.client
          .from('bus_stops')
          .select()
          .eq('route_id', routeId)
          .order('sequence', ascending: true);

      return (response as List)
          .map((json) => BusStop.fromJson(
                Map<String, dynamic>.from(json as Map),
              ))
          .toList();
    } on Exception {
      // Em caso de erro, retorna dados mock para demonstracao
      return _getMockBusStops(routeId);
    }
  }

  /// Busca pontos de parada proximos a uma posicao
  Future<List<BusStop>> getNearbyBusStops(
    LatLng position, {
    double radiusKm = 2.0,
  }) async {
    try {
      // Implementacao com PostGIS seria ideal, mas por enquanto usamos dados mock
      final allStops = await getAllBusStops();

      return allStops.where((stop) {
        final distanceKm = Geolocator.distanceBetween(
              position.latitude,
              position.longitude,
              stop.position.latitude,
              stop.position.longitude,
            ) /
            1000.0;
        return distanceKm <= radiusKm;
      }).toList();
    } on Exception {
      return _getMockNearbyStops(position);
    }
  }

  /// Busca todos os pontos de parada
  Future<List<BusStop>> getAllBusStops() async {
    try {
      final response = await _supabaseService.client
          .from('bus_stops')
          .select()
          .order('name', ascending: true);

      return (response as List)
          .map((json) => BusStop.fromJson(
                Map<String, dynamic>.from(json as Map),
              ))
          .toList();
    } on Exception {
      return _getAllMockBusStops();
    }
  }

  /// Busca um ponto de parada especifico
  Future<BusStop?> getBusStop(String stopId) async {
    try {
      final response = await _supabaseService.client
          .from('bus_stops')
          .select()
          .eq('id', stopId)
          .single();

      return BusStop.fromJson(
        Map<String, dynamic>.from(response as Map),
      );
    } on Exception {
      return _getMockBusStop(stopId);
    }
  }

  /// Atualiza tempo estimado de chegada
  Future<void> updateEstimatedArrival(
      String stopId, DateTime estimatedArrival) async {
    try {
      await _supabaseService.client.from('bus_stops').update({
        'estimated_arrival': estimatedArrival.toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', stopId);
    } on Exception catch (e, st) {
      LoggerService.instance.error(
        'Falha ao atualizar chegada estimada',
        e,
        st,
      );
    }
  }

  /// Marca ultima visita a uma parada
  Future<void> markLastVisit(String stopId) async {
    try {
      await _supabaseService.client.from('bus_stops').update({
        'last_visit': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', stopId);
    } on Exception catch (e, st) {
      LoggerService.instance.error(
        'Falha ao marcar ultima visita do ponto',
        e,
        st,
      );
    }
  }

  // ========================================
  // DADOS MOCK PARA DEMONSTRACAO
  // ========================================

  List<BusStop> _getMockBusStops(String routeId) {
    final baseTime = DateTime.now();
    final routeNumber = routeId.replaceAll('route_', '');
    final routeName = _getRouteNameByNumber(routeNumber);

    return [
      BusStop(
        id: '${routeId}_stop_1',
        name: 'Terminal Central',
        description: 'Terminal principal do centro da cidade',
        position: const LatLng(-23.5505, -46.6333),
        type: BusStopType.terminal,
        routeId: routeId,
        routeName: routeName,
        sequence: 1,
        estimatedArrival: baseTime.add(const Duration(minutes: 5)),
        lastVisit: baseTime.subtract(const Duration(minutes: 30)),
        hasAccessibility: true,
        hasShelter: true,
        hasSeating: true,
        address: 'Praca da Se, Centro',
        landmark: 'Proximo ao Metro Se',
        amenities: ['Wi-Fi', 'Cobertura', 'Acessibilidade'],
        createdAt: DateTime.now().subtract(const Duration(days: 365)),
      ),
      BusStop(
        id: '${routeId}_stop_2',
        name: 'Shopping Center',
        description: 'Parada em frente ao shopping',
        position: const LatLng(-23.5515, -46.6343),
        type: BusStopType.shopping,
        routeId: routeId,
        routeName: routeName,
        sequence: 2,
        estimatedArrival: baseTime.add(const Duration(minutes: 12)),
        lastVisit: baseTime.subtract(const Duration(minutes: 45)),
        hasAccessibility: true,
        hasShelter: true,
        address: 'Av. Paulista, 1000',
        landmark: 'Shopping Paulista',
        amenities: ['Cobertura', 'Acessibilidade'],
        createdAt: DateTime.now().subtract(const Duration(days: 300)),
      ),
      BusStop(
        id: '${routeId}_stop_3',
        name: 'Hospital das Clinicas',
        description: 'Parada hospitalar com prioridade',
        position: const LatLng(-23.5525, -46.6353),
        type: BusStopType.hospital,
        routeId: routeId,
        routeName: routeName,
        sequence: 3,
        estimatedArrival: baseTime.add(const Duration(minutes: 18)),
        lastVisit: baseTime.subtract(const Duration(minutes: 60)),
        hasAccessibility: true,
        hasShelter: true,
        hasSeating: true,
        address: 'Av. Dr. Eneas de Carvalho Aguiar, 255',
        landmark: 'Hospital das Clinicas',
        amenities: ['Wi-Fi', 'Cobertura', 'Acessibilidade', 'Prioridade'],
        createdAt: DateTime.now().subtract(const Duration(days: 400)),
      ),
      BusStop(
        id: '${routeId}_stop_4',
        name: 'Escola Municipal',
        description: 'Parada escolar - horarios especiais',
        position: const LatLng(-23.5535, -46.6363),
        type: BusStopType.school,
        routeId: routeId,
        routeName: routeName,
        sequence: 4,
        estimatedArrival: baseTime.add(const Duration(minutes: 25)),
        lastVisit: baseTime.subtract(const Duration(minutes: 90)),
        hasSeating: true,
        address: 'Rua das Flores, 123',
        landmark: 'Escola Municipal Joao Silva',
        amenities: ['Horario Escolar'],
        createdAt: DateTime.now().subtract(const Duration(days: 200)),
      ),
      BusStop(
        id: '${routeId}_stop_5',
        name: 'Bairro Residencial',
        description: 'Parada residencial',
        position: const LatLng(-23.5545, -46.6373),
        routeId: routeId,
        routeName: routeName,
        sequence: 5,
        estimatedArrival: baseTime.add(const Duration(minutes: 32)),
        lastVisit: baseTime.subtract(const Duration(minutes: 120)),
        hasShelter: true,
        address: 'Rua dos Jardins, 456',
        landmark: 'Proximo ao Parque Municipal',
        amenities: ['Cobertura'],
        createdAt: DateTime.now().subtract(const Duration(days: 150)),
      ),
    ];
  }

  List<BusStop> _getMockNearbyStops(LatLng position) =>
      _getAllMockBusStops().take(3).toList();

  List<BusStop> _getAllMockBusStops() => [
        ..._getMockBusStops('route_1'),
        ..._getMockBusStops('route_2'),
        ..._getMockBusStops('route_3'),
        ..._getMockBusStops('route_4'),
        ..._getMockBusStops('route_5'),
      ];

  BusStop? _getMockBusStop(String stopId) =>
      _getAllMockBusStops().where((stop) => stop.id == stopId).firstOrNull;

  String _getRouteNameByNumber(String routeNumber) {
    switch (routeNumber) {
      case '1':
        return 'Centro - Shopping';
      case '2':
        return 'Hospital - Universidade';
      case '3':
        return 'Aeroporto - Rodoviaria';
      case '4':
        return 'Bairro Norte - Sul';
      case '5':
        return 'Circular Centro';
      default:
        return 'Linha $routeNumber';
    }
  }
}

// Provider para o servico
final busStopServiceProvider = Provider<BusStopService>((ref) {
  final supabaseService = ref.watch(supabaseServiceProvider);
  return BusStopService(supabaseService);
});

// Provider para pontos de parada por rota
final busStopsByRouteProvider =
    FutureProvider.family<List<BusStop>, String>((ref, routeId) {
  final service = ref.watch(busStopServiceProvider);
  return service.getBusStopsByRoute(routeId);
});

// Provider para pontos de parada proximos
final nearbyBusStopsProvider =
    FutureProvider.family<List<BusStop>, LatLng>((ref, position) {
  final service = ref.watch(busStopServiceProvider);
  return service.getNearbyBusStops(position);
});

// Provider para todos os pontos de parada
final allBusStopsProvider = FutureProvider<List<BusStop>>((ref) {
  final service = ref.watch(busStopServiceProvider);
  return service.getAllBusStops();
});
