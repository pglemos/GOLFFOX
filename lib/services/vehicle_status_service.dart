// lib/services/vehicle_status_service.dart
import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/vehicle_status.dart' as vs;
import '../models/driver_position.dart';
import '../models/garage.dart';
import '../models/vehicle_position.dart';
import 'supabase_service.dart';

class VehicleStatusService extends ChangeNotifier {

  VehicleStatusService(this._supabaseService);
  final SupabaseService _supabaseService;

  // Cache de status dos veiculos
  final Map<String, vs.VehicleStatus> _vehicleStatuses = {};
  final Map<String, DriverPosition> _lastPositions = {};
  final List<Garage> _garages = [];

  // Timer para atualizacao periodica
  Timer? _updateTimer;

  // Stream subscription para realtime
  StreamSubscription? _realtimeSubscription;

  /// Obtem o status atual de um veiculo
  vs.VehicleStatus? getVehicleStatus(String vehicleId) => _vehicleStatuses[vehicleId];

  /// Obtem todos os status dos veiculos
  Map<String, vs.VehicleStatus> get allVehicleStatuses =>
      Map.unmodifiable(_vehicleStatuses);

  /// Obtem a ultima posicao de um motorista
  DriverPosition? getLastPosition(String driverId) => _lastPositions[driverId];

  /// Inicializa o servico
  Future<void> initialize() async {
    try {
      // Carregar garagens
      await _loadGarages();

      // Carregar associacoes motorista-veiculo
      await _loadDriverVehicleAssociations();

      // Carregar veiculos na garagem
      await _loadVehiclesInGarage();

      // Carregar posicoes iniciais
      await _loadInitialPositions();

      // Calcular status inicial
      _calculateAllStatuses();

      // Configurar timer de atualizacao (a cada 30 segundos)
      _updateTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        _calculateAllStatuses();
      });

      // Configurar realtime
      _setupRealtimeSubscription();

