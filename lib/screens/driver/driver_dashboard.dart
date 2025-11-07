// lib/screens/driver/driver_dashboard.dart
import 'dart:async';
import 'package:flutter/material.dart';
import '../../models/user.dart';
import '../../models/trip.dart';
import '../../services/supabase_service.dart';
import '../../services/tracking_service.dart';
import '../../services/auth_service.dart';
import '../../core/routing/app_router.dart';
import 'trip_detail_screen.dart';
import '../../core/theme/gf_tokens.dart';

class DriverDashboard extends StatefulWidget {
  const DriverDashboard({super.key, required this.user});
  final User user;

  @override
  State<DriverDashboard> createState() => _DriverDashboardState();
}

class _DriverDashboardState extends State<DriverDashboard>
    with SingleTickerProviderStateMixin {
  final _svc = SupabaseService.instance;
  final _auth = AuthService();
  final _tracking = TrackingService();

  final _searchCtrl = TextEditingController();
  String _statusFilter =
      'all'; // all | scheduled | inProgress | completed | cancelled

  bool _loading = true;
  String? _error;
  List<Trip> _trips = const [];

  StreamSubscription<List<Map<String, dynamic>>>? _tripSub;
  StreamSubscription<TrackingStatus>? _trackSub;

  // UI anim
  late final AnimationController _anim =
      AnimationController(vsync: this, duration: GfTokens.durationSlower);

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await _loadTrips(firstLoad: true);
    _subscribeRealtime();
    _subscribeTracking();
    _anim.forward();
  }

  @override
  void dispose() {
    _tripSub?.cancel();
    _trackSub?.cancel();
    _searchCtrl.dispose();
    _anim.dispose();
    super.dispose();
  }

  Future<void> _loadTrips({bool firstLoad = false}) async {
    setState(() {
      if (firstLoad) _loading = true;
      _error = null;
    });
    try {
      final trips = await _svc.getTripsForUser(limit: 200);
      trips.sort(_compareTrips);
      setState(() => _trips = trips);
    } catch (e) {
      setState(() => _error = 'Erro ao carregar viagens: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _subscribeRealtime() {
    _tripSub?.cancel();
    _tripSub = _svc.client
        .from('trips')
        .stream(primaryKey: ['id'])
        .eq('driver_id', widget.user.id)
        .order('updated_at')
        .listen((rows) {
          final trips = rows.map(Trip.fromJson).toList();
          trips.sort(_compareTrips);
          if (mounted) setState(() => _trips = trips);
        });
  }

  void _subscribeTracking() {
    // Exibe status/queue no AppBar em tempo real
    _trackSub?.cancel();
    _trackSub = _tracking.statusStream.listen((_) {
      if (mounted) setState(() {}); // apenas para redesenhar o badge
    });
  }

  int _compareTrips(Trip a, Trip b) {
    int rank(String s) {
      switch (s.toLowerCase()) {
        case 'inprogress':
          return 0;
        case 'scheduled':
          return 1;
        case 'completed':
          return 2;
        case 'cancelled':
          return 3;
        default:
          return 4;
      }
    }

    final r = rank(a.status).compareTo(rank(b.status));
    if (r != 0) return r;

    // Entre scheduled, mais proxima primeiro
    final as = a.scheduledStartTime;
    final bs = b.scheduledStartTime;
    if (as != null && bs != null) return as.compareTo(bs);

    // Fallback: atualizados mais recentes primeiro
    return b.updatedAt.compareTo(a.updatedAt);
  }

  Trip? get _activeTrip {
    try {
      return _trips.firstWhere((t) => t.status.toLowerCase() == 'inprogress');
    } catch (_) {}
    try {
      return _trips.firstWhere((t) => t.status.toLowerCase() == 'scheduled');
    } catch (_) {}
    return _trips.isNotEmpty ? _trips.first : null;
  }

  List<Trip> get _filtered {
    final q = _searchCtrl.text.trim().toLowerCase();
    final st = _statusFilter.toLowerCase();
    return _trips.where((t) {
      final okStatus = st == 'all' || t.status.toLowerCase() == st;
      final match = q.isEmpty ||
          t.id.toLowerCase().contains(q) ||
          (t.notes ?? '').toLowerCase().contains(q) ||
          t.routeId.toLowerCase().contains(q) ||
          (t.vehicleId ?? '').toLowerCase().contains(q);
      return okStatus && match;
    }).toList();
  }

  Future<void> _signOut() async {
    try {
      if (_tracking.isTracking) {
        await _tracking.stopTracking();
      }
      await _auth.signOut();
      if (!mounted) return;
      AppRouter.instance.go('/');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao fazer logout: $e')),
      );
    }
  }

  Future<void> _handleAction(Trip trip, String action) async {
    final t = Theme.of(context);
    try {
      if (action == 'start') {
        await _svc.updateTrip(trip.copyWith(
          status: 'inProgress',
          actualStartTime: DateTime.now(),
        ));
        await _tracking.startTracking(
            tripId: trip.id, driverId: widget.user.id);
      } else if (action == 'resume') {
        await _tracking.startTracking(
            tripId: trip.id, driverId: widget.user.id);
      } else if (action == 'stopTracking') {
        await _tracking.stopTracking();
      } else if (action == 'complete') {
        await _svc.updateTrip(trip.copyWith(
          status: 'completed',
          actualEndTime: DateTime.now(),
        ));
        if (_tracking.isTracking) await _tracking.stopTracking();
      } else if (action == 'cancel') {
        await _svc.updateTrip(trip.copyWith(status: 'cancelled'));
        if (_tracking.isTracking) await _tracking.stopTracking();
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text('Acao concluida para ${trip.id.substring(0, 8)}')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            backgroundColor: t.colorScheme.error, content: Text('Falha: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    final tracking = _tracking.isTracking;
    final queued = _tracking.offlineQueueLength;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: t.colorScheme.surface,
        titleSpacing: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('GolfFox Driver'),
            Text(
              widget.user.name,
              style: t.textTheme.bodySmall?.copyWith(
                color: t.colorScheme.onSurface.withOpacity(0.7),
              ),
            ),
          ],
        ),
        actions: [
          // Badge do tracking
          AnimatedSwitcher(
            duration: GfTokens.duration,
            child: tracking
                ? Padding(
                    key: const ValueKey('trk-on'),
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Container(
                      margin: const EdgeInsets.only(right: 6),
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
                          queued > 0 ? 'Ativo  $queued' : 'Ativo',
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
          PopupMenuButton<String>(
            onSelected: (v) {
              if (v == 'logout') _signOut();
              if (v == 'retrySync') _tracking.retryOfflineSync();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'retrySync',
                child: Row(children: [
                  Icon(Icons.sync),
                  SizedBox(width: 8),
                  Text('Sincronizar agora')
                ]),
              ),
              const PopupMenuItem(
                value: 'logout',
                child: Row(children: [
                  Icon(Icons.logout),
                  SizedBox(width: 8),
                  Text('Sair')
                ]),
              ),
            ],
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _loadTrips(firstLoad: true),
        child: _buildBody(t),
      ),
    );
  }

  Widget _buildBody(ThemeData t) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.error_outline, size: 64, color: t.colorScheme.error),
            const SizedBox(height: 12),
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () => _loadTrips(firstLoad: true),
              icon: const Icon(Icons.refresh),
              label: const Text('Tentar novamente'),
            ),
          ]),
        ),
      );
    }

    return LayoutBuilder(builder: (context, c) {
      final isWide = c.maxWidth >= 900;

      return ListView(
        padding:
            EdgeInsets.symmetric(horizontal: isWide ? 24 : 16, vertical: 16),
        children: [
          // Header com busca e filtros
          _Header(
            searchCtrl: _searchCtrl,
            onSearchChanged: (_) => setState(() {}),
            onClear: () {
              _searchCtrl.clear();
              setState(() {});
            },
            statusFilter: _statusFilter,
            onStatusChanged: (v) => setState(() => _statusFilter = v),
          ),
          const SizedBox(height: 12),

          // Card da viagem ativa (fixo no topo)
          AnimatedSwitcher(
            duration: GfTokens.durationSlow,
            child: _activeTrip == null
                ? const SizedBox.shrink()
                : _ActiveTripCard(
                    key: ValueKey(_activeTrip!.id),
                    trip: _activeTrip!,
                    onOpen: () => _openTrip(_activeTrip!),
                    onAction: (a) => _handleAction(_activeTrip!, a),
                  ),
          ),
          const SizedBox(height: 12),

          // Lista responsiva
          if (isWide)
            _GridTrips(
              trips: _filtered,
              onTap: _openTrip,
              onAction: _handleAction,
              controller: _anim,
            )
          else
            _ListTrips(
              trips: _filtered,
              onTap: _openTrip,
              onAction: _handleAction,
              controller: _anim,
            ),
        ],
      );
    });
  }

  void _openTrip(Trip trip) {
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
          builder: (_) => TripDetailScreen(trip: trip, user: widget.user)),
    ).then((_) => _loadTrips());
  }
}

