// lib/screens/carrier/carrier_dashboard.dart
import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/routing/app_router.dart';
import '../../core/services/snackbar_service.dart';
import '../../core/theme/gf_tokens.dart';
import '../../models/trip.dart';
import '../../models/user.dart';
import '../../services/auth_service.dart';
import '../../services/supabase_service.dart';

class CarrierDashboard extends StatefulWidget {
  const CarrierDashboard({required this.user, super.key});
  final User user;

  @override
  State<CarrierDashboard> createState() => _CarrierDashboardState();
}

class _CarrierDashboardState extends State<CarrierDashboard>
    with SingleTickerProviderStateMixin {
  final _auth = AuthService();
  final _svc = SupabaseService.instance;

  final _searchCtrl = TextEditingController();
  String _statusFilter =
      'all'; // all | inProgress | scheduled | completed | cancelled

  bool _loading = true;
  String? _error;

  List<Trip> _trips = const [];
  List<Map<String, dynamic>> _vehicles = const [];
  List<Map<String, dynamic>> _routes = const [];

  Timer? _pollTimer;
  late final AnimationController _anim =
      AnimationController(vsync: this, duration: GfTokens.durationSlower);

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await _loadAll(firstLoad: true);
    // Poll leve a cada 20s
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(
      const Duration(seconds: 20),
      (_) => unawaited(_loadAll()),
    );
    unawaited(_anim.forward());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _searchCtrl.dispose();
    _anim.dispose();
    super.dispose();
  }

  Future<void> _loadAll({bool firstLoad = false}) async {
    setState(() {
      if (firstLoad) _loading = true;
      _error = null;
    });
    try {
      final trips =
          await _svc.getTripsForUser(); // RLS cuida por perfil (carrier)
      final vehicles = await _svc.getVehiclesForUser();
      final routes = await _svc.getRoutesForUser();

      trips.sort(_byPriorityThenTime);

      setState(() {
        _trips = trips;
        _vehicles = vehicles;
        _routes = routes;
      });
    } on Exception catch (error) {
      setState(() => _error = 'Falha ao carregar dados: $error');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  int _byPriorityThenTime(Trip a, Trip b) {
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

    final as = a.scheduledStartTime;
    final bs = b.scheduledStartTime;
    if (as != null && bs != null) return as.compareTo(bs);

    return b.updatedAt.compareTo(a.updatedAt);
  }

  Future<void> _signOut() async {
    try {
      await _auth.signOut();
      if (!mounted) return;
      AppRouter.instance.go('/');
    } on Exception catch (error) {
      if (!mounted) return;
      SnackBarService.error(
        context,
        error,
        fallbackKey: 'auth.logout.error',
      );
    }
  }

  /* =============== DERIVADOS / KPIs =============== */

  List<Trip> get _filteredTrips {
    final q = _searchCtrl.text.trim().toLowerCase();
    final st = _statusFilter.toLowerCase();

    return _trips.where((t) {
      final okStatus = st == 'all' || t.status.toLowerCase() == st;
      final match = q.isEmpty ||
          t.id.toLowerCase().contains(q) ||
          (t.notes ?? '').toLowerCase().contains(q) ||
          t.routeId.toLowerCase().contains(q) ||
          (t.vehicleId ?? '').toLowerCase().contains(q) ||
          (t.driverId ?? '').toLowerCase().contains(q);
      return okStatus && match;
    }).toList();
  }

  int get _kpiActiveTrips =>
      _trips.where((t) => t.status.toLowerCase() == 'inprogress').length;

  int get _kpiScheduledToday {
    final now = DateTime.now();
    bool same(DateTime a, DateTime b) =>
        a.year == b.year && a.month == b.month && a.day == b.day;
    return _trips.where((t) {
      final d = t.scheduledStartTime;
      return d != null && same(d, now);
    }).length;
  }

  int get _kpiCompletedToday {
    final now = DateTime.now();
    bool same(DateTime a, DateTime b) =>
        a.year == b.year && a.month == b.month && a.day == b.day;
    return _trips.where((t) {
      final d = t.actualEndTime;
      return d != null && same(d, now);
    }).length;
  }

  int get _fleetSize => _vehicles.length;

  int get _activeDrivers {
    final ids = <String>{};
    for (final t in _trips) {
      if (t.status.toLowerCase() == 'inprogress' &&
          (t.driverId ?? '').isNotEmpty) {
        ids.add(t.driverId!);
      }
    }
    return ids.length;
  }

  // Veiculos "ativos" = aparecem em viagem em progresso
  bool _vehicleActive(String? vehicleId) =>
      vehicleId != null &&
      _trips.any((t) =>
          t.status.toLowerCase() == 'inprogress' && t.vehicleId == vehicleId);

  /* ====================== UI ====================== */

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: t.colorScheme.surface,
        titleSpacing: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('GolfFox Carrier'),
            Text(
              widget.user.name,
              style: t.textTheme.bodySmall?.copyWith(
                color: t.colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Atualizar',
            onPressed: _loading ? null : () => _loadAll(firstLoad: true),
            icon: const Icon(Icons.refresh),
          ),
          PopupMenuButton<String>(
            onSelected: (v) {
              if (v == 'logout') _signOut();
            },
            itemBuilder: (context) => const [
              PopupMenuItem(
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
        onRefresh: () => _loadAll(firstLoad: true),
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
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 56, color: t.colorScheme.error),
              const SizedBox(height: 12),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: () => _loadAll(firstLoad: true),
                icon: const Icon(Icons.refresh),
                label: const Text('Tentar novamente'),
              ),
            ],
          ),
        ),
      );
    }

    return LayoutBuilder(builder: (context, c) {
      final isWide = c.maxWidth >= 1100;
      final isMedium = c.maxWidth >= 820 && c.maxWidth < 1100;

      return ListView(
        padding:
            EdgeInsets.symmetric(horizontal: isWide ? 24 : 16, vertical: 16),
        children: [
          _HeaderRow(
            searchCtrl: _searchCtrl,
            onChanged: (_) => setState(() {}),
            onClear: () {
              _searchCtrl.clear();
              setState(() {});
            },
            statusFilter: _statusFilter,
            onSelectStatus: (v) => setState(() => _statusFilter = v),
            routes: _routes,
          ),
          const SizedBox(height: 16),
          _KpiGrid(
            isWide: isWide,
            isMedium: isMedium,
            controller: _anim,
            cards: [
              KpiSpec('Viagens ativas', _kpiActiveTrips, Icons.timeline,
                  t.colorScheme.primary),
              KpiSpec('Agendadas hoje', _kpiScheduledToday, Icons.schedule,
                  t.colorScheme.tertiary),
              KpiSpec('Concluidas hoje', _kpiCompletedToday, Icons.check_circle,
                  t.colorScheme.secondary),
              KpiSpec('Frota', _fleetSize, Icons.local_shipping,
                  t.colorScheme.primary),
              KpiSpec('Motoristas ativos', _activeDrivers, Icons.badge,
                  t.colorScheme.secondary),
            ],
          ),
          const SizedBox(height: 20),
          if (isWide) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Coluna principal (viagens)
                Expanded(
                  flex: 2,
                  child: _TripsPanel(
                    trips: _filteredTrips,
                    onTapTrip: _openTripSoon,
                  ),
                ),
                const SizedBox(width: 16),
                // Coluna lateral (frota + acoes)
                Expanded(
                  child: Column(
                    children: [
                      _FleetPanel(
                        vehicles: _vehicles,
                        isActive: _vehicleActive,
                        onAction: _vehicleAction,
                      ),
                      const SizedBox(height: 16),
                      _QuickActions(onRefresh: () => _loadAll(firstLoad: true)),
                    ],
                  ),
                ),
              ],
            ),
          ] else ...[
            _TripsPanel(trips: _filteredTrips, onTapTrip: _openTripSoon),
            const SizedBox(height: 16),
            _FleetPanel(
              vehicles: _vehicles,
              isActive: _vehicleActive,
              onAction: _vehicleAction,
            ),
            const SizedBox(height: 16),
            _QuickActions(onRefresh: () => _loadAll(firstLoad: true)),
          ],
          const SizedBox(height: 8),
        ],
      );
    });
  }

  void _openTripSoon(Trip t) {
    // De proposito: tela de detalhe generica poderia ser diferente no contexto de transportadora
    SnackBarService.infoText(
      context,
      'Detalhes da viagem ${t.id.substring(0, 8)} - em breve',
    );
  }

  void _vehicleAction(Map<String, dynamic> v, String action) {
    SnackBarService.infoText(
      context,
      '"$action" para ${_vehicleLabel(v)} - em breve',
    );
  }

  String _vehicleLabel(Map<String, dynamic> v) => (v['plate'] ?? v['name'] ?? v['id'] ?? 'veiculo').toString();
}

