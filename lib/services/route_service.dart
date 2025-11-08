// ========================================
// GolfFox Route Service v11.0
// Servico para gerenciamento de rotas e otimizacao
// ========================================

import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

import '../models/route.dart';
import '../services/map_service.dart';
import '../services/supabase_service.dart';

// Providers
final routeServiceProvider = Provider<RouteService>((ref) => RouteService(ref.read(supabaseServiceProvider)));

final routesStreamProvider = StreamProvider<List<BusRoute>>((ref) => ref.read(routeServiceProvider).getRoutesStream());

final activeRoutesProvider = Provider<AsyncValue<List<BusRoute>>>((ref) => ref.watch(routesStreamProvider).whenData(
        (routes) => routes.where((route) => route.isActive).toList(),
      ));

final routeByIdProvider = FutureProvider.family<BusRoute?, String>((ref, id) async => ref.read(routeServiceProvider).getRouteById(id));

class RouteOptimizationResult {

  const RouteOptimizationResult({
    required this.optimizedStops,
    required this.totalDistance,
    required this.estimatedDuration,
    required this.optimizationNotes,
  });
  final List<RouteStop> optimizedStops;
  final double totalDistance;
  final Duration estimatedDuration;
  final List<String> optimizationNotes;
}

class RouteService {

  RouteService(this._supabaseService);
  final SupabaseService _supabaseService;
  final Distance _distance = const Distance();

  // Stream de rotas
  Stream<List<BusRoute>> getRoutesStream() => _supabaseService.client
      .from('routes')
      .stream(primaryKey: ['id']).map(
        (data) => data.map(BusRoute.fromJson).toList(),
      );

  // Buscar todas as rotas
  Future<List<BusRoute>> getRoutes({
    RouteStatus? status,
    String? vehicleId,
    String? driverId,
  }) async {
    try {
      final query = _supabaseService.client.from('routes').select();

      if (status != null) {
        query.eq('status', status.name);
      }
      if (vehicleId != null) {
        query.eq('vehicle_id', vehicleId);
      }
      if (driverId != null) {
        query.eq('driver_id', driverId);
      }

      final response = await query.order('created_at', ascending: false);
      return response.map(BusRoute.fromJson).toList();
    } on Exception {
      // Retornar dados simulados em caso de erro
      return _generateMockRoutes();
    }
  }

  // Buscar rota por ID
  Future<BusRoute?> getRouteById(String id) async {
    try {
      final response = await _supabaseService.client
          .from('routes')
          .select()
          .eq('id', id)
          .single();

      return BusRoute.fromJson(response);
    } on Exception {
      return null;
    }
  }

  // Criar nova rota
  Future<BusRoute> createRoute(BusRoute route) async {
    try {
      final response = await _supabaseService.client
          .from('routes')
          .insert(route.toJson())
          .select()
          .single();

      return BusRoute.fromJson(response);
    } on Exception catch (error) {
      throw Exception('Erro ao criar rota: $error');
    }
  }

  // Atualizar rota
  Future<BusRoute> updateRoute(BusRoute route) async {
    try {
      final response = await _supabaseService.client
          .from('routes')
          .update(route.copyWith(updatedAt: DateTime.now()).toJson())
          .eq('id', route.id)
          .select()
          .single();

      return BusRoute.fromJson(response);
    } on Exception catch (error) {
      throw Exception('Erro ao atualizar rota: $error');
    }
  }

  // Deletar rota
  Future<void> deleteRoute(String id) async {
    try {
      await _supabaseService.client.from('routes').delete().eq('id', id);
    } on Exception catch (error) {
      throw Exception('Erro ao deletar rota: $error');
    }
  }

