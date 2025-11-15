// ========================================
// GolfFox Vehicle Position Simulator
// Simula atualizacoes de posicoes em tempo real
// ========================================

import 'dart:async';
import 'dart:math';

import '../core/services/logger_service.dart';
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
    LoggerService.instance.info('Iniciando simulacao de posicoes dos veiculos...');

    _simulationTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      _updateRandomVehiclePosition();
    });
  }

  /// Para a simulacao
  void stopSimulation() {
    _isRunning = false;
    _simulationTimer?.cancel();
    _simulationTimer = null;
    LoggerService.instance.info('Simulacao de posicoes parada.');
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

      LoggerService.instance.debug(
        'Posicao atualizada para veiculo $vehicleId: ($newLat, $newLng)',
      );
    } on Exception catch (error, stackTrace) {
      LoggerService.instance.error(
        'Erro ao atualizar posicao do veiculo',
        error,
        stackTrace,
      );
    }
  }

  /// Simula mudanca de status de um veiculo
  Future<void> simulateStatusChange(String vehicleId, String newStatus) async {
    try {
      await _supabaseService.client.from('vehicle_positions').update({
        'status': newStatus,
        'last_update': DateTime.now().toIso8601String(),
      }).eq('vehicle_id', vehicleId);

      LoggerService.instance.info(
        'Status do veiculo $vehicleId alterado para: $newStatus',
      );
    } on Exception catch (error, stackTrace) {
      LoggerService.instance.error(
        'Erro ao alterar status do veiculo',
        error,
        stackTrace,
      );
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

      LoggerService.instance.debug(
        'Contagem de passageiros do veiculo $vehicleId alterada para: $newCount',
      );
    } on Exception catch (error, stackTrace) {
      LoggerService.instance.error(
        'Erro ao alterar contagem de passageiros',
        error,
        stackTrace,
      );
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

        LoggerService.instance.debug(
          'Veiculo $vehicleId movido para: (${waypoint['lat']}, ${waypoint['lng']})',
        );

        // Aguardar antes do proximo ponto
        await Future<void>.delayed(const Duration(seconds: 10));
      }
    } on Exception catch (error, stackTrace) {
      LoggerService.instance.error('Erro ao simular rota', error, stackTrace);
    }
  }

  bool get isRunning => _isRunning;

  void dispose() {
    stopSimulation();
  }
}
