import 'dart:async';
import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart' as flutter_map;
import 'package:latlong2/latlong.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/routing/app_router.dart';
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
  final _mapController = flutter_map.MapController();

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
        _mapController.move(LatLng(latest.latitude, latest.longitude), 15);
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
          _mapController.move(LatLng(latest.latitude, latest.longitude), 15);
        }
      },
    );
  }

  Future<void> _signOut() async {
    try {
      await _authService.signOut();
      if (!mounted) return;
      AppRouter.instance.go('/');
    } on Exception catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao fazer logout: $error')),
      );
    }
  }

  Future<void> _openReportIncidentSheet() async {
    await HapticFeedback.lightImpact();
    final result = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _GlassBottomSheet(
          child: DraggableScrollableSheet(
            expand: false,
            initialChildSize: 0.38,
            maxChildSize: 0.8,
            builder: (context, scrollCtl) => _IncidentReportSheet(
              scrollController: scrollCtl,
            ),
          ),
        ),
    );

    if (result != null && result.isNotEmpty && mounted) {
      await HapticFeedback.mediumImpact();
      // aqui salvaria no backend
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Incidente reportado com sucesso')),
      );
    }
  }

  double _bearingDegrees(LatLng from, LatLng to) {
    final dLon = _deg2rad(to.longitude - from.longitude);
    final lat1 = _deg2rad(from.latitude);
    final lat2 = _deg2rad(to.latitude);

    final y = math.sin(dLon) * math.cos(lat2);
    final x = math.cos(lat1) * math.sin(lat2) -
        math.sin(lat1) * math.cos(lat2) * math.cos(dLon);
    final brng = math.atan2(y, x);
    return (_rad2deg(brng) + 360) % 360;
  }

  double _deg2rad(double deg) => deg * (math.pi / 180.0);
  double _rad2deg(double rad) => rad * (180.0 / math.pi);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: _FrostedAppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('GolfFox Passageiro'),
            Text(
              widget.user.name,
              style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.7)),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: _openReportIncidentSheet,
            icon: Icon(Icons.report_problem, color: theme.colorScheme.tertiary),
            tooltip: 'Reportar incidente',
          ),
          PopupMenuButton<String>(
            onSelected: (v) {
              if (v == 'logout') _signOut();
            },
            itemBuilder: (context) => const [
              PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout),
                    SizedBox(width: 8),
                    Text('Sair'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadTrips,
        edgeOffset: kToolbarHeight + 16,
        child: Stack(
          children: [
            // MAPA
            Positioned.fill(
              child: _buildMap(theme),
            ),

            // ESTADOS (erro / vazio / loading shimmer)
            Positioned.fill(
              child: IgnorePointer(
                child: AnimatedSwitcher(
                  duration: GfTokens.durationSlow,
                  child: _buildOverlayStates(theme),
                ),
              ),
            ),

            // CHIP DE STATUS + BOTOES SUPERIORES
            SafeArea(
              child: Padding(
                padding:
                    const EdgeInsets.fromLTRB(16, 12 + kToolbarHeight, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _AnimatedStatusChip(trip: _activeTrip),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        _GlassIconButton(
                          icon: Icons.center_focus_strong,
                          tooltip: 'Centralizar no motorista',
                          onTap: () {
                            HapticFeedback.selectionClick();
                            if (_driverPositions.isNotEmpty) {
                              final p = _driverPositions.first;
                              _mapController.move(
                                  LatLng(p.latitude, p.longitude), 15);
                            }
                          },
                        ),
                        const SizedBox(width: 10),
                        _GlassIconButton(
                          icon: Icons.layers,
                          tooltip: 'Alternar cartao',
                          onTap: () {
                            HapticFeedback.selectionClick();
                            setState(() => _showBottomCard = !_showBottomCard);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // CARTAO INFERIOR (GLASS) COM DETALHES DA VIAGEM
            _BottomTripCardArea(
              visible: !_isLoading && _activeTrip != null && _showBottomCard,
              child: _TripStatusCardPremium(
                trip: _activeTrip!,
                shimmerAnim: _shimmerCtrl,
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: (!_isLoading && _activeTrip != null)
          ? _GradientFab(
              icon: Icons.report,
              label: 'Incidente',
              onPressed: _openReportIncidentSheet,
            )
          : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }

  Widget _buildMap(ThemeData theme) => ClipRect(
      child: flutter_map.FlutterMap(
        mapController: _mapController,
        options: const flutter_map.MapOptions(
          initialCenter: LatLng(-23.5505, -46.6333),
        ),
        children: [
          flutter_map.TileLayer(
            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            userAgentPackageName: 'com.example.clarityflow',
          ),
          if (_driverPositions.isNotEmpty) ...[
            // rota
            flutter_map.PolylineLayer(
              polylines: [
                flutter_map.Polyline(
                  points: _driverPositions
                      .map((p) => LatLng(p.latitude, p.longitude))
                      .toList(),
                  strokeWidth: 4,
                  color: theme.colorScheme.primary.withValues(alpha: 0.9),
                ),
              ],
            ),
            // marker do motorista com rotacao animada
            flutter_map.MarkerLayer(
              markers: [
                flutter_map.Marker(
                  point: LatLng(
                    _driverPositions.first.latitude,
                    _driverPositions.first.longitude,
                  ),
                  width: 48,
                  height: 48,
                  child: _AnimatedDriverMarker(
                    color: theme.colorScheme.secondary,
                    borderColor: theme.colorScheme.surface,
                    headingDegrees: (_driverPositions.length >= 2)
                        ? _bearingDegrees(
                            LatLng(_driverPositions[1].latitude,
                                _driverPositions[1].longitude),
                            LatLng(_driverPositions.first.latitude,
                                _driverPositions.first.longitude),
                          )
                        : 0,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );

  Widget _buildOverlayStates(ThemeData theme) {
    if (_isLoading) {
      return _MapShimmerOverlay(animation: _shimmerCtrl);
    }

    if (_errorMessage != null) {
      return Center(
        child: _GlassCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline,
                  size: 44, color: theme.colorScheme.error),
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 12),
              FilledButton.tonal(
                onPressed: _loadTrips,
                child: const Text('Tentar novamente'),
              ),
            ],
          ),
        ),
      );
    }

    if (_activeTrip == null) {
      return Center(
        child: _GlassCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.directions_bus,
                  size: 44,
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
              const SizedBox(height: 8),
              Text('Nenhuma viagem ativa', style: theme.textTheme.titleMedium),
              const SizedBox(height: 6),
              Text(
                'Suas viagens aparecerao aqui quando disponiveis.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.7)),
              ),
            ],
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }
}

/* ====================== COMPONENTES PREMIUM ======================= */

class _FrostedAppBar extends StatelessWidget implements PreferredSizeWidget {
  const _FrostedAppBar({
    required this.title,
    this.actions,
  });

  final Widget title;
  final List<Widget>? actions;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ClipRect(
      child: Container(
        height: preferredSize.height + MediaQuery.of(context).padding.top,
        padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface.withValues(alpha: 0.4),
        ),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            title: DefaultTextStyle.merge(
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
              child: title,
            ),
            actions: actions,
          ),
        ),
      ),
    );
  }
}

class _AnimatedStatusChip extends StatelessWidget {
  const _AnimatedStatusChip({required this.trip});
  final Trip? trip;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    var color = theme.colorScheme.outline;
    var icon = Icons.help_outline;
    var text = 'Sem viagem';

    if (trip != null) {
      switch (trip!.status.toLowerCase()) {
        case 'scheduled':
          color = theme.colorScheme.tertiary;
          icon = Icons.schedule;
          text = 'Agendada';
          break;
        case 'inprogress':
          color = theme.colorScheme.secondary;
          icon = Icons.directions_car;
          text = 'Em andamento';
          break;
        case 'completed':
          color = theme.colorScheme.secondary;
          icon = Icons.check_circle;
          text = 'Concluida';
          break;
        case 'cancelled':
          color = theme.colorScheme.error;
          icon = Icons.cancel;
          text = 'Cancelada';
          break;
      }
    }

    return TweenAnimationBuilder<double>(
      duration: GfTokens.durationSlower,
      tween: Tween(begin: 0, end: 1),
      curve: Curves.easeOutCubic,
      builder: (_, v, child) => Transform.scale(
        scale: 0.98 + (0.02 * v),
        child: Opacity(opacity: v, child: child),
      ),
      child: _GlassChip(
        icon: icon,
        label: text,
        color: color,
      ),
    );
  }
}

class _BottomTripCardArea extends StatelessWidget {
  const _BottomTripCardArea({required this.visible, required this.child});
  final bool visible;
  final Widget child;

  @override
  Widget build(BuildContext context) => SafeArea(
      child: AnimatedSlide(
        duration: GfTokens.durationSlower,
        curve: Curves.easeOutCubic,
        offset: visible ? Offset.zero : const Offset(0, 0.2),
        child: AnimatedOpacity(
          duration: GfTokens.durationSlow,
          opacity: visible ? 1 : 0,
          child: Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16 + 56),
              child: child,
            ),
          ),
        ),
      ),
    );
}

class _TripStatusCardPremium extends StatelessWidget {
  const _TripStatusCardPremium({
    required this.trip,
    required this.shimmerAnim,
  });

  final Trip trip;
  final Animation<double> shimmerAnim;

  String _formatDateTime(DateTime dt) =>
      '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')} as ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return _GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _AnimatedStatusChip(trip: trip),
          const SizedBox(height: 12),
          Text(
            'Viagem #${trip.id.substring(0, 8)}',
            style: theme.textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          if (trip.scheduledStartTime != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.access_time,
                    size: 18,
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.7)),
                const SizedBox(width: 6),
                Text(
                  'Horario: ${_formatDateTime(trip.scheduledStartTime!)}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.7)),
                ),
              ],
            ),
          ],
          const SizedBox(height: 12),
          // mini progresso (fake/visual, substitua por % real se houver)
          _ShimmerBar(animation: shimmerAnim),
          const SizedBox(height: 8),
          const Row(
            children: [
              Expanded(
                child: FilledButton(
                  onPressed: HapticFeedback.selectionClick,
                  child: Text('Ver detalhes'),
                ),
              ),
              SizedBox(width: 10),
              IconButton.filledTonal(
                onPressed: HapticFeedback.selectionClick,
                icon: Icon(Icons.more_horiz),
                tooltip: 'Mais',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/* ====================== ELEMENTOS VISUAIS ======================= */

class _GlassCard extends StatelessWidget {
  const _GlassCard({required this.child, this.padding});
  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Container(
          padding: padding ?? const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface.withValues(alpha: 0.6),
            border: Border.all(
              color: theme.colorScheme.outlineVariant.withValues(alpha: 0.3),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.08),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}

class _GlassChip extends StatelessWidget {
  const _GlassChip(
      {required this.icon, required this.label, required this.color});
  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => _GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.2,
                ),
          ),
        ],
      ),
    );
}

