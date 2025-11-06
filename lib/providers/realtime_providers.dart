import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/realtime_service.dart';
import '../models/vehicle_position.dart';

/// Provider para o RealtimeService
final realtimeServiceProvider = Provider<RealtimeService>((ref) {
  final service = RealtimeService.instance;

  // Inicializar o servico quando o provider for criado
  service.initialize();

  // Limpar recursos quando o provider for descartado
  ref.onDispose(service.dispose);

  return service;
});

/// Provider para o stream de posicoes dos veiculos
final vehiclePositionsStreamProvider =
    StreamProvider<List<VehiclePosition>>((ref) {
  final realtimeService = ref.watch(realtimeServiceProvider);
  return realtimeService.positionsStream;
});

/// Provider para as posicoes atuais dos veiculos
final currentVehiclePositionsProvider = Provider<List<VehiclePosition>>((ref) {
  final realtimeService = ref.watch(realtimeServiceProvider);
  return realtimeService.currentPositions;
});

/// Provider para filtrar veiculos por status
final filteredVehiclePositionsProvider =
    Provider.family<List<VehiclePosition>, List<VehicleStatus>>(
        (ref, statuses) {
  final positions = ref.watch(currentVehiclePositionsProvider);

  if (statuses.isEmpty) return positions;

  return positions
      .where((position) => statuses.contains(position.status))
      .toList();
});

/// Provider para buscar veiculos por texto
final searchVehiclePositionsProvider =
    Provider.family<List<VehiclePosition>, String>((ref, query) {
  final positions = ref.watch(currentVehiclePositionsProvider);

  if (query.isEmpty) return positions;

  final lowerQuery = query.toLowerCase();
  return positions.where((vehicle) => vehicle.licensePlate.toLowerCase().contains(lowerQuery) ||
        vehicle.driverName.toLowerCase().contains(lowerQuery) ||
        (vehicle.routeName?.toLowerCase().contains(lowerQuery) ?? false)).toList();
});

/// Provider para estatisticas dos veiculos
final vehicleStatsProvider = Provider<VehicleStats>((ref) {
  final positions = ref.watch(currentVehiclePositionsProvider);

  var active = 0;
  var inactive = 0;
  var maintenance = 0;
  var emergency = 0;
  var offline = 0;
  double totalSpeed = 0;
  var movingVehicles = 0;

  for (final position in positions) {
    switch (position.status) {
      case VehicleStatus.active:
        active++;
        if (position.speed != null && position.speed! > 0) {
          totalSpeed += position.speed!;
          movingVehicles++;
        }
        break;
      case VehicleStatus.inactive:
        inactive++;
        break;
      case VehicleStatus.maintenance:
        maintenance++;
        break;
      case VehicleStatus.emergency:
        emergency++;
        break;
      case VehicleStatus.offline:
        offline++;
        break;
    }
  }

  return VehicleStats(
    total: positions.length,
    active: active,
    inactive: inactive,
    maintenance: maintenance,
    emergency: emergency,
    offline: offline,
    averageSpeed: movingVehicles > 0 ? totalSpeed / movingVehicles : 0,
  );
});

/// Classe para estatisticas dos veiculos
class VehicleStats {

  const VehicleStats({
    required this.total,
    required this.active,
    required this.inactive,
    required this.maintenance,
    required this.emergency,
    required this.offline,
    required this.averageSpeed,
  });
  final int total;
  final int active;
  final int inactive;
  final int maintenance;
  final int emergency;
  final int offline;
  final double averageSpeed;

  double get activePercentage => total > 0 ? (active / total) * 100 : 0;
  double get inactivePercentage => total > 0 ? (inactive / total) * 100 : 0;
  double get maintenancePercentage =>
      total > 0 ? (maintenance / total) * 100 : 0;
  double get offlinePercentage => total > 0 ? (offline / total) * 100 : 0;
}