/* ====================== SUBWIDGETS ====================== */

class _Header extends StatelessWidget {
  const _Header({
    required this.searchCtrl,
    required this.onSearchChanged,
    required this.onClear,
    required this.statusFilter,
    required this.onStatusChanged,
  });

  final TextEditingController searchCtrl;
  final ValueChanged<String> onSearchChanged;
  final VoidCallback onClear;
  final String statusFilter;
  final ValueChanged<String> onStatusChanged;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      crossAxisAlignment: WrapCrossAlignment.center,
      alignment: WrapAlignment.spaceBetween,
      children: [
        Text('Minhas viagens',
            style: t.textTheme.headlineSmall
                ?.copyWith(fontWeight: FontWeight.w700)),
        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: TextField(
            controller: searchCtrl,
            onChanged: onSearchChanged,
            decoration: InputDecoration(
              hintText: 'Buscar por ID, rota, veiculo...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: searchCtrl.text.isEmpty
                  ? null
                  : IconButton(
                      onPressed: onClear, icon: const Icon(Icons.close)),
              border:
                  OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              isDense: true,
            ),
          ),
        ),
        SizedBox(
          height: 40,
          child: ListView(
            shrinkWrap: true,
            scrollDirection: Axis.horizontal,
            children: [
              _StatusChip('Todas', 'all', statusFilter, onStatusChanged),
              _StatusChip(
                  'Agendadas', 'scheduled', statusFilter, onStatusChanged),
              _StatusChip(
                  'Em andamento', 'inProgress', statusFilter, onStatusChanged),
              _StatusChip(
                  'Concluidas', 'completed', statusFilter, onStatusChanged),
              _StatusChip(
                  'Canceladas', 'cancelled', statusFilter, onStatusChanged),
            ],
          ),
        ),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip(this.label, this.value, this.current, this.onChanged);
  final String label;
  final String value;
  final String current;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    final selected = value == current;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onChanged(value),
        selectedColor: t.colorScheme.primary,
        labelStyle: t.textTheme.labelMedium?.copyWith(
          color: selected ? t.colorScheme.onPrimary : t.colorScheme.onSurface,
        ),
        backgroundColor: t.colorScheme.surfaceContainerHighest,
      ),
    );
  }
}

