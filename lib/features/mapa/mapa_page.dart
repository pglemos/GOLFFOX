// ========================================
// GolfFox Mapa Page v12.0
// Pagina principal do mapa interativo com status em tempo real
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../core/theme/gf_tokens.dart';
import '../../core/theme/unified_theme.dart';
import '../../ui/widgets/gf_app_bar.dart';
import '../../ui/widgets/map/map_filters.dart';
import '../../ui/widgets/map/vehicle_info_panel.dart';
import '../../ui/widgets/map/vehicle_marker.dart';
import '../../ui/widgets/map/map_legend.dart';
import '../../ui/widgets/map/bus_stops_panel.dart';
import '../../services/vehicle_status_service.dart';
import '../../services/bus_stop_service.dart';
import '../../services/map_service.dart' show vehicleStatusServiceProvider;
import '../../providers/realtime_providers.dart';
import '../../models/vehicle_position.dart';
import '../../models/driver_position.dart';
import '../../models/bus_stop.dart';
import '../../models/vehicle_status.dart' as vs;
import '../../core/utils/date_utils.dart';

class MapaPage extends ConsumerStatefulWidget {
  const MapaPage({super.key});

  @override
  ConsumerState<MapaPage> createState() => _MapaPageState();
}

class _MapaPageState extends ConsumerState<MapaPage> {
  final MapController _mapController = MapController();
  VehiclePosition? _selectedVehicle;
  List<VehicleStatus> _selectedStatuses = [];
  String? _selectedRoute;
  bool _isTracking = false;
  bool _isLegendExpanded = true;
  bool _showBusStops = false;
  List<BusStop> _busStops = [];
  Map<vs.VehicleStatusType, int> _statusCounts = {};

