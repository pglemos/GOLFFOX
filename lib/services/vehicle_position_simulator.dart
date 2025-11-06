// ========================================
// GolfFox Vehicle Position Simulator
// Simula atualizacoes de posicoes em tempo real
// ========================================

import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'supabase_service.dart';

class VehiclePositionSimulator {

  VehiclePositionSimulator(this._supabaseService);
  final SupabaseService _supabaseService;
  Timer? _simulationTimer;
  final Random _random = Random();
  bool _isRunning = false;

  /// Inicia a simulacao de movimento dos veiculos
  void startSimulation() {
    if (_isRunning) return;

    _isRunning = true;
    debugPrint('Iniciando simulacao de posicoes dos veiculos...');

    _simulationTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      _updateRandomVehiclePosition();
    });
  }

  /// Para a simulacao
  void stopSimulation() {
    _isRunning = false;
    _simulationTimer?.cancel();
    _simulationTimer = null;
    debugPrint('Simulacao de posicoes parada.');
  }

  /// Atualiza a posicao de um veiculo aleatorio
  Future<void> _updateRandomVehiclePosition() async {
    try {
      // Buscar todos os veiculos
      final vehicles =
          await _supabaseService.client.from('vehicle_positions').select();

      if (vehicles.isEmpty) return;

      // Selecionar um veiculo aleatorio
      final vehicle = vehicles[_random.nextInt(vehicles.length)];
      final vehicleId = vehicle['vehicle_id'] as String;

      // Gerar nova posicao proxima a atual
      final currentLat = (vehicle['latitude'] as num).toDouble();
      final currentLng = (vehicle['longitude'] as num).toDouble();

      final newLat = currentLat + (_random.nextDouble() - 0.5) * 0.002; // ~200m
      final newLng = currentLng + (_random.nextDouble() - 0.5) * 0.002;

      // Gerar nova velocidade e direcao
      final newSpeed = _random.nextDouble() * 60; // 0-60 km/h
      final newHeading = _random.nextDouble() * 360; // 0-360 graus

      // Atualizar no banco
      await _supabaseService.client.from('vehicle_positions').update({
        'latitude': newLat,
        'longitude': newLng,
        'speed': newSpeed,
        'heading': newHeading,
        'last_update': DateTime.now().toIso8601String(),
      }).eq('vehicle_id', vehicleId);

      debugPrint(
          'Posicao atualizada para veiculo $vehicleId: ($newLat, $newLng)');
    } catch (e) {
      debugPrint('Erro ao atualizar posicao do veiculo: $e');
    }
  }

  /// Simula mudanca de status de um veiculo
  Future<void> simulateStatusChange(String vehicleId, String newStatus) async {
    try {
      await _supabaseService.client.from('vehicle_positions').update({
        'status': newStatus,
        'last_update': DateTime.now().toIso8601String(),
      }).eq('vehicle_id', vehicleId);

      debugPrint('Status do veiculo $vehicleId alterado para: $newStatus');
    } catch (e) {
      debugPrint('Erro ao alterar status do veiculo: $e');
    }
  }

  /// Simula mudanca na contagem de passageiros
  Future<void> simulatePassengerCountChange(String vehicleId) async {
    try {
      final newCount = _random.nextInt(35); // 0-34 passageiros

      await _supabaseService.client.from('vehicle_positions').update({
        'passenger_count': newCount,
        'last_update': DateTime.now().toIso8601String(),
      }).eq('vehicle_id', vehicleId);

      debugPrint(
          'Contagem de passageiros do veiculo $vehicleId alterada para: $newCount');
    } catch (e) {
      debugPrint('Erro ao alterar contagem de passageiros: $e');
    }
  }

  /// Simula uma rota completa para um veiculo
  Future<void> simulateRoute(
      String vehicleId, List<Map<String, double>> waypoints) async {
    if (!_isRunning) return;

    try {
      for (final waypoint in waypoints) {
        if (!_isRunning) break;

        await _supabaseService.client.from('vehicle_positions').update({
          'latitude': waypoint['lat'],
          'longitude': waypoint['lng'],
          'speed': 30 + _random.nextDouble() * 30, // 30-60 km/h
          'heading': _random.nextDouble() * 360,
          'last_update': DateTime.now().toIso8601String(),
        }).eq('vehicle_id', vehicleId);

        debugPrint(
            'Veiculo $vehicleId movido para: (${waypoint['lat']}, ${waypoint['lng']})');

        // Aguardar antes do proximo ponto
        await Future.delayed(const Duration(seconds: 10));
      }
    } catch (e) {
      debugPrint('Erro ao simular rota: $e');
    }
  }

  bool get isRunning => _isRunning;

  void dispose() {
    stopSimulation();
  }
}