class _ActiveTripCard extends StatelessWidget {
  const _ActiveTripCard(
      {required this.trip, required this.onOpen, required this.onAction, super.key});
  final Trip trip;
  final VoidCallback onOpen;
  final ValueChanged<String> onAction;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [t.colorScheme.secondary, t.colorScheme.primary],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Icon(Icons.directions_car, color: t.colorScheme.onPrimary, size: 28),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Ativa -  #${trip.id.substring(0, 8)}',
              style: t.textTheme.titleMedium?.copyWith(
                color: t.colorScheme.onPrimary,
                fontWeight: FontWeight.w700,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          FilledButton.tonal(
            style: FilledButton.styleFrom(
              backgroundColor: t.colorScheme.onPrimary.withOpacity(0.12),
              foregroundColor: t.colorScheme.onPrimary,
              padding: const EdgeInsets.symmetric(horizontal: 12),
            ),
            onPressed: onOpen,
            child: const Text('Abrir'),
          ),
          const SizedBox(width: 8),
          IconButton.filled(
            style: IconButton.styleFrom(
              backgroundColor: t.colorScheme.onPrimary.withOpacity(0.12),
              foregroundColor: t.colorScheme.onPrimary,
            ),
            onPressed: () => onAction('complete'),
            icon: const Icon(Icons.flag_circle),
            tooltip: 'Concluir',
          ),
        ],
      ),
    );
  }
}

class _ListTrips extends StatelessWidget {
  const _ListTrips({
    required this.trips,
    required this.onTap,
    required this.onAction,
    required this.controller,
  });

  final List<Trip> trips;
  final ValueChanged<Trip> onTap;
  final void Function(Trip, String) onAction;
  final AnimationController controller;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    if (trips.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.route,
              size: 64, color: t.colorScheme.onSurface.withOpacity(0.5)),
          const SizedBox(height: 8),
          Text('Nenhuma viagem encontrada',
              style: t.textTheme.titleMedium, textAlign: TextAlign.center),
          const SizedBox(height: 4),
          Text(
            'Suas viagens aparecerao aqui quando disponiveis.',
            style: t.textTheme.bodySmall?.copyWith(
              color: t.colorScheme.onSurface.withOpacity(0.7),
            ),
            textAlign: TextAlign.center,
          ),
        ]),
      );
    }

    return Column(
      children: [
        for (final trip in trips)
          ScaleTransition(
            scale:
                CurvedAnimation(parent: controller, curve: Curves.easeOutBack),
            child: _TripCard(
              trip: trip,
              onTap: () => onTap(trip),
              onAction: (a) => onAction(trip, a),
            ),
          ),
      ],
    );
  }
}

class _GridTrips extends StatelessWidget {
  const _GridTrips({
    required this.trips,
    required this.onTap,
    required this.onAction,
    required this.controller,
  });

