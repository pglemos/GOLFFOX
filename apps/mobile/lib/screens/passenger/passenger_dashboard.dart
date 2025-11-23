import 'dart:async';
import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/routing/app_router.dart';
import '../../core/services/snackbar_service.dart';
import '../../core/theme/gf_tokens.dart';
import '../../models/driver_position.dart';
import '../../models/trip.dart';
import '../../models/user.dart' as app_user;
import '../../services/auth_service.dart';
import '../../services/supabase_service.dart';

class PassengerDashboard extends StatefulWidget {
  const PassengerDashboard({required this.user, super.key});
  final app_user.User user;

  @override
  State<PassengerDashboard> createState() => _PassengerDashboardState();
}

class _PassengerDashboardState extends State<PassengerDashboard>
    with TickerProviderStateMixin {
  final _supabaseService = SupabaseService.instance;
  final _authService = AuthService();
  GoogleMapController? _mapController;

  // Removed unused trips cache
  Trip? _activeTrip;
  List<DriverPosition> _driverPositions = [];
  bool _isLoading = true;
  String? _errorMessage;
  RealtimeChannel? _positionChannel;
  StreamSubscription<List<DriverPosition>>? _positionSubscription;

  // Shimmer
  late final AnimationController _shimmerCtrl =
      AnimationController(vsync: this, duration: const Duration(seconds: 2))
        ..repeat();

  // Bottom card slide
  bool _showBottomCard = true;

  @override
  void initState() {
    super.initState();
    unawaited(_loadTrips());
  }

  @override
  void dispose() {
    _positionChannel?.unsubscribe();
    _positionSubscription?.cancel();
    _shimmerCtrl.dispose();
    _mapController?.dispose();
    super.dispose();
  }

  Future<void> _loadTrips() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final trips = await _supabaseService.getTripsForUser();

      Trip? active;
      if (trips.isNotEmpty) {
        active = trips.firstWhere(
          (t) => t.status == 'inProgress',
          orElse: () => trips.firstWhere(
            (t) => t.status == 'scheduled',
            orElse: () => trips.first,
          ),
        );
        // se achou placeholder vazio, zera
        if (active.id.isEmpty) active = null;
      }

      setState(() {
        // Trips loaded; use directly in UI if needed
        _activeTrip = active;
        _isLoading = false;
      });

      if (_activeTrip != null) {
        await _loadDriverPositions();
        _subscribeToDriverPositions();
      }
    } on Exception catch (error) {
      setState(() {
        _errorMessage = 'Erro ao carregar viagens: $error';
        _isLoading = false;
      });
    }
  }

  Future<void> _loadDriverPositions() async {
    if (_activeTrip == null) return;
    try {
      final positions =
          await _supabaseService.getDriverPositionsForTrip(_activeTrip!.id);
      if (!mounted) return;
      setState(() => _driverPositions = positions);

      if (positions.isNotEmpty) {
        final latest = positions.first;
        unawaited(_mapController?.animateCamera(
          CameraUpdate.newLatLngZoom(
            LatLng(latest.latitude, latest.longitude),
            15,
          ),
        ));
      }
    } on Exception catch (error) {
      debugPrint('Error loading driver positions: $error');
    }
  }

  void _subscribeToDriverPositions() {
    if (_activeTrip == null) return;

    _positionSubscription =
        _supabaseService.streamDriverPositionsRealtime(_activeTrip!.id).listen(
      (positions) {
        if (!mounted) return;
        setState(() => _driverPositions = positions);

        if (positions.isNotEmpty) {
          final latest = positions.first;
          unawaited(_mapController?.animateCamera(
            CameraUpdate.newLatLngZoom(
              LatLng(latest.latitude, latest.longitude),
              15,
            ),
          ));
        }
      },
    );
  }

  // ... (omitted parts)

  Widget _buildMap(ThemeData theme) {
    final polylines = <Polyline>{};
    final markers = <Marker>{};

    if (_driverPositions.isNotEmpty) {
      // Rota
      polylines.add(
        Polyline(
          polylineId: const PolylineId('route'),
          points: _driverPositions
              .map((p) => LatLng(p.latitude, p.longitude))
              .toList(),
          width: 4,
          color: theme.colorScheme.primary.withValues(alpha: 0.9),
        ),
      );

      // Marker do motorista
      final latest = _driverPositions.first;
      double heading = 0;
      if (_driverPositions.length >= 2) {
        heading = _bearingDegrees(
          LatLng(_driverPositions[1].latitude, _driverPositions[1].longitude),
          LatLng(latest.latitude, latest.longitude),
        );
      }

      markers.add(
        Marker(
          markerId: const MarkerId('driver'),
          position: LatLng(latest.latitude, latest.longitude),
          rotation: heading,
          infoWindow: const InfoWindow(title: 'Motorista'),
        ),
      );
    }

    return GoogleMap(
      initialCameraPosition: const CameraPosition(
        target: LatLng(-23.5505, -46.6333),
        zoom: 15,
      ),
      onMapCreated: (controller) => _mapController = controller,
      polylines: polylines,
      markers: markers,
      myLocationEnabled: true,
      myLocationButtonEnabled: false,
      zoomControlsEnabled: false,
      mapToolbarEnabled: false,
    );
  }

  // ... (omitted parts)

  @override
  void paint(Canvas canvas, Size size) {
    final base = Paint()..color = Colors.white.withValues(alpha: 0.14);
    final shimmer = Paint()
      ..shader = LinearGradient(
        begin: Alignment(-1 + progress * 2, 0),
        end: Alignment(1 + progress * 2, 0),
        colors: [
          Colors.white.withValues(alpha: 0.10),
          Colors.white.withValues(alpha: 0.35),
          Colors.white.withValues(alpha: 0.10),
        ],
        stops: const [0.2, 0.5, 0.8],
      ).createShader(Offset.zero & size);

    canvas
      ..drawRect(Offset.zero & size, base)
      ..drawRect(Offset.zero & size, shimmer);
  }

  // ...

class _MapShimmerOverlay extends StatelessWidget {
  const _MapShimmerOverlay({required this.animation});
  final Animation<double> animation;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: animation,
        builder: (context, _) => ColoredBox(
          color: Theme.of(context).colorScheme.surface,
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const CircularProgressIndicator(),
                const SizedBox(height: 16),
                Text(
                  'Carregando mapa...',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ),
          ),
        ),
      );
}

class _GradientFab extends StatelessWidget {
  const _GradientFab({
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => DecoratedBox(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFF8C00), Color(0xFFFF5F00)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFFF5F00).withValues(alpha: 0.4),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onPressed,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, color: Colors.white),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
