// lib/screens/driver/trip_detail_screen.dart
import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart' as flutter_map;
import 'package:latlong2/latlong.dart';

import '../../core/services/snackbar_service.dart';
import '../../core/theme/gf_tokens.dart';
import '../../models/driver_position.dart';
import '../../models/trip.dart';
import '../../models/user.dart' as app_user;
import '../../services/supabase_service.dart';
import '../../services/tracking_service.dart';

class TripDetailScreen extends StatefulWidget {
  const TripDetailScreen({
    required this.trip,
    required this.user,
    super.key,
  });
  final Trip trip;
  final app_user.User user;

  @override
  State<TripDetailScreen> createState() => _TripDetailScreenState();
}

class _TripDetailScreenState extends State<TripDetailScreen>
    with SingleTickerProviderStateMixin {
  final _svc = SupabaseService.instance;
  final _tracking = TrackingService();
  final _mapCtrl = flutter_map.MapController();

  late Trip _trip;

  List<DriverPosition> _positions = [];
  bool _loadingPositions = false;
  // ignore: unused_field
  String? _error;

  // UI / Interacao
  bool _follow = true;
  bool _fittingBoundsOnce = false;
  late final AnimationController _anim =
      AnimationController(vsync: this, duration: GfTokens.durationSlow);

  // Streams
  StreamSubscription<List<DriverPosition>>? _posSub;
  StreamSubscription<Map<String, dynamic>>? _tripSub;

  @override
  void initState() {
    super.initState();
    _trip = widget.trip;
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await _loadPositions(firstLoad: true);
    _subscribePositions();
    _subscribeTripStatus();
    unawaited(_anim.forward());
  }

  @override
  void dispose() {
    _posSub?.cancel();
    _tripSub?.cancel();
    _anim.dispose();
    super.dispose();
  }

  /* =================== DATA =================== */

  Future<void> _loadPositions({bool firstLoad = false}) async {
    setState(() {
      if (firstLoad) _loadingPositions = true;
      _error = null;
    });
    try {
      final list = await _svc.getDriverPositionsForTrip(_trip.id);
      // garanta ordenacao cronologica (mais antigo  mais novo)
      list.sort((a, b) => a.timestamp.compareTo(b.timestamp));
      setState(() => _positions = list);

      _smartCenter();
    } on Exception catch (error) {
      setState(() => _error = 'Erro ao carregar posicoes: $error');
    } finally {
      if (mounted) setState(() => _loadingPositions = false);
    }
  }

  void _subscribePositions() {
    _posSub?.cancel();
    _posSub = _svc.streamDriverPositionsRealtime(_trip.id).listen((list) {
      // stream ja vem desc; garantimos asc aqui
      list.sort((a, b) => a.timestamp.compareTo(b.timestamp));
      if (!mounted) return;
      setState(() => _positions = list);
      if (_follow) _smartCenter(live: true);
    });
  }

  void _subscribeTripStatus() {
    _tripSub?.cancel();
    _tripSub = _svc.streamTripStatus(_trip.id).listen((row) {
      if (row.isEmpty) return;
      final updated = Trip.fromJson(row);
      if (!mounted) return;
      setState(() => _trip = updated);
    });
  }

  /* =================== MAPA =================== */

  void _smartCenter({bool live = false}) {
    if (_positions.isEmpty) return;

    final latest = _positions.last;
    final latestLL = LatLng(latest.latitude, latest.longitude);

    // Primeira vez com pontos  ajusta bounds
    if (!_fittingBoundsOnce && _positions.length >= 2) {
      _fittingBoundsOnce = true;
      final points =
          _positions.map((p) => LatLng(p.latitude, p.longitude)).toList();
      final bounds = flutter_map.LatLngBounds.fromPoints(points);
      _mapCtrl.fitCamera(
        flutter_map.CameraFit.bounds(
          bounds: bounds,
          padding: const EdgeInsets.all(36),
        ),
      );
      return;
    }

    // Ao vivo: segue veiculo suavemente
    if (live && _follow) {
      _mapCtrl.move(latestLL, max(_mapCtrl.camera.zoom, 15));
      return;
    }

    // Fallback: centraliza no ultimo ponto
    _mapCtrl.move(latestLL, max(_mapCtrl.camera.zoom, 14));
  }

  /* =================== ACOES =================== */

  Future<void> _startTrip() async {
    try {
      // coleta melhor referencia possivel de posicao
      final pos = _positions.isNotEmpty ? _positions.last : null;
      final lat = pos?.latitude ?? -23.5505; // SP default
      final lng = pos?.longitude ?? -46.6333;

      final resp = await _svc.transitionTripStatus(
        tripId: _trip.id,
        newStatus: 'inProgress',
        description: 'Driver iniciou via app',
        lat: lat,
        lng: lng,
      );

      final ok = (resp['success'] as bool?) ?? true;
      if (!ok) throw Exception(resp['error'] ?? 'Transicao invalida');

      await _tracking.startTracking(
        tripId: _trip.id,
        driverId: widget.user.id,
      );

      if (!mounted) return;
      SnackBarService.success(context, 'driver.trip.start.success');
    } on Exception catch (error) {
      if (!mounted) return;
      SnackBarService.error(context, error);
    }
  }

  Future<void> _completeTrip() async {
    try {
      // encerra tracking antes
      if (_tracking.isTracking) {
        await _tracking.stopTracking();
      }

      final pos = _positions.isNotEmpty ? _positions.last : null;
      final lat = pos?.latitude ?? -23.5505;
      final lng = pos?.longitude ?? -46.6333;

      final resp = await _svc.transitionTripStatus(
        tripId: _trip.id,
        newStatus: 'completed',
        description: 'Driver concluiu via app',
        lat: lat,
        lng: lng,
      );

      final ok = (resp['success'] as bool?) ?? true;
      if (!ok) throw Exception(resp['error'] ?? 'Transicao invalida');

      if (!mounted) return;
      SnackBarService.success(context, 'driver.trip.complete.success');
      Navigator.pop(context); // volta para a lista
    } on Exception catch (error) {
      if (!mounted) return;
      SnackBarService.error(context, error);
    }
  }

  /* =================== METRICAS =================== */

  double get _totalDistanceKm {
    if (_positions.length < 2) return 0;
    double m = 0;
    for (var i = 1; i < _positions.length; i++) {
      m += _haversineMeters(
        _positions[i - 1].latitude,
        _positions[i - 1].longitude,
        _positions[i].latitude,
        _positions[i].longitude,
      );
    }
    return m / 1000.0;
  }

  String get _lastSpeedKmh {
    if (_positions.isEmpty) return '--';
    final s = _positions.last.speed; // m/s (model costuma salvar m/s)
    if (s == null || s.isNaN) return '--';
    return (s * 3.6).toStringAsFixed(0);
  }

  double _haversineMeters(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    const R = 6371000.0;
    final dLat = _deg2rad(lat2 - lat1);
    final dLon = _deg2rad(lon2 - lon1);
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_deg2rad(lat1)) *
            cos(_deg2rad(lat2)) *
            sin(dLon / 2) *
            sin(dLon / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return R * c;
  }

  double _deg2rad(double d) => d * pi / 180.0;

  /* =================== UI =================== */

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: t.colorScheme.surface,
        title: Text('Viagem #${_trip.id.substring(0, 8)}'),
        actions: [
          // Badge "Live" quando ha tracking
          AnimatedSwitcher(
            duration: GfTokens.duration,
            child: _tracking.isTracking
                ? Padding(
                    key: const ValueKey('live'),
                    padding: const EdgeInsets.only(right: 8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: t.colorScheme.secondary,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.gps_fixed,
                            size: 16, color: t.colorScheme.onSecondary),
                        const SizedBox(width: 6),
                        Text(
                          'Ao vivo',
                          style: t.textTheme.labelSmall?.copyWith(
                            color: t.colorScheme.onSecondary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ]),
                    ),
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, c) {
          final wide = c.maxWidth >= 980; // desktop layout
          return RefreshIndicator(
            onRefresh: () => _loadPositions(firstLoad: true),
            child: ListView(
              padding: EdgeInsets.symmetric(
                  horizontal: wide ? 24 : 16, vertical: 16),
              children: [
                // Top: Mapa (lado a lado no desktop)
                if (wide)
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(flex: 3, child: _buildMapCard(t)),
                      const SizedBox(width: 16),
                      Expanded(flex: 2, child: _buildInfoColumn(t)),
                    ],
                  )
                else ...[
                  _buildMapCard(t),
                  const SizedBox(height: 12),
                  _buildInfoColumn(t),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildMapCard(ThemeData t) => Container(
      height: 420,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          flutter_map.FlutterMap(
            mapController: _mapCtrl,
            options: const flutter_map.MapOptions(
              initialCenter: LatLng(-23.5505, -46.6333), // Sao Paulo
              initialZoom: 12.5,
            ),
            children: [
              flutter_map.TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.example.clarityflow',
              ),
              if (_positions.isNotEmpty) ...[
                // Rota
                flutter_map.PolylineLayer(
                  polylines: [
                    flutter_map.Polyline(
                      points: _positions
                          .map((p) => LatLng(p.latitude, p.longitude))
                          .toList(),
                      strokeWidth: 4,
                      color: t.colorScheme.primary,
                    ),
                  ],
                ),
                // Marcadores (inicio e atual)
                flutter_map.MarkerLayer(
                  markers: [
                    // inicio
                    flutter_map.Marker(
                      point: LatLng(_positions.first.latitude,
                          _positions.first.longitude),
                      width: 36,
                      height: 36,
                      child: _dot(t.colorScheme.tertiary),
                    ),
                    // atual
                    flutter_map.Marker(
                      point: LatLng(
                          _positions.last.latitude, _positions.last.longitude),
                      width: 44,
                      height: 44,
                      child: _carBubble(t),
                    ),
                  ],
                ),
              ],
            ],
          ),

          // Overlay: metricas e controles
          Positioned(
            left: 12,
            top: 12,
            right: 12,
            child: Row(
              children: [
                _glass(t,
                    child: Row(
                      children: [
                        Icon(Icons.speed,
                            size: 16, color: t.colorScheme.primary),
                        const SizedBox(width: 6),
                        Text('$_lastSpeedKmh km/h',
                            style: t.textTheme.labelLarge),
                        const SizedBox(width: 12),
                        Icon(Icons.route,
                            size: 16, color: t.colorScheme.primary),
                        const SizedBox(width: 6),
                        Text('${_totalDistanceKm.toStringAsFixed(1)} km',
                            style: t.textTheme.labelLarge),
                      ],
                    )),
                const Spacer(),
                _glass(t,
                    child: Row(
                      children: [
                        Switch(
                          value: _follow,
                          onChanged: (v) {
                            setState(() => _follow = v);
                            if (v) _smartCenter(live: true);
                          },
                        ),
                        Text('Seguir', style: t.textTheme.labelLarge),
                      ],
                    )),
              ],
            ),
          ),

          // Botao recenter
          Positioned(
            right: 12,
            bottom: 12,
            child: FloatingActionButton.small(
              heroTag: 'recenter',
              onPressed: _smartCenter,
              child: const Icon(Icons.my_location),
            ),
          ),
        ],
      ),
    );

  Widget _buildInfoColumn(ThemeData t) => Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ScaleTransition(
          scale: CurvedAnimation(parent: _anim, curve: Curves.easeOutBack),
          child: _TripStatusCard(trip: _trip),
        ),
        const SizedBox(height: 12),

        // Acoes contextuais
        _buildActions(t),
      ],
    );

  Widget _buildActions(ThemeData t) {
    final status = _trip.status.toLowerCase();
    final isScheduled = status == 'scheduled';
    final inProgress = status == 'inprogress';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: t.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(Icons.tune, color: t.colorScheme.primary),
              const SizedBox(width: 8),
              Text('Acoes',
                  style: t.textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 12),
          if (isScheduled)
            SizedBox(
              height: 48,
              child: FilledButton.icon(
                onPressed: _loadingPositions ? null : _startTrip,
                icon: const Icon(Icons.play_arrow),
                label: const Text('Iniciar viagem'),
              ),
            ),
          if (inProgress) ...[
            SizedBox(
              height: 48,
              child: FilledButton.icon(
                onPressed: _completeTrip,
                icon: const Icon(Icons.flag_circle),
                label: const Text('Concluir viagem'),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 44,
              child: OutlinedButton.icon(
                onPressed: _tracking.isTracking ? _tracking.stopTracking : null,
                icon: const Icon(Icons.gps_off),
                label: const Text('Parar rastreamento'),
              ),
            ),
          ],
          if (!isScheduled && !inProgress)
            Text(
              'Nenhuma acao disponivel para o status atual.',
              style: t.textTheme.bodySmall?.copyWith(
                color: t.colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
        ],
      ),
    );
  }

  /* =================== Helpers UI =================== */

  Widget _dot(Color c) => Container(
        decoration: BoxDecoration(color: c, shape: BoxShape.circle),
      );

  Widget _carBubble(ThemeData t) => DecoratedBox(
        decoration: BoxDecoration(
          color: t.colorScheme.secondary,
          shape: BoxShape.circle,
          border: Border.all(color: t.colorScheme.surface, width: 3),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.18),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Icon(Icons.directions_car,
            color: t.colorScheme.onSecondary, size: 22),
      );

  Widget _glass(ThemeData t, {required Widget child}) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: t.colorScheme.surface.withValues(alpha: 0.85),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: t.colorScheme.outline.withValues(alpha: 0.12)),
        ),
        child: child,
      );
}