  final List<Trip> trips;
  final ValueChanged<Trip> onTap;
  final void Function(Trip, String) onAction;
  final AnimationController controller;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    if (trips.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(24),
        child: Center(
          child:
              Text('Nenhuma viagem encontrada', style: t.textTheme.titleMedium),
        ),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: trips.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisExtent: 170,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12),
      itemBuilder: (_, i) => ScaleTransition(
        scale: CurvedAnimation(parent: controller, curve: Curves.easeOutBack),
        child: _TripCard(
          trip: trips[i],
          onTap: () => onTap(trips[i]),
          onAction: (a) => onAction(trips[i], a),
        ),
      ),
    );
  }
}

class _TripCard extends StatelessWidget {
  const _TripCard(
      {required this.trip, required this.onTap, required this.onAction});
  final Trip trip;
  final VoidCallback onTap;
  final ValueChanged<String> onAction;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);

    final status = trip.status.toLowerCase();
    Color color;
    IconData icon;
    String label;
    switch (status) {
      case 'scheduled':
        color = t.colorScheme.tertiary;
        icon = Icons.schedule;
        label = 'Agendada';
        break;
      case 'inprogress':
        color = t.colorScheme.secondary;
        icon = Icons.directions_car;
        label = 'Em andamento';
        break;
      case 'completed':
        color = t.colorScheme.primary;
        icon = Icons.check_circle;
        label = 'Concluida';
        break;
      case 'cancelled':
        color = t.colorScheme.error;
        icon = Icons.cancel;
        label = 'Cancelada';
        break;
      default:
        color = t.colorScheme.outline;
        icon = Icons.help_outline;
        label = trip.status;
    }

    final canStart = status == 'scheduled';
    final inProg = status == 'inprogress';
    // inProg already computed; use directly when needed
    final canCancel = status == 'scheduled' || status == 'inprogress';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Dot
              Container(
                  width: 10,
                  height: 10,
                  decoration:
                      BoxDecoration(color: color, shape: BoxShape.circle)),
              const SizedBox(width: 10),
              // Info principal
              Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [
                            Icon(icon, size: 16, color: color),
                            const SizedBox(width: 4),
                            Text(label,
                                style: Theme.of(context)
                                    .textTheme
                                    .labelSmall
                                    ?.copyWith(
                                      color: color,
                                      fontWeight: FontWeight.w700,
                                    )),
                          ]),
                        ),
                        const Spacer(),
                        Icon(Icons.arrow_forward_ios,
                            size: 16,
                            color: t.colorScheme.onSurface.withOpacity(0.5)),
                      ]),
                      const SizedBox(height: 8),
                      Text('Viagem #${trip.id.substring(0, 8)}',
                          style: t.textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700)),
                      if (trip.scheduledStartTime != null) ...[
                        const SizedBox(height: 6),
                        Row(children: [
                          Icon(Icons.access_time,
                              size: 16,
                              color: t.colorScheme.onSurface.withOpacity(0.7)),
                          const SizedBox(width: 6),
                          Text(
                            _fmt(trip.scheduledStartTime!),
                            style: t.textTheme.bodySmall?.copyWith(
                              color: t.colorScheme.onSurface.withOpacity(0.7),
                            ),
                          ),
                        ]),
                      ],
                      if ((trip.notes ?? '').isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(
                          trip.notes!,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: t.textTheme.bodySmall?.copyWith(
                            color: t.colorScheme.onSurface.withOpacity(0.7),
                          ),
                        ),
                      ],
                      const SizedBox(height: 10),
                      // Acoes inline
                      Row(children: [
                        if (canStart)
                          FilledButton.icon(
                            onPressed: () => onAction('start'),
                            icon: const Icon(Icons.play_arrow),
                            label: const Text('Iniciar'),
                          ),
                        if (inProg) ...[
                          FilledButton.icon(
                            onPressed: () => onAction('complete'),
                            icon: const Icon(Icons.flag),
                            label: const Text('Concluir'),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton.icon(
                            onPressed: () => onAction('stopTracking'),
                            icon: const Icon(Icons.gps_off),
                            label: const Text('Parar rastreamento'),
                          ),
                        ],
                        const Spacer(),
                        if (!inProg)
                          TextButton.icon(
                            onPressed: () => onAction('resume'),
                            icon: const Icon(Icons.gps_fixed),
                            label: const Text('Rastrear'),
                          ),
                        if (canCancel) ...[
                          const SizedBox(width: 6),
                          TextButton.icon(
                            onPressed: () => onAction('cancel'),
                            icon: const Icon(Icons.cancel),
                            label: const Text('Cancelar'),
                          ),
                        ],
                      ]),
                    ]),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _fmt(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')} as ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
}
