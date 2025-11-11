// ========================================
// GolfFox Mapa Page v12.0
// Pagina principal do mapa interativo com status em tempo real
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

import '../../core/i18n/i18n.dart';
import '../../core/services/snackbar_service.dart';
import '../../core/theme/gf_tokens.dart';
import '../../core/theme/unified_theme.dart';
import '../../core/utils/date_utils.dart';
import '../../models/bus_stop.dart';
import '../../models/vehicle_position.dart';
import '../../models/vehicle_status.dart' as vs;
import '../../providers/realtime_providers.dart';
import '../../services/bus_stop_service.dart';
import '../../services/map_service.dart' show vehicleStatusServiceProvider;
import '../../ui/widgets/gf_app_bar.dart';
import '../../ui/widgets/map/bus_stops_panel.dart';
import '../../ui/widgets/map/map_filters.dart';
import '../../ui/widgets/map/map_legend.dart';
import '../../ui/widgets/map/vehicle_info_panel.dart';
import '../../ui/widgets/map/vehicle_marker.dart';

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
    final _ = ref.watch(vehicleStatusServiceProvider);

    // Calcular contadores de status
    vehiclePositionsAsync.whenData(_updateStatusCounts);

    return Scaffold(
      appBar: const GfAppBar(
        title: 'Mapa',
      ),
      body: Stack(
        children: [
          // Mapa principal
          vehiclePositionsAsync.when(
            data: _buildMap,
            loading: _buildLoadingMap,
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
              availableCompanies: const [],
              availableRoutes: _getAvailableRoutes(),
              availableCarriers: const [],
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
                onStopTap: _focusOnBusStop,
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
                  onPressed: () => ref.invalidate(vehiclePositionsStreamProvider),
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
      options: const MapOptions(
        initialCenter: LatLng(-23.5505, -46.6333), // Sao Paulo
        initialZoom: 12,
        minZoom: 8,
        maxZoom: 18,
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

  Widget _buildLoadingMap() => const ColoredBox(
        color: GolfFoxTheme.backgroundDark,
        child: Center(
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

  Widget _buildErrorMap(Object error) => ColoredBox(
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
                '$error',
                style: const TextStyle(
                  fontSize: 14,
                  color: GolfFoxTheme.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref.invalidate(vehiclePositionsStreamProvider),
                icon: const Icon(Icons.refresh),
                label: const Text('Tentar novamente'),
              ),
            ],
          ),
        ),
      );

  List<VehiclePosition> _filterVehicles(List<VehiclePosition> vehicles) => vehicles.where((vehicle) {
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

  List<String> _getAvailableRoutes() {
    final vehiclePositionsAsync = ref.read(vehiclePositionsStreamProvider);
    return vehiclePositionsAsync.when(
      data: (vehicles) => vehicles
          .where((v) => v.routeName != null)
          .map((v) => v.routeName!)
          .toSet()
          .toList()
        ..sort(),
      loading: () => [],
      error: (_, __) => [],
    );
  }

  Future<void> _selectVehicle(VehiclePosition vehicle) async {
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
      } on Exception catch (e) {
        debugPrint('Erro ao carregar pontos de parada: $e');
      }
    }
  }

  void _trackVehicle(VehiclePosition vehicle) {
    setState(() {
      _isTracking = true;
    });

    _mapController.move(vehicle.position, 16);

    // Parar tracking apos 10 segundos
    Future<void>.delayed(const Duration(seconds: 10), () {
      if (mounted) {
        setState(() {
          _isTracking = false;
        });
      }
    });
  }

  void _contactDriver(VehiclePosition vehicle) {
    showDialog<void>(
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
            // TODO(golffox-team): Implementar contato do motorista
            SnackBarService.info(
              context,
              'mapa.contact.soon',
            );
          },
          child: const Text('Contatar'),
        ),
        ],
      ),
    );
  }

  void _focusOnBusStop(BusStop stop) {
    _mapController.move(stop.position, 16);

    // Mostrar informacoes da parada
    final title = I18n.t(context, 'mapa.stop.title',
        params: {'icon': stop.type.icon, 'name': stop.name});
    final eta = stop.estimatedArrival != null
        ? I18n.t(context, 'mapa.stop.eta',
            params: {'eta': GfDateUtils.timeAgo(stop.estimatedArrival!)})
        : null;
    final infoLines = <String>[
      title,
      if (stop.landmark != null) stop.landmark!,
      if (eta != null) eta,
    ];
    SnackBarService.infoText(
      context,
      infoLines.join('\n'),
      action: SnackBarAction(
        label: I18n.t(context, 'common.ok'),
        onPressed: () => ScaffoldMessenger.of(context).hideCurrentSnackBar(),
      ),
    );
  }

  void _centerMapOnVehicles() {
    ref.read(vehiclePositionsStreamProvider).when(
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

    var minLat = vehicles.first.position.latitude;
    var maxLat = vehicles.first.position.latitude;
    var minLng = vehicles.first.position.longitude;
    var maxLng = vehicles.first.position.longitude;

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
    final newCounts = <vs.VehicleStatusType, int>{};

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