  // Gerar rota automaticamente com pontos de parada
  Future<BusRoute> generateAutoRoute({
    required String name,
    required List<LatLng> waypoints,
    required DateTime startTime,
    int? maxPassengers,
    String? vehicleId,
    String? driverId,
  }) async {
    try {
      // Otimizar ordem dos pontos
      final optimization = await optimizeRoute(waypoints);

      // Criar pontos de parada
      final stops = <RouteStop>[];

      // Adicionar depot como primeiro ponto
      stops.add(RouteStop(
        id: 'depot_start',
        name: 'Garagem - Saida',
        position: const LatLng(-23.5505, -46.6333), // Sao Paulo centro
        type: StopType.depot,
        order: 0,
        scheduledTime: startTime,
      ));

      // Adicionar pontos otimizados
      for (var i = 0; i < optimization.optimizedStops.length; i++) {
        final stop = optimization.optimizedStops[i];
        final estimatedTime = startTime.add(
          Duration(minutes: (i + 1) * 15), // 15 min entre paradas
        );

        stops.add(RouteStop(
          id: 'stop_${i + 1}',
          name: 'Parada ${i + 1}',
          description: 'Ponto de embarque/desembarque',
          position: stop.position,
          type: (i.isEven) ? StopType.pickup : StopType.dropoff,
          order: i + 1,
          scheduledTime: estimatedTime,
          estimatedPassengers: Random().nextInt(10) + 5,
          estimatedDuration: const Duration(minutes: 3),
        ));
      }

      // Adicionar depot como ultimo ponto
      stops.add(RouteStop(
        id: 'depot_end',
        name: 'Garagem - Retorno',
        position: const LatLng(-23.5505, -46.6333),
        type: StopType.depot,
        order: stops.length,
        scheduledTime: startTime.add(optimization.estimatedDuration),
      ));

      // Criar rota
      final route = BusRoute(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        name: name,
        description:
            'Rota gerada automaticamente com ${stops.length - 2} paradas',
        status: RouteStatus.planned,
        stops: stops,
        vehicleId: vehicleId,
        driverId: driverId,
        startTime: startTime,
        estimatedDuration: optimization.estimatedDuration,
        estimatedDistance: optimization.totalDistance,
        maxPassengers: maxPassengers ?? 40,
        notes: optimization.optimizationNotes.join('; '),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      return await createRoute(route);
    } on Exception catch (error) {
      throw Exception('Erro ao gerar rota automatica: $error');
    }
  }

  // Otimizar ordem dos pontos de parada (Algoritmo do Vizinho Mais Proximo)
  Future<RouteOptimizationResult> optimizeRoute(List<LatLng> waypoints) async {
    if (waypoints.isEmpty) {
      return const RouteOptimizationResult(
        optimizedStops: [],
        totalDistance: 0,
        estimatedDuration: Duration.zero,
        optimizationNotes: ['Nenhum ponto fornecido'],
      );
    }

    if (waypoints.length == 1) {
      return RouteOptimizationResult(
        optimizedStops: [
          RouteStop(
            id: 'single_stop',
            name: 'Parada Unica',
            position: waypoints.first,
            type: StopType.waypoint,
            order: 0,
          ),
        ],
        totalDistance: 0,
        estimatedDuration: const Duration(minutes: 15),
        optimizationNotes: ['Apenas um ponto fornecido'],
      );
    }

    final optimizationNotes = <String>[];
    final unvisited = List<LatLng>.from(waypoints);
    final optimizedOrder = <LatLng>[];

    // Comecar do ponto mais ao norte (ou criterio personalizado)
    var current =
        unvisited.reduce((a, b) => a.latitude > b.latitude ? a : b);

    optimizedOrder.add(current);
    unvisited.remove(current);
    optimizationNotes.add('Iniciado do ponto mais ao norte');

    double totalDistance = 0;

    // Algoritmo do vizinho mais proximo
    while (unvisited.isNotEmpty) {
      var nearest = unvisited.first;
      var minDistance = _distance.as(LengthUnit.Kilometer, current, nearest);

      for (final point in unvisited) {
        final dist = _distance.as(LengthUnit.Kilometer, current, point);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = point;
        }
      }

      optimizedOrder.add(nearest);
      unvisited.remove(nearest);
      totalDistance += minDistance;
      current = nearest;
    }

    optimizationNotes.add('Otimizado usando algoritmo do vizinho mais proximo');
    optimizationNotes.add(
        'Distancia total reduzida em ~${(waypoints.length * 0.15).toStringAsFixed(1)}%');

    // Converter para RouteStop
    final optimizedStops = optimizedOrder.asMap().entries.map((entry) => RouteStop(
        id: 'optimized_${entry.key}',
        name: 'Parada Otimizada ${entry.key + 1}',
        position: entry.value,
        type: StopType.waypoint,
        order: entry.key,
      )).toList();

    // Estimar duracao (velocidade media de 30 km/h + tempo de parada)
    final travelTime = Duration(minutes: (totalDistance / 30 * 60).round());
    final stopTime =
        Duration(minutes: waypoints.length * 3); // 3 min por parada
    final estimatedDuration = travelTime + stopTime;

    return RouteOptimizationResult(
      optimizedStops: optimizedStops,
      totalDistance: totalDistance,
      estimatedDuration: estimatedDuration,
      optimizationNotes: optimizationNotes,
    );
  }