/* =================== STATUS CARD =================== */

class _TripStatusCard extends StatelessWidget {
  const _TripStatusCard({required this.trip});
  final Trip trip;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);

    Color c;
    IconData i;
    String label;
    switch (trip.status.toLowerCase()) {
      case 'scheduled':
        c = t.colorScheme.tertiary;
        i = Icons.schedule;
        label = 'Agendada';
        break;
      case 'inprogress':
        c = t.colorScheme.secondary;
        i = Icons.directions_car;
        label = 'Em andamento';
        break;
      case 'completed':
        c = t.colorScheme.primary;
        i = Icons.check_circle;
        label = 'Concluida';
        break;
      case 'cancelled':
        c = t.colorScheme.error;
        i = Icons.cancel;
        label = 'Cancelada';
        break;
      default:
        c = t.colorScheme.onSurface.withValues(alpha: 0.5);
        i = Icons.help_outline;
        label = trip.status;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: t.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: c.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(i, size: 16, color: c),
              const SizedBox(width: 6),
              Text(
                label,
                style: t.textTheme.labelSmall?.copyWith(
                  color: c,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ]),
          ),
          const Spacer(),
          if (trip.scheduledStartTime != null)
            Row(children: [
              Icon(Icons.access_time,
                  size: 16, color: t.colorScheme.onSurface.withValues(alpha: 0.7)),
              const SizedBox(width: 6),
              Text(
                _fmt(trip.scheduledStartTime!),
                style: t.textTheme.labelMedium?.copyWith(
                  color: t.colorScheme.onSurface.withValues(alpha: 0.7),
                ),
              ),
            ]),
        ]),
        if ((trip.notes ?? '').isNotEmpty) ...[
          const SizedBox(height: 10),
          Text(
            trip.notes!,
            style: t.textTheme.bodySmall?.copyWith(
              color: t.colorScheme.onSurface.withValues(alpha: 0.8),
            ),
          ),
        ],
      ]),
    );
  }

  String _fmt(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year} '
      'as ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
}