/* ======================= WIDGETS ======================= */

class _HeaderRow extends StatelessWidget {
  const _HeaderRow({
    required this.searchCtrl,
    required this.onChanged,
    required this.onClear,
    required this.statusFilter,
    required this.onSelectStatus,
    required this.routes,
  });

  final TextEditingController searchCtrl;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;
  final String statusFilter;
  final ValueChanged<String> onSelectStatus;
  final List<Map<String, dynamic>> routes;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Wrap(
      alignment: WrapAlignment.spaceBetween,
      runSpacing: 12,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Text('Painel da Transportadora',
            style: t.textTheme.headlineSmall
                ?.copyWith(fontWeight: FontWeight.w700)),
        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: TextField(
            controller: searchCtrl,
            onChanged: onChanged,
            decoration: InputDecoration(
              hintText: 'Buscar por ID, rota, veiculo, motorista...',
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
              _StatusChip('Todas', 'all', statusFilter, onSelectStatus),
              _StatusChip(
                  'Em andamento', 'inProgress', statusFilter, onSelectStatus),
              _StatusChip(
                  'Agendadas', 'scheduled', statusFilter, onSelectStatus),
              _StatusChip(
                  'Concluidas', 'completed', statusFilter, onSelectStatus),
              _StatusChip(
                  'Canceladas', 'cancelled', statusFilter, onSelectStatus),
            ],
          ),
        ),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip(this.label, this.value, this.current, this.onSelect);
  final String label;
  final String value;
  final String current;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    final selected = current == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onSelect(value),
        selectedColor: t.colorScheme.primary,
        backgroundColor: t.colorScheme.surfaceContainerHighest,
        labelStyle: t.textTheme.labelMedium?.copyWith(
          color: selected ? t.colorScheme.onPrimary : t.colorScheme.onSurface,
        ),
      ),
    );
  }
}