class _GlassIconButton extends StatelessWidget {
  const _GlassIconButton({
    required this.icon,
    required this.onTap,
    this.tooltip,
  });
  final IconData icon;
  final VoidCallback onTap;
  final String? tooltip;

  @override
  Widget build(BuildContext context) => Tooltip(
      message: tooltip ?? '',
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: _GlassCard(
          padding: const EdgeInsets.all(12),
          child: Icon(icon, size: 20),
        ),
      ),
    );
}

class _AnimatedDriverMarker extends StatelessWidget {
  const _AnimatedDriverMarker({
    required this.color,
    required this.borderColor,
    required this.headingDegrees,
  });

  final Color color;
  final Color borderColor;
  final double headingDegrees;

  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
        duration: GfTokens.durationSlower,
        curve: Curves.easeOutCubic,
        tween: Tween(begin: 0, end: headingDegrees),
        builder: (_, angle, __) => DecoratedBox(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: borderColor, width: 3),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
              gradient: RadialGradient(
                colors: [
                  color.withValues(alpha: 0.95),
                  color.withValues(alpha: 0.6)
                ],
              ),
            ),
            child: Transform.rotate(
              angle: angle * math.pi / 180,
              child: const Icon(
                Icons.directions_car,
                size: 22,
                color: Colors.white,
              ),
            ),
          ),
      );
}