  @override
  void initState() {
    super.initState();
    // Iniciar atualizacoes em tempo real
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(realtimeServiceProvider).initialize();
      ref.read(vehicleStatusServiceProvider).initialize();
    });
  }

  @override
  void dispose() {
    ref.read(realtimeServiceProvider).dispose();
    ref.read(vehicleStatusServiceProvider).dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vehiclePositionsAsync = ref.watch(vehiclePositionsStreamProvider);
    final vehicleStatusService = ref.watch(vehicleStatusServiceProvider);

    // Calcular contadores de status
    vehiclePositionsAsync.whenData((vehicles) {
      _updateStatusCounts(vehicles);
    });

    return Scaffold(
      appBar: const GfAppBar(
        title: 'Mapa',
      ),
      body: Stack(
        children: [
          // Mapa principal
          vehiclePositionsAsync.when(
            data: (vehicles) => _buildMap(vehicles),
            loading: () => _buildLoadingMap(),
            error: (error, stack) => _buildErrorMap(error),
          ),

          // Filtros
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: MapFilters(
              selectedStatuses:
                  _selectedStatuses.map((status) => status.name).toList(),
              selectedRoute: _selectedRoute,
              availableCompanies: [],
              availableRoutes: _getAvailableRoutes(),
              availableCarriers: [],
              onFiltersChanged: (statuses, route) {
                setState(() {
                  _selectedStatuses = statuses
                      .map((status) => VehicleStatus.values
                          .firstWhere((e) => e.name == status))
                      .toList();
                  _selectedRoute = route;
                });
              },
            ),
          ),

          // Painel de informacoes do veiculo
          if (_selectedVehicle != null)
            Positioned(
              bottom: _showBusStops ? 160 : 0,
              left: 0,
              right: 0,
              child: VehicleInfoPanel(
                vehicle: _selectedVehicle!,
                onClose: () => setState(() {
                  _selectedVehicle = null;
                  _showBusStops = false;
                  _busStops = [];
                }),
                onTrack: () => _trackVehicle(_selectedVehicle!),
                onContact: () => _contactDriver(_selectedVehicle!),
              ),
            ),

          // Painel de pontos de parada
          if (_showBusStops && _busStops.isNotEmpty)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: BusStopsPanel(
                busStops: _busStops,
                routeName: _selectedVehicle?.routeName,
                onClose: () => setState(() {
                  _showBusStops = false;
                  _busStops = [];
                }),
                onStopTap: (stop) => _focusOnBusStop(stop),
              ),
            ),

          // Botoes de controle
          Positioned(
            right: 16,
            bottom: _selectedVehicle != null ? 200 : 16,
            child: Column(
              children: [
                // Botao de localizacao
                FloatingActionButton(
                  heroTag: 'location',
                  onPressed: _centerMapOnVehicles,
                  backgroundColor: const Color(GfTokens.surface),
                  foregroundColor: GolfFoxTheme.primaryOrange,
                  child: const Icon(Icons.my_location),
                ),
                const SizedBox(height: 8),

                // Botao de atualizacao
                FloatingActionButton(
                  heroTag: 'refresh',
                  onPressed: () => ref.refresh(vehiclePositionsStreamProvider),
                  backgroundColor: GolfFoxTheme.backgroundLight,
                  foregroundColor: GolfFoxTheme.primaryOrange,
                  child: const Icon(Icons.refresh),
                ),
              ],
            ),
          ),

          // Indicador de tracking
          if (_isTracking)
            Positioned(
              top: 100,
              right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: GolfFoxTheme.primaryOrange,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.track_changes,
                      color: Colors.white,
                      size: 16,
                    ),
                    SizedBox(width: 4),
                    Text(
                      'Rastreando',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Legenda do mapa
          if (_isLegendExpanded)
            MapLegend(
              isExpanded: true,
              statusCounts: _statusCounts,
              onToggle: () => setState(() => _isLegendExpanded = false),
            )
          else
            CompactMapLegend(
              statusCounts: _statusCounts,
              onExpand: () => setState(() => _isLegendExpanded = true),
            ),
        ],
      ),
    );
  }

  Widget _buildMap(List<VehiclePosition> vehicles) {
    final filteredVehicles = _filterVehicles(vehicles);
    final vehicleStatusService = ref.read(vehicleStatusServiceProvider);

    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: const LatLng(-23.5505, -46.6333), // Sao Paulo
        initialZoom: 12.0,
        minZoom: 8.0,
        maxZoom: 18.0,
        interactionOptions: const InteractionOptions(
          flags: InteractiveFlag.all,
        ),
      ),
      children: [
        // Camada do mapa
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.golffox.app',
        ),

        // Camada de marcadores (sem cluster para evitar dependência externa)
        MarkerLayer(
          markers: filteredVehicles.map((vehicle) {
            // Obter status calculado do veiculo
            final vehicleStatus =
                vehicleStatusService.getVehicleStatus(vehicle.id);
            final lastPosition =
                vehicleStatusService.getLastPosition(vehicle.id);

            return Marker(
              point: vehicle.position,
              width: 60,
              height: 60,
              child: GestureDetector(
                onTap: () => _selectVehicle(vehicle),
                child: VehicleMarker(
                  vehicle: vehicle,
                  isSelected: _selectedVehicle?.id == vehicle.id,
                  vehicleStatus: vehicleStatus?.status,
                  lastPosition: lastPosition,
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildLoadingMap() {
    return Container(
      color: GolfFoxTheme.backgroundDark,
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              color: GolfFoxTheme.primaryOrange,
            ),
            SizedBox(height: 16),
            Text(
              'Carregando mapa...',
              style: TextStyle(
                fontSize: 16,
                color: GolfFoxTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorMap(Object error) {
    return Container(
      color: GolfFoxTheme.backgroundDark,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: GolfFoxTheme.error,
            ),
            const SizedBox(height: 16),
            const Text(
              'Erro ao carregar mapa',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: GolfFoxTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error.toString(),
              style: const TextStyle(
                fontSize: 14,
                color: GolfFoxTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => ref.refresh(vehiclePositionsStreamProvider),
              icon: const Icon(Icons.refresh),
              label: const Text('Tentar Novamente'),
              style: ElevatedButton.styleFrom(
                backgroundColor: GolfFoxTheme.primaryOrange,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<VehiclePosition> _filterVehicles(List<VehiclePosition> vehicles) {
    return vehicles.where((vehicle) {
      // Filtro por status
      if (_selectedStatuses.isNotEmpty &&
          !_selectedStatuses.contains(vehicle.status)) {
        return false;
      }

      // Filtro por rota
      if (_selectedRoute != null && vehicle.routeName != _selectedRoute) {
        return false;
      }

      return true;
    }).toList();
  }

  List<String> _getAvailableRoutes() {
    final vehiclePositionsAsync = ref.read(vehiclePositionsStreamProvider);
    return vehiclePositionsAsync.when(
      data: (vehicles) {
        final routes = vehicles
            .where((v) => v.routeName != null)
            .map((v) => v.routeName!)
            .toSet()
            .toList();
        routes.sort();
        return routes;
      },
      loading: () => [],
      error: (_, __) => [],
    );
  }

  void _selectVehicle(VehiclePosition vehicle) async {
    setState(() {
      _selectedVehicle = vehicle;
      _showBusStops = false;
      _busStops = [];
    });

    // Buscar pontos de parada da rota se o veiculo tiver uma rota
    if (vehicle.routeId != null) {
      try {
        final busStopService = ref.read(busStopServiceProvider);
        final busStops =
            await busStopService.getBusStopsByRoute(vehicle.routeId!);
        setState(() {
          _busStops = busStops;
          _showBusStops = true;
        });
      } catch (e) {
        print('Erro ao carregar pontos de parada: $e');
      }
    }
  }

  void _trackVehicle(VehiclePosition vehicle) {
    setState(() {
      _isTracking = true;
    });

    _mapController.move(vehicle.position, 16.0);

    // Parar tracking apos 10 segundos
    Future.delayed(const Duration(seconds: 10), () {
      if (mounted) {
        setState(() {
          _isTracking = false;
        });
      }
    });
  }

  void _contactDriver(VehiclePosition vehicle) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Contatar ${vehicle.driverName}'),
        content: Text(
            'Deseja entrar em contato com o motorista do veiculo ${vehicle.licensePlate}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              // Implementar contato (telefone, WhatsApp, etc.)
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Funcionalidade de contato sera implementada'),
                ),
              );
            },
            child: const Text('Contatar'),
          ),
        ],
      ),
    );
  }

  void _focusOnBusStop(BusStop stop) {
    _mapController.move(stop.position, 16.0);

    // Mostrar informacoes da parada
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${stop.type.icon} ${stop.name}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            if (stop.landmark != null) Text(stop.landmark!),
            if (stop.estimatedArrival != null)
              Text(
                  'Chegada estimada: ${GfDateUtils.timeAgo(stop.estimatedArrival!)}'),
          ],
        ),
        duration: const Duration(seconds: 4),
        action: SnackBarAction(
          label: 'OK',
          onPressed: () {
            ScaffoldMessenger.of(context).hideCurrentSnackBar();
          },
        ),
      ),
    );
  }

  void _centerMapOnVehicles() {
    final vehiclePositionsAsync = ref.read(vehiclePositionsStreamProvider);
    vehiclePositionsAsync.when(
      data: (vehicles) {
        final filteredVehicles = _filterVehicles(vehicles);
        if (filteredVehicles.isNotEmpty) {
          final bounds = _calculateBounds(filteredVehicles);
          _mapController.fitCamera(
            CameraFit.bounds(
              bounds: bounds,
              padding: const EdgeInsets.all(50),
            ),
          );
        }
      },
      loading: () {},
      error: (_, __) {},
    );
  }

  LatLngBounds _calculateBounds(List<VehiclePosition> vehicles) {
    if (vehicles.isEmpty) {
      return LatLngBounds(
        const LatLng(-23.5505, -46.6333),
        const LatLng(-23.5505, -46.6333),
      );
    }

    double minLat = vehicles.first.position.latitude;
    double maxLat = vehicles.first.position.latitude;
    double minLng = vehicles.first.position.longitude;
    double maxLng = vehicles.first.position.longitude;

    for (final vehicle in vehicles) {
      minLat = minLat < vehicle.position.latitude
          ? minLat
          : vehicle.position.latitude;
      maxLat = maxLat > vehicle.position.latitude
          ? maxLat
          : vehicle.position.latitude;
      minLng = minLng < vehicle.position.longitude
          ? minLng
          : vehicle.position.longitude;
      maxLng = maxLng > vehicle.position.longitude
          ? maxLng
          : vehicle.position.longitude;
    }

    return LatLngBounds(
      LatLng(minLat, minLng),
      LatLng(maxLat, maxLng),
    );
  }

  void _updateStatusCounts(List<VehiclePosition> vehicles) {
    final vehicleStatusService = ref.read(vehicleStatusServiceProvider);
    final Map<vs.VehicleStatusType, int> newCounts = {};

    // Inicializar contadores
    for (final statusType in vs.VehicleStatusType.values) {
      newCounts[statusType] = 0;
    }

    // Contar status dos veiculos
    for (final vehicle in vehicles) {
      final vehicleStatus = vehicleStatusService.getVehicleStatus(vehicle.id);
      final statusType = vehicleStatus?.status ?? vs.VehicleStatusType.offline;
      newCounts[statusType] = (newCounts[statusType] ?? 0) + 1;
    }

    // Atualizar estado se houver mudancas
    if (_statusCounts.toString() != newCounts.toString()) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          setState(() {
            _statusCounts = newCounts;
          });
        }
      });
    }
  }
}