class KpiSpec {
  KpiSpec(this.title, this.value, this.icon, this.color);
  final String title;
  final int value;
  final IconData icon;
  final Color color;
}

class _KpiGrid extends StatelessWidget {
  const _KpiGrid({
    required this.isWide,
    required this.isMedium,
    required this.controller,
    required this.cards,
  });

  final bool isWide;
  final bool isMedium;
  final AnimationController controller;
  final List<KpiSpec> cards;

  @override
  Widget build(BuildContext context) {
    final cross = isWide ? 4 : (isMedium ? 3 : 2);
    return GridView.count(
      crossAxisCount: cross,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 2.2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      children: cards
          .map((k) => _KpiCard(
                title: k.title,
                value: k.value,
                icon: k.icon,
                color: k.color,
                controller: controller,
              ))
          .toList(),
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    required this.controller,
  });

  final String title;
  final int value;
  final IconData icon;
  final Color color;
  final AnimationController controller;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return ScaleTransition(
      scale: CurvedAnimation(parent: controller, curve: Curves.easeOutBack),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: t.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TweenAnimationBuilder<int>(
                    tween: IntTween(begin: 0, end: value),
                    duration: GfTokens.durationSlower,
                    builder: (_, v, __) => Text(
                      '$v',
                      style: t.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: color,
                      ),
                    ),
                  ),
                  Text(
                    title,
                    style: t.textTheme.labelMedium?.copyWith(
                      color: t.colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TripsPanel extends StatelessWidget {
  const _TripsPanel({required this.trips, required this.onTapTrip});
  final List<Trip> trips;
  final ValueChanged<Trip> onTapTrip;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: t.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(14),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          _PanelHeader(
            title: 'Viagens',
            trailing:
                Text('${trips.length} itens', style: t.textTheme.labelMedium),
          ),
          const Divider(height: 16),
          if (trips.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text(
                'Nenhuma viagem encontrada.',
                style: t.textTheme.bodyMedium?.copyWith(
                  color: t.colorScheme.onSurface.withValues(alpha: 0.7),
                ),
                textAlign: TextAlign.center,
              ),
            )
          else
            ...trips
                .take(60)
                .map((e) => _TripRow(trip: e, onTap: () => onTapTrip(e))),
        ],
      ),
    );
  }
}