class _ShimmerBar extends StatelessWidget {
  const _ShimmerBar({required this.animation});
  final Animation<double> animation;

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 10,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: AnimatedBuilder(
            animation: animation,
            builder: (context, _) => CustomPaint(
              painter: _ShimmerPainter(progress: animation.value),
              child: const SizedBox.expand(),
            ),
          ),
        ),
      );
}

class _ShimmerPainter extends CustomPainter {
  _ShimmerPainter({required this.progress});
  final double progress;

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
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
    canvas
      ..drawRect(Offset.zero & size, base)
      ..drawRect(Offset.zero & size, shimmer);
  }

  @override
  bool shouldRepaint(covariant _ShimmerPainter oldDelegate) =>
      oldDelegate.progress != progress;
}

class _MapShimmerOverlay extends StatelessWidget {
  const _MapShimmerOverlay({required this.animation});
  final Animation<double> animation;

  @override
  Widget build(BuildContext context) => IgnorePointer(
        child: Align(
          alignment: Alignment.bottomCenter,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16 + 56),
            child: _GlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _ShimmerBar(animation: animation),
                  const SizedBox(height: 10),
                  _ShimmerBar(animation: animation),
                  const SizedBox(height: 10),
                  _ShimmerBar(animation: animation),
                ],
              ),
            ),
          ),
        ),
      );
}

