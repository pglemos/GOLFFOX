// ========================================
// GolfFox Vehicle Service v11.0
// Servico para gerenciamento de veiculos
// ========================================

import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../models/fuel_record.dart';
import '../models/maintenance.dart';
import '../models/vehicle.dart';

// Providers
final vehicleServiceProvider =
    Provider<VehicleService>((ref) => VehicleService());

final vehiclesStreamProvider = StreamProvider<List<Vehicle>>(
  (ref) => ref.read(vehicleServiceProvider).getVehiclesStream(),
);

final vehicleProvider = FutureProvider.family<Vehicle?, String>(
  (ref, vehicleId) => ref.read(vehicleServiceProvider).getVehicleById(
        vehicleId,
      ),
);

final vehicleMaintenanceProvider =
    FutureProvider.family<List<MaintenanceRecord>, String>(
  (ref, vehicleId) =>
      ref.read(vehicleServiceProvider).getVehicleMaintenance(vehicleId),
);

final vehicleFuelRecordsProvider =
    FutureProvider.family<List<FuelRecord>, String>(
  (ref, vehicleId) =>
      ref.read(vehicleServiceProvider).getVehicleFuelRecords(vehicleId),
);

class VehicleFilters {
  const VehicleFilters({
    this.statuses,
    this.types,
    this.fuelTypes,
    this.searchQuery,
    this.needsMaintenance,
    this.hasLowFuel,
    this.hasExpiringDocuments,
    this.companyId,
  });
  static const _unset = Object();

  final List<VehicleStatus>? statuses;
  final List<VehicleType>? types;
  final List<FuelType>? fuelTypes;
  final String? searchQuery;
  final bool? needsMaintenance;
  final bool? hasLowFuel;
  final bool? hasExpiringDocuments;
  final String? companyId;

  VehicleFilters copyWith({
    Object? statuses = _unset,
    Object? types = _unset,
    Object? fuelTypes = _unset,
    Object? searchQuery = _unset,
    Object? needsMaintenance = _unset,
    Object? hasLowFuel = _unset,
    Object? hasExpiringDocuments = _unset,
    Object? companyId = _unset,
  }) =>
      VehicleFilters(
        statuses: statuses == _unset
            ? this.statuses
            : statuses as List<VehicleStatus>?,
        types: types == _unset ? this.types : types as List<VehicleType>?,
        fuelTypes:
            fuelTypes == _unset ? this.fuelTypes : fuelTypes as List<FuelType>?,
        searchQuery:
            searchQuery == _unset ? this.searchQuery : searchQuery as String?,
        needsMaintenance: needsMaintenance == _unset
            ? this.needsMaintenance
            : needsMaintenance as bool?,
        hasLowFuel:
            hasLowFuel == _unset ? this.hasLowFuel : hasLowFuel as bool?,
        hasExpiringDocuments: hasExpiringDocuments == _unset
            ? this.hasExpiringDocuments
            : hasExpiringDocuments as bool?,
        companyId: companyId == _unset ? this.companyId : companyId as String?,
      );

  bool get hasActiveFilters =>
      (statuses?.isNotEmpty ?? false) ||
      (types?.isNotEmpty ?? false) ||
      (fuelTypes?.isNotEmpty ?? false) ||
      (searchQuery?.isNotEmpty ?? false) ||
      (needsMaintenance ?? false) ||
      (hasLowFuel ?? false) ||
      (hasExpiringDocuments ?? false) ||
      (companyId?.isNotEmpty ?? false);
}

class VehicleService {
  VehicleService() {
    _startRealTimeUpdates();
  }
  final StreamController<List<Vehicle>> _vehiclesController =
      StreamController<List<Vehicle>>.broadcast();
  Timer? _updateTimer;
  List<Vehicle> _cachedVehicles = [];

  void dispose() {
    _updateTimer?.cancel();
    _vehiclesController.close();
  }

  // Stream de veiculos
  Stream<List<Vehicle>> getVehiclesStream() => _vehiclesController.stream;