class _TripRow extends StatelessWidget {
  const _TripRow({required this.trip, required this.onTap});
  final Trip trip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);

    Color c;
    String label;
    // No icon currently displayed
    switch (trip.status.toLowerCase()) {
      case 'inprogress':
        c = t.colorScheme.secondary;
        label = 'Em andamento';

        break;
      case 'scheduled':
        c = t.colorScheme.tertiary;
        label = 'Agendada';

        break;
      case 'completed':
        c = t.colorScheme.primary;
        label = 'Concluida';

        break;
      case 'cancelled':
        c = t.colorScheme.error;
        label = 'Cancelada';

        break;
      default:
        c = t.colorScheme.outline;
        label = trip.status;
    }

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
        child: Row(
          children: [
            Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(color: c, shape: BoxShape.circle)),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Trip #${trip.id.substring(0, 8)}',
                        style: t.textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 2),
                    Text(
                      (trip.notes ?? '').isNotEmpty
                          ? trip.notes!
                          : 'Rota: ${trip.routeId} -  Veiculo: ${trip.vehicleId ?? '-'}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: t.textTheme.bodySmall?.copyWith(
                        color: t.colorScheme.onSurface.withValues(alpha: 0.7),
                      ),
                    ),
                  ]),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (trip.scheduledStartTime != null)
                  Text(
                    _fmt(trip.scheduledStartTime!),
                    style: t.textTheme.labelMedium?.copyWith(
                      color: t.colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                const SizedBox(height: 4),
                _StatusPill(text: label, color: c),
              ],
            ),
            const SizedBox(width: 6),
            Icon(Icons.more_horiz, color: t.colorScheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }

  String _fmt(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')} '
      '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
}

class _FleetPanel extends StatelessWidget {
  const _FleetPanel({
    required this.vehicles,
    required this.isActive,
    required this.onAction,
  });

  final List<Map<String, dynamic>> vehicles;
  final bool Function(String? vehicleId) isActive;
  final void Function(Map<String, dynamic> vehicle, String action) onAction;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: t.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(14),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          const _PanelHeader(title: 'Frota'),
          const Divider(height: 16),
          if (vehicles.isEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Sem veiculos cadastrados.',
                style: t.textTheme.bodySmall?.copyWith(
                  color: t.colorScheme.onSurface.withValues(alpha: 0.7),
                ),
              ),
            )
          else
            ...vehicles.take(8).map((v) {
              final id = (v['id'] ?? '').toString();
              final plate = (v['plate'] ?? '').toString();
              final name = (v['name'] ?? v['model'] ?? '').toString();
              final active = isActive(id);
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: active
                            ? t.colorScheme.secondary
                            : t.colorScheme.outline,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        [plate, name]
                                .where((e) => e.isNotEmpty)
                                .join(' -  ')
                                .trim()
                                .isEmpty
                            ? 'Veiculo ${id.substring(0, id.length >= 6 ? 6 : id.length)}'
                            : [plate, name]
                                .where((e) => e.isNotEmpty)
                                .join(' -  '),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 6),
                    PopupMenuButton<String>(
                      onSelected: (a) => onAction(v, a),
                      itemBuilder: (_) => const [
                        PopupMenuItem(
                            value: 'mensagem', child: Text('Enviar mensagem')),
                        PopupMenuItem(
                            value: 'detalhes', child: Text('Ver detalhes')),
                        PopupMenuItem(
                            value: 'bloquear', child: Text('Bloquear veiculo')),
                      ],
                      child: Icon(Icons.more_vert,
                          color: t.colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              );
            }),
          if (vehicles.length > 8) ...[
            const SizedBox(height: 8),
            Text(
              '+${vehicles.length - 8} mais',
              style: t.textTheme.labelSmall?.copyWith(
                color: t.colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({required this.onRefresh});
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        color: t.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(14),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          const _PanelHeader(title: 'Acoes rapidas'),
          const Divider(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _ActionButton(
                icon: Icons.analytics,
                label: 'Relatorios',
                onTap: () => _soon(context, 'Relatorios'),
              ),
              _ActionButton(
                icon: Icons.group,
                label: 'Motoristas',
                onTap: () => _soon(context, 'Gestao de motoristas'),
              ),
              _ActionButton(
                icon: Icons.map,
                label: 'Mapa da frota',
                onTap: () => _soon(context, 'Mapa da frota'),
              ),
              _ActionButton(
                icon: Icons.refresh,
                label: 'Atualizar',
                onTap: onRefresh,
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _soon(BuildContext context, String f) {
    SnackBarService.infoText(context, '$f - em breve');
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton(
      {required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
        decoration: BoxDecoration(
          color: t.colorScheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: t.colorScheme.outline.withValues(alpha: 0.18)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: t.colorScheme.primary),
            const SizedBox(width: 8),
            Text(label, style: t.textTheme.labelLarge),
          ],
        ),
      ),
    );
  }
}

class _PanelHeader extends StatelessWidget {
  const _PanelHeader({required this.title, this.trailing});
  final String title;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Row(
      children: [
        Text(title,
            style:
                t.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
        const Spacer(),
        if (trailing != null) trailing!,
      ],
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.text, required this.color});
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: t.textTheme.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