class _GradientFab extends StatelessWidget {
  const _GradientFab(
      {required this.icon, required this.label, required this.onPressed});
  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.colorScheme.primary,
            theme.colorScheme.secondary,
          ],
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withValues(alpha: 0.35),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: FloatingActionButton.extended(
        onPressed: onPressed,
        backgroundColor: Colors.transparent,
        elevation: 0,
        label: Text(label),
        icon: Icon(icon),
      ),
    );
  }
}

class _GlassBottomSheet extends StatelessWidget {
  const _GlassBottomSheet({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface.withValues(alpha: 0.75),
            border: Border(
              top: BorderSide(
                color: theme.colorScheme.outlineVariant.withValues(alpha: 0.3),
              ),
            ),
          ),
          child: child,
        ),
      ),
    );
  }
}

class _IncidentReportSheet extends StatefulWidget {
  const _IncidentReportSheet({required this.scrollController});
  final ScrollController scrollController;

  @override
  State<_IncidentReportSheet> createState() => _IncidentReportSheetState();
}

class _IncidentReportSheetState extends State<_IncidentReportSheet> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView(
      controller: widget.scrollController,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        Center(
          child: Container(
            width: 44,
            height: 5,
            decoration: BoxDecoration(
              color: theme.colorScheme.outline.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(100),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Icon(Icons.report_problem, color: theme.colorScheme.tertiary),
            const SizedBox(width: 8),
            Text('Reportar Incidente',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                )),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          'Descreva o que aconteceu:',
          style: theme.textTheme.bodyMedium,
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: _controller,
          maxLines: 5,
          decoration: InputDecoration(
            hintText: 'Ex: Atraso na chegada, problema no veiculo...',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancelar'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: FilledButton(
                onPressed: () {
                  HapticFeedback.mediumImpact();
                  Navigator.pop(context, _controller.text.trim());
                },
                child: const Text('Enviar'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