  // Iniciar atualizacoes em tempo real
  void _startRealTimeUpdates() {
    _loadVehicles();
    _updateTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      _loadVehicles();
    });
  }

  // Carregar veiculos
  Future<void> _loadVehicles() async {
    try {
      final vehicles = await _generateMockVehicles();
      _cachedVehicles = vehicles;
      _vehiclesController.add(vehicles);
    } on Object catch (error, stackTrace) {
      debugPrint('Erro ao carregar veículos: $error');
      debugPrintStack(stackTrace: stackTrace);
    }
  }

  // Buscar veiculos com filtros
  Future<List<Vehicle>> getVehicles({VehicleFilters? filters}) async {
    await _loadVehicles();

    final filter = filters;
    if (filter == null || !filter.hasActiveFilters) {
      return _cachedVehicles;
    }

    final activeFilter = filter;

    return _cachedVehicles.where((vehicle) {
      final statusFilters = activeFilter.statuses;
      if (statusFilters != null &&
          statusFilters.isNotEmpty &&
          !statusFilters.contains(vehicle.status)) {
        return false;
      }

      final typeFilters = activeFilter.types;
      if (typeFilters != null &&
          typeFilters.isNotEmpty &&
          !typeFilters.contains(vehicle.type)) {
        return false;
      }

      final fuelFilters = activeFilter.fuelTypes;
      if (fuelFilters != null &&
          fuelFilters.isNotEmpty &&
          !fuelFilters.contains(vehicle.fuelType)) {
        return false;
      }

      final searchQuery = activeFilter.searchQuery;
      if (searchQuery != null && searchQuery.isNotEmpty) {
        final query = searchQuery.toLowerCase();
        if (!vehicle.name.toLowerCase().contains(query) &&
            !(vehicle.documents.licensePlate?.toLowerCase().contains(query) ??
                false) &&
            !vehicle.specifications.manufacturer
                .toLowerCase()
                .contains(query) &&
            !vehicle.specifications.model.toLowerCase().contains(query)) {
          return false;
        }
      }

      if ((activeFilter.needsMaintenance ?? false) &&
          !vehicle.needsMaintenance) {
        return false;
      }

      if ((activeFilter.hasLowFuel ?? false) && !vehicle.hasLowFuel) {
        return false;
      }

      if ((activeFilter.hasExpiringDocuments ?? false) &&
          !vehicle.hasExpiringDocuments) {
        return false;
      }

      final companyId = activeFilter.companyId;
      if (companyId != null &&
          companyId.isNotEmpty &&
          vehicle.companyId != companyId) {
        return false;
      }

      return true;
    }).toList();
  }

  // Buscar veiculo por ID
  Future<Vehicle?> getVehicleById(String vehicleId) async {
    await _loadVehicles();
    for (final vehicle in _cachedVehicles) {
      if (vehicle.id == vehicleId) {
        return vehicle;
      }
    }
    return null;
  }

  // Criar veiculo
  Future<Vehicle> createVehicle(Vehicle vehicle) async {
    try {
      // Simular criacao no banco
      await Future<void>.delayed(const Duration(milliseconds: 500));

      final newVehicle = vehicle.copyWith(
        id: _generateId(),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      _cachedVehicles.add(newVehicle);
      _vehiclesController.add(_cachedVehicles);

      return newVehicle;
    } on Object catch (error) {
      throw Exception('Erro ao criar veiculo: $error');
    }
  }

  // Atualizar veiculo
  Future<Vehicle> updateVehicle(Vehicle vehicle) async {
    try {
      // Simular atualizacao no banco
      await Future<void>.delayed(const Duration(milliseconds: 500));

      final updatedVehicle = vehicle.copyWith(
        updatedAt: DateTime.now(),
      );

      final index = _cachedVehicles.indexWhere((v) => v.id == vehicle.id);
      if (index != -1) {
        _cachedVehicles[index] = updatedVehicle;
        _vehiclesController.add(_cachedVehicles);
      }

      return updatedVehicle;
    } on Object catch (error) {
      throw Exception('Erro ao atualizar veiculo: $error');
    }
  }

  // Deletar veiculo
  Future<void> deleteVehicle(String vehicleId) async {
    try {
      // Simular exclusao no banco
      await Future<void>.delayed(const Duration(milliseconds: 500));

      _cachedVehicles.removeWhere((v) => v.id == vehicleId);
      _vehiclesController.add(_cachedVehicles);
    } on Object catch (error) {
      throw Exception('Erro ao deletar veiculo: $error');
    }
  }

  // Atualizar posicao do veiculo
  Future<void> updateVehiclePosition(String vehicleId, LatLng position) async {
    try {
      final index = _cachedVehicles.indexWhere((v) => v.id == vehicleId);
      if (index != -1) {
        _cachedVehicles[index] = _cachedVehicles[index].copyWith(
          currentPosition: position,
          updatedAt: DateTime.now(),
        );
        _vehiclesController.add(_cachedVehicles);
      }
    } on Object catch (error) {
      throw Exception('Erro ao atualizar posicao: $error');
    }
  }

  // Atualizar nivel de combustivel
  Future<void> updateFuelLevel(String vehicleId, double fuelLevel) async {
    try {
      final index = _cachedVehicles.indexWhere((v) => v.id == vehicleId);
      if (index != -1) {
        _cachedVehicles[index] = _cachedVehicles[index].copyWith(
          currentFuelLevel: fuelLevel,
          updatedAt: DateTime.now(),
        );
        _vehiclesController.add(_cachedVehicles);
      }
    } on Object catch (error) {
      throw Exception('Erro ao atualizar combustivel: $error');
    }
  }

  // Buscar manutencoes do veiculo
  Future<List<MaintenanceRecord>> getVehicleMaintenance(
      String vehicleId) async {
    try {
      // Simular busca de manutencoes
      await Future<void>.delayed(const Duration(milliseconds: 300));
      return _generateMockMaintenance(vehicleId);
    } on Object catch (error) {
      throw Exception('Erro ao buscar manutencoes: $error');
    }
  }

  // Buscar registros de combustivel
  Future<List<FuelRecord>> getVehicleFuelRecords(String vehicleId) async {
    try {
      // Simular busca de registros
      await Future<void>.delayed(const Duration(milliseconds: 300));
      return _generateMockFuelRecords(vehicleId);
    } on Object catch (error) {
      throw Exception('Erro ao buscar registros de combustivel: $error');
    }
  }

  // Buscar veiculos disponiveis
  Future<List<Vehicle>> getAvailableVehicles() async {
    await _loadVehicles();
    return _cachedVehicles.where((v) => v.isAvailable).toList();
  }

  // Buscar veiculos que precisam de manutencao
  Future<List<Vehicle>> getVehiclesNeedingMaintenance() async {
    await _loadVehicles();
    return _cachedVehicles.where((v) => v.needsMaintenance).toList();
  }

  // Buscar veiculos com combustivel baixo
  Future<List<Vehicle>> getVehiclesWithLowFuel() async {
    await _loadVehicles();
    return _cachedVehicles.where((v) => v.hasLowFuel).toList();
  }

  // Buscar veiculos com documentos vencendo
  Future<List<Vehicle>> getVehiclesWithExpiringDocuments() async {
    await _loadVehicles();
    return _cachedVehicles.where((v) => v.hasExpiringDocuments).toList();
  }

  // Estatisticas dos veiculos
  Future<Map<String, dynamic>> getVehicleStats() async {
    await _loadVehicles();

    final total = _cachedVehicles.length;
    final active = _cachedVehicles.where((v) => v.isActive).length;
    final available = _cachedVehicles.where((v) => v.isAvailable).length;
    final inUse = _cachedVehicles.where((v) => v.isInUse).length;
    final maintenance = _cachedVehicles.where((v) => v.needsMaintenance).length;
    final lowFuel = _cachedVehicles.where((v) => v.hasLowFuel).length;
    final expiringDocs =
        _cachedVehicles.where((v) => v.hasExpiringDocuments).length;

    return {
      'total': total,
      'active': active,
      'available': available,
      'inUse': inUse,
      'maintenance': maintenance,
      'lowFuel': lowFuel,
      'expiringDocuments': expiringDocs,
      'utilizationRate': total > 0 ? (inUse / total * 100).round() : 0,
    };
  }

  // Gerar dados mock
  Future<List<Vehicle>> _generateMockVehicles() async {
    final random = Random();
    final vehicles = <Vehicle>[];

    final vehicleNames = [
      'Onibus Escolar 001',
      'Van Executiva 002',
      'Micro-onibus 003',
      'Onibus Urbano 004',
      'Van Turismo 005',
      'Onibus Rodoviario 006',
      'Micro-onibus 007',
      'Van Escolar 008',
      'Onibus Fretamento 009',
      'Van Corporativa 010',
      'Onibus Municipal 011',
      'Micro-onibus 012',
    ];

    final manufacturers = [
      'Mercedes-Benz',
      'Volvo',
      'Scania',
      'Iveco',
      'Volkswagen'
    ];
    final models = ['OF-1721', 'B270F', 'K270', 'City Class', 'Volksbus'];
    final colors = ['Branco', 'Azul', 'Amarelo', 'Verde', 'Vermelho'];

    for (var i = 0; i < vehicleNames.length; i++) {
      final manufacturer = manufacturers[random.nextInt(manufacturers.length)];
      final model = models[random.nextInt(models.length)];
      final color = colors[random.nextInt(colors.length)];

      vehicles.add(Vehicle(
        id: 'vehicle_${i + 1}',
        name: vehicleNames[i],
        type: VehicleType.values[random.nextInt(VehicleType.values.length)],
        status:
            VehicleStatus.values[random.nextInt(VehicleStatus.values.length)],
        fuelType: FuelType.values[random.nextInt(FuelType.values.length)],
        specifications: VehicleSpecifications(
          capacity: 20 + random.nextInt(30),
          engineSize: 2.0 + random.nextDouble() * 4.0,
          year: 2018 + random.nextInt(6),
          manufacturer: manufacturer,
          model: model,
          color: color,
          fuelTankCapacity: 100.0 + random.nextDouble() * 200.0,
          weight: 3000.0 + random.nextDouble() * 5000.0,
          length: 8.0 + random.nextDouble() * 4.0,
          width: 2.2 + random.nextDouble() * 0.3,
          height: 2.8 + random.nextDouble() * 0.5,
        ),
        documents: VehicleDocuments(
          licensePlate: 'ABC-${1000 + random.nextInt(9000)}',
          chassisNumber: '9BW${random.nextInt(100000000)}',
          renavam: '${100000000 + random.nextInt(900000000)}',
          licenseExpiryDate:
              DateTime.now().add(Duration(days: random.nextInt(365))),
          inspectionExpiryDate:
              DateTime.now().add(Duration(days: random.nextInt(365))),
          insuranceExpiryDate:
              DateTime.now().add(Duration(days: random.nextInt(365))),
          insuranceCompany: 'Seguradora ${i + 1}',
          insurancePolicyNumber: 'POL${random.nextInt(1000000)}',
        ),
        currentPosition: LatLng(
          -23.5505 + (random.nextDouble() - 0.5) * 0.1,
          -46.6333 + (random.nextDouble() - 0.5) * 0.1,
        ),
        currentFuelLevel: random.nextDouble(),
        odometer: random.nextDouble() * 100000,
        lastMaintenanceDate:
            DateTime.now().subtract(Duration(days: random.nextInt(90))),
        nextMaintenanceDate:
            DateTime.now().add(Duration(days: random.nextInt(90))),
        features: ['GPS', 'Ar Condicionado', 'Wi-Fi', 'Cameras'],
        notes: 'Veiculo em boas condicoes',
        createdAt: DateTime.now().subtract(Duration(days: random.nextInt(365))),
        updatedAt: DateTime.now(),
        companyId: 'company_1',
      ));
    }

    return vehicles;
  }

  List<MaintenanceRecord> _generateMockMaintenance(String vehicleId) {
    final random = Random();
    final maintenance = <MaintenanceRecord>[];

    for (var i = 0; i < 5; i++) {
      maintenance.add(MaintenanceRecord(
        id: 'maintenance_${vehicleId}_$i',
        vehicleId: vehicleId,
        title: 'Manutencao ${i + 1}',
        description: 'Descricao da manutencao ${i + 1}',
        type: MaintenanceType
            .values[random.nextInt(MaintenanceType.values.length)],
        status: MaintenanceStatus
            .values[random.nextInt(MaintenanceStatus.values.length)],
        priority: MaintenancePriority
            .values[random.nextInt(MaintenancePriority.values.length)],
        scheduledDate: DateTime.now().add(Duration(days: random.nextInt(30))),
        odometerReading: random.nextDouble() * 100000,
        estimatedCost: 500.0 + random.nextDouble() * 2000.0,
        items: [],
        attachments: [],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        companyId: 'company_1',
      ));
    }

    return maintenance;
  }

  List<FuelRecord> _generateMockFuelRecords(String vehicleId) {
    final random = Random();
    final records = <FuelRecord>[];

    for (var i = 0; i < 10; i++) {
      records.add(FuelRecord(
        id: 'fuel_${vehicleId}_$i',
        vehicleId: vehicleId,
        type: FuelRecordType.refuel,
        fuelType: FuelType.diesel,
        quantity: 50.0 + random.nextDouble() * 100.0,
        pricePerLiter: 4.0 + random.nextDouble() * 2.0,
        totalCost: 0,
        odometerReading: random.nextDouble() * 100000,
        attachments: [],
        timestamp: DateTime.now().subtract(Duration(days: i * 7)),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        companyId: 'company_1',
      ));
    }

    return records;
  }

  String _generateId() => 'vehicle_${DateTime.now().millisecondsSinceEpoch}';
}