      debugPrint(
          'VehicleStatusService inicializado com ${_vehicleStatuses.length} veiculos');
    } catch (e) {
      debugPrint('Erro ao inicializar VehicleStatusService: $e');
    }
  }

  /// Carrega as garagens do Supabase
  Future<void> _loadGarages() async {
    try {
      final response = await _supabaseService.client
          .from('garages')
          .select()
          .eq('is_active', true);

      _garages.clear();
      for (final garageData in response) {
        _garages.add(Garage.fromJson(garageData));
      }

      debugPrint('Carregadas ${_garages.length} garagens');
    } catch (e) {
      debugPrint('Erro ao carregar garagens: $e');
    }
  }

  /// Carrega as posicoes iniciais dos motoristas
  Future<void> _loadInitialPositions() async {
    try {
      // Buscar as ultimas posicoes de cada motorista
      final response = await _supabaseService.client
          .from('driver_positions')
          .select('*, trips!inner(driver_id, vehicle_id)')
          .order('captured_at', ascending: false);

      _lastPositions.clear();
      final processedDrivers = <String>{};

      for (final positionData in response) {
        final driverId = positionData['trips']['driver_id'] as String?;
        if (driverId != null && !processedDrivers.contains(driverId)) {
          _lastPositions[driverId] = DriverPosition.fromJson(positionData);
          processedDrivers.add(driverId);
        }
      }

      debugPrint('Carregadas ${_lastPositions.length} posicoes de motoristas');
    } catch (e) {
      debugPrint('Erro ao carregar posicoes iniciais: $e');
    }
  }

  /// Calcula o status de todos os veiculos
  void _calculateAllStatuses() {
    final now = DateTime.now();

    for (final entry in _lastPositions.entries) {
      final driverId = entry.key;
      final position = entry.value;

      // Buscar o veiculo associado ao motorista
      final vehicleId = _getVehicleIdForDriver(driverId);
      if (vehicleId == null) continue;

      // Verificar se o veiculo esta na garagem (flag do banco)
      final isInGarage = _isVehicleInGarage(vehicleId);

      // Calcular status
      final statusType = vs.VehicleStatusCalculator.calculateStatus(
        lastPosition: position,
        garages: _garages,
        isVehicleInGarage: isInGarage,
      );

      // Calcular duracao parado se aplicavel
      Duration? stoppedDuration;
      if (statusType == vs.VehicleStatusType.stoppedShort ||
          statusType == vs.VehicleStatusType.stoppedLong) {
        stoppedDuration = now.difference(position.timestamp);
      }

      // Atualizar cache
      _vehicleStatuses[vehicleId] = vs.VehicleStatus(
        vehicleId: vehicleId,
        status: statusType,
        lastPosition: position,
        stoppedDuration: stoppedDuration,
        calculatedAt: now,
      );
    }

    notifyListeners();
  }

  /// Cache de associacoes motorista -> veiculo
  final Map<String, String> _driverVehicleMap = {};

  /// Obtem o ID do veiculo para um motorista
  String? _getVehicleIdForDriver(String driverId) => _driverVehicleMap[driverId];

  /// Carrega as associacoes motorista -> veiculo das trips ativas
  Future<void> _loadDriverVehicleAssociations() async {
    try {
      final response = await _supabaseService.client
          .from('trips')
          .select('driver_id, vehicle_id')
          .eq('status', 'in_progress');

      for (final trip in response) {
        final driverId = trip['driver_id'] as String?;
        final vehicleId = trip['vehicle_id'] as String?;

        if (driverId != null && vehicleId != null) {
          _driverVehicleMap[driverId] = vehicleId;
        }
      }

      debugPrint(
          'Carregadas ${_driverVehicleMap.length} associacoes motorista-veiculo');
    } catch (e) {
      debugPrint('Erro ao carregar associacoes motorista-veiculo: $e');
    }
  }

  /// Cache de veiculos na garagem
  final Set<String> _vehiclesInGarage = {};

  /// Verifica se o veiculo esta na garagem (flag do banco)
  bool _isVehicleInGarage(String vehicleId) => _vehiclesInGarage.contains(vehicleId);

  /// Carrega os veiculos que estao na garagem
  Future<void> _loadVehiclesInGarage() async {
    try {
      final response = await _supabaseService.client
          .from('vehicles')
          .select('id')
          .eq('is_in_garage', true);

      _vehiclesInGarage.clear();
      for (final vehicle in response) {
        final vehicleId = vehicle['id'] as String?;
        if (vehicleId != null) {
          _vehiclesInGarage.add(vehicleId);
        }
      }

      debugPrint('Carregados ${_vehiclesInGarage.length} veiculos na garagem');
    } catch (e) {
      debugPrint('Erro ao carregar veiculos na garagem: $e');
    }
  }

  /// Configura a subscription do Supabase Realtime
  void _setupRealtimeSubscription() {
    try {
      _realtimeSubscription = _supabaseService.client
          .from('driver_positions')
          .stream(primaryKey: ['id']).listen(_handleRealtimeUpdate);

      debugPrint('Realtime subscription configurada para driver_positions');
    } catch (e) {
      debugPrint('Erro ao configurar realtime subscription: $e');
    }
  }

  /// Processa atualizacoes em tempo real
  void _handleRealtimeUpdate(List<Map<String, dynamic>> data) {
    var hasUpdates = false;

    for (final positionData in data) {
      try {
        final position = DriverPosition.fromJson(positionData);
        final driverId = position.driverId;

        // Atualizar posicao no cache
        final currentPosition = _lastPositions[driverId];
        if (currentPosition == null ||
            position.timestamp.isAfter(currentPosition.timestamp)) {
          _lastPositions[driverId] = position;
          hasUpdates = true;
        }
            } catch (e) {
        debugPrint('Erro ao processar atualizacao realtime: $e');
      }
    }

    if (hasUpdates) {
      // Recalcular status apenas dos veiculos atualizados
      _calculateAllStatuses();
    }
  }

  /// Forca atualizacao de um veiculo especifico
  Future<void> updateVehicleStatus(String vehicleId) async {
    try {
      // Buscar a ultima posicao do motorista deste veiculo
      final response = await _supabaseService.client
          .from('driver_positions')
          .select('*, trips!inner(driver_id, vehicle_id)')
          .eq('trips.vehicle_id', vehicleId)
          .order('captured_at', ascending: false)
          .limit(1);

      if (response.isNotEmpty) {
        final positionData = response.first;
        final driverId = positionData['trips']['driver_id'] as String?;

        if (driverId != null) {
          _lastPositions[driverId] = DriverPosition.fromJson(positionData);
          _calculateAllStatuses();
        }
      }
    } catch (e) {
      debugPrint('Erro ao atualizar status do veiculo $vehicleId: $e');
    }
  }

  /// Obtem estatisticas dos status
  Map<vs.VehicleStatusType, int> getStatusStatistics() {
    final stats = <vs.VehicleStatusType, int>{};

    for (final status in vs.VehicleStatusType.values) {
      stats[status] = 0;
    }

    for (final vehicleStatus in _vehicleStatuses.values) {
      stats[vehicleStatus.status] = (stats[vehicleStatus.status] ?? 0) + 1;
    }

    return stats;
  }

  @override
  void dispose() {
    _updateTimer?.cancel();
    _realtimeSubscription?.cancel();
    super.dispose();
  }
}