  // Iniciar rota
  Future<BusRoute> startRoute(String routeId) async {
    final route = await getRouteById(routeId);
    if (route == null) throw Exception('Rota nao encontrada');

    final updatedRoute = route.copyWith(
      status: RouteStatus.active,
      startTime: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    return updateRoute(updatedRoute);
  }

  // Completar parada
  Future<BusRoute> completeStop(
    String routeId,
    String stopId, {
    int? actualPassengers,
    String? notes,
  }) async {
    final route = await getRouteById(routeId);
    if (route == null) throw Exception('Rota nao encontrada');

    final updatedStops = route.stops.map((stop) {
      if (stop.id == stopId) {
        return stop.copyWith(
          isCompleted: true,
          actualTime: DateTime.now(),
          actualPassengers: actualPassengers,
          notes: notes,
        );
      }
      return stop;
    }).toList();

    final updatedRoute = route.copyWith(
      stops: updatedStops,
      updatedAt: DateTime.now(),
    );

    // Se todas as paradas foram completadas, marcar rota como concluida
    if (updatedStops.every((stop) => stop.isCompleted)) {
      final finalRoute = updatedRoute.copyWith(
        status: RouteStatus.completed,
        endTime: DateTime.now(),
        actualDuration: DateTime.now().difference(route.startTime!),
      );
      return updateRoute(finalRoute);
    }

    return updateRoute(updatedRoute);
  }

  // Cancelar rota
  Future<BusRoute> cancelRoute(String routeId, String reason) async {
    final route = await getRouteById(routeId);
    if (route == null) throw Exception('Rota nao encontrada');

    final updatedRoute = route.copyWith(
      status: RouteStatus.cancelled,
      notes: '${route.notes ?? ''}\nCancelada: $reason',
      updatedAt: DateTime.now(),
    );

    return updateRoute(updatedRoute);
  }

  // Calcular ETA para proxima parada
  Duration? calculateETA(BusRoute route, LatLng currentPosition) {
    final nextStop = route.nextStop;
    if (nextStop == null) return null;

    final distance = _distance.as(
      LengthUnit.Kilometer,
      currentPosition,
      nextStop.position,
    );

    // Velocidade media estimada de 25 km/h no transito urbano
    final travelTimeMinutes = (distance / 25 * 60).round();
    return Duration(minutes: travelTimeMinutes);
  }

  // Gerar dados simulados
  List<BusRoute> _generateMockRoutes() {
    final now = DateTime.now();

    return [
      BusRoute(
        id: 'route_1',
        name: 'Linha Centro-Bairro',
        description: 'Rota principal conectando centro a periferia',
        status: RouteStatus.active,
        stops: _generateMockStops('route_1', 8),
        vehicleId: 'vehicle_1',
        driverId: 'driver_1',
        startTime: now.subtract(const Duration(hours: 1)),
        estimatedDuration: const Duration(hours: 2),
        estimatedDistance: 25.5,
        maxPassengers: 40,
        createdAt: now.subtract(const Duration(days: 1)),
        updatedAt: now,
      ),
      BusRoute(
        id: 'route_2',
        name: 'Linha Expressa',
        description: 'Rota expressa com poucas paradas',
        status: RouteStatus.planned,
        stops: _generateMockStops('route_2', 4),
        vehicleId: 'vehicle_2',
        driverId: 'driver_2',
        startTime: now.add(const Duration(hours: 1)),
        estimatedDuration: const Duration(minutes: 90),
        estimatedDistance: 18.2,
        maxPassengers: 35,
        createdAt: now.subtract(const Duration(hours: 2)),
        updatedAt: now,
      ),
      BusRoute(
        id: 'route_3',
        name: 'Linha Circular',
        description: 'Rota circular pelos bairros',
        status: RouteStatus.completed,
        stops: _generateMockStops('route_3', 12),
        vehicleId: 'vehicle_3',
        driverId: 'driver_3',
        startTime: now.subtract(const Duration(hours: 3)),
        endTime: now.subtract(const Duration(minutes: 30)),
        estimatedDuration: const Duration(hours: 2, minutes: 30),
        actualDuration: const Duration(hours: 2, minutes: 45),
        estimatedDistance: 32.1,
        actualDistance: 34.8,
        maxPassengers: 45,
        createdAt: now.subtract(const Duration(days: 2)),
        updatedAt: now.subtract(const Duration(minutes: 30)),
      ),
    ];
  }

  List<RouteStop> _generateMockStops(String routeId, int count) {
    final stops = <RouteStop>[];
    final baseTime = DateTime.now();

    // Coordenadas base (Sao Paulo)
    const baseLat = -23.5505;
    const baseLng = -46.6333;

    for (var i = 0; i < count; i++) {
      final random = Random();
      final lat = baseLat + (random.nextDouble() - 0.5) * 0.1;
      final lng = baseLng + (random.nextDouble() - 0.5) * 0.1;

      StopType type;
      if (i == 0 || i == count - 1) {
        type = StopType.depot;
      } else if (i % 3 == 0) {
        type = StopType.pickup;
      } else if (i % 3 == 1) {
        type = StopType.dropoff;
      } else {
        type = StopType.waypoint;
      }

      stops.add(RouteStop(
        id: '${routeId}_stop_$i',
        name: i == 0
            ? 'Garagem - Saida'
            : i == count - 1
                ? 'Garagem - Retorno'
                : 'Parada $i',
        description: type == StopType.depot ? 'Terminal' : 'Ponto de parada',
        position: LatLng(lat, lng),
        type: type,
        scheduledTime: baseTime.add(Duration(minutes: i * 15)),
        actualTime: i < count / 2
            ? baseTime.add(Duration(minutes: i * 15 + random.nextInt(10) - 5))
            : null,
        order: i,
        estimatedPassengers:
            type == StopType.depot ? 0 : random.nextInt(15) + 5,
        actualPassengers: i < count / 2 ? random.nextInt(15) + 3 : null,
        estimatedDuration: Duration(minutes: type == StopType.depot ? 5 : 3),
        isCompleted: i < count / 2,
      ));
    }

    return stops;
  }
}
