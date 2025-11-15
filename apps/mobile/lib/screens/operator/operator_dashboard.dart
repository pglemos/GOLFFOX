// lib/screens/operator/operator_dashboard.dart
import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/routing/app_router.dart';
import '../../core/services/snackbar_service.dart';
import '../../core/theme/gf_tokens.dart';
import '../../models/trip.dart';
import '../../models/user.dart';
import '../../services/auth_service.dart';
import '../../services/supabase_service.dart';

class OperatorDashboard extends StatefulWidget {
  const OperatorDashboard({required this.user, super.key});
  final User user;

  @override
  State<OperatorDashboard> createState() => _OperatorDashboardState();
}

class _OperatorDashboardState extends State<OperatorDashboard>
    with SingleTickerProviderStateMixin {
  final _authService = AuthService();
  final _svc = SupabaseService.instance;

  final _searchCtrl = TextEditingController();
  Timer? _pollTimer;

  bool _loading = true;
  String? _error;
  List<Trip> _allTrips = const [];
  String _statusFilter =
      'all'; // all | inProgress | scheduled | completed | cancelled

  late final AnimationController _animCtrl = AnimationController(
    vsync: this,
    duration: GfTokens.durationSlower,
  );

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await _loadTrips(firstLoad: true);
    // Poll leve para operador (15s)
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(
      const Duration(seconds: 15),
      (_) => unawaited(_loadTrips()),
    );
    unawaited(_animCtrl.forward());
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _searchCtrl.dispose();
    _animCtrl.dispose();
    super.dispose();
  }

  Future<void> _signOut() async {
    try {
      await _authService.signOut();
      if (mounted) AppRouter.instance.go('/');
    } on Exception catch (error) {
      if (!mounted) return;
      SnackBarService.error(
        context,
        error,
        fallbackKey: 'auth.logout.error',
      );
    }
  }

  Future<void> _loadTrips({bool firstLoad = false}) async {
    setState(() {
      if (firstLoad) _loading = true;
      _error = null;
    });
    try {
      final trips = await _svc.getTripsForUser(limit: 200);
      trips.sort(_compareTripsByPriority);
      setState(() => _allTrips = trips);
    } on Exception catch (error) {
      setState(() => _error = 'Falha ao carregar viagens: $error');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  /* ---------- Helpers ---------- */

  int _compareTripsByPriority(Trip a, Trip b) {
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

    // Entre agendadas, mais proxima primeiro
    final as = a.scheduledStartTime;
    final bs = b.scheduledStartTime;
    if (as != null && bs != null) return as.compareTo(bs);

    // Fallback: atualizado mais recentemente primeiro
    return b.updatedAt.compareTo(a.updatedAt);
  }

  List<Trip> get _filteredTrips {
    final q = _searchCtrl.text.trim().toLowerCase();
    final st = _statusFilter.toLowerCase();
    return _allTrips.where((t) {
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

  int get _kpiActive =>
      _allTrips.where((t) => t.status.toLowerCase() == 'inprogress').length;
  int get _kpiScheduledToday {
    final now = DateTime.now();
    bool isSameDay(DateTime a, DateTime b) =>
        a.year == b.year && a.month == b.month && a.day == b.day;
    return _allTrips
        .where((t) =>
            t.scheduledStartTime != null &&
            isSameDay(t.scheduledStartTime!, now))
        .length;
  }

  int get _kpiCompletedToday {
    final now = DateTime.now();
    bool isSameDay(DateTime a, DateTime b) =>
        a.year == b.year && a.month == b.month && a.day == b.day;
    return _allTrips
        .where(
            (t) => t.actualEndTime != null && isSameDay(t.actualEndTime!, now))
        .length;
  }

  int get _kpiLate {
    final now = DateTime.now();
    return _allTrips.where((t) {
      if (t.status.toLowerCase() != 'scheduled') return false;
      final when = t.scheduledStartTime;
      return when != null && when.isBefore(now);
    }).length;
  }

  /* ---------- UI ---------- */

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
            const Text('GolfFox Operator'),
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
            onPressed: _loading ? null : () => _loadTrips(firstLoad: true),
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
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 56, color: t.colorScheme.error),
              const SizedBox(height: 12),
              Text(_error!,
                  style: t.textTheme.bodyMedium, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: () => _loadTrips(firstLoad: true),
                icon: const Icon(Icons.refresh),
                label: const Text('Tentar novamente'),
              ),
            ],
          ),
        ),
      );
    }

    return LayoutBuilder(
      builder: (context, c) {
        final isWide = c.maxWidth >= 1100;
        final isMedium = c.maxWidth >= 820 && c.maxWidth < 1100;

        return ListView(
          padding: EdgeInsets.symmetric(
            horizontal: isWide ? 24 : 16,
            vertical: 16,
          ),
          children: [
            // Header + Busca/Filtros
            _HeaderRow(
              searchCtrl: _searchCtrl,
              onChanged: (_) => setState(() {}),
              onClear: () {
                _searchCtrl.clear();
                setState(() {});
              },
              statusFilter: _statusFilter,
              onSelectStatus: (v) => setState(() => _statusFilter = v),
            ),
            const SizedBox(height: 16),

            // KPIs responsivos
            _KpiGrid(
              isWide: isWide,
              isMedium: isMedium,
              active: _kpiActive,
              scheduledToday: _kpiScheduledToday,
              completedToday: _kpiCompletedToday,
              lateCount: _kpiLate,
              controller: _animCtrl,
            ),
            const SizedBox(height: 20),

            // Paineis: Lista / Atividade / Acoes rapidas
            if (isWide) ...[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Lista principal (2/3)
                  Expanded(
                    flex: 2,
                    child: _TripsPanel(
                      trips: _filteredTrips,
                      onAction: _onTripAction,
                    ),
                  ),
                  const SizedBox(width: 16),
                  // Coluna lateral (1/3)
                  Expanded(
                    child: Column(
                      children: [
                        _RecentPanel(trips: _allTrips),
                        const SizedBox(height: 16),
                        _QuickActions(
                            onRefresh: () => _loadTrips(firstLoad: true)),
                      ],
                    ),
                  ),
                ],
              ),
            ] else ...[
              _TripsPanel(
                trips: _filteredTrips,
                onAction: _onTripAction,
              ),
              const SizedBox(height: 16),
              _RecentPanel(trips: _allTrips),
              const SizedBox(height: 16),
              _QuickActions(onRefresh: () => _loadTrips(firstLoad: true)),
            ],
            const SizedBox(height: 8),
          ],
        );
      },
    );
  }

  Future<void> _onTripAction(Trip trip) async {
    final t = Theme.of(context);
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (_) => _TripActionsSheet(trip: trip),
    );

    if (selected == null) return;

    try {
      if (selected == 'start') {
        await _svc.updateTrip(trip.copyWith(
            status: 'inProgress', actualStartTime: DateTime.now()));
      } else if (selected == 'complete') {
        await _svc.updateTrip(
            trip.copyWith(status: 'completed', actualEndTime: DateTime.now()));
      } else if (selected == 'cancel') {
        await _svc.updateTrip(trip.copyWith(status: 'cancelled'));
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text('Viagem atualizada: ${trip.id.substring(0, 8)}')),
      );
      await _loadTrips();
    } on Exception catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: t.colorScheme.error,
          content: Text('Falha ao atualizar: $error'),
        ),
      );
    }
  }
}

/* ======================= WIDGETS ======================= */

class _HeaderRow extends StatelessWidget {
  const _HeaderRow({
    required this.searchCtrl,
    required this.onChanged,
    required this.onClear,
    required this.statusFilter,
    required this.onSelectStatus,
  });

  final TextEditingController searchCtrl;
  final ValueChanged<String> onChanged;
  final VoidCallback onClear;
  final String statusFilter;
  final ValueChanged<String> onSelectStatus;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Wrap(
      alignment: WrapAlignment.spaceBetween,
      runSpacing: 12,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        // Titulo
        Text(
          'Painel do Operador',
          style:
              t.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
        ),
        // Busca
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
        // Filtros
        SizedBox(
          height: 40,
          child: ListView(
            shrinkWrap: true,
            scrollDirection: Axis.horizontal,
            children: [
              _StatusChip(
                  label: 'Todas',
                  value: 'all',
                  selected: statusFilter == 'all',
                  onSelect: onSelectStatus),
              _StatusChip(
                  label: 'Em andamento',
                  value: 'inProgress',
                  selected: statusFilter == 'inProgress',
                  onSelect: onSelectStatus),
              _StatusChip(
                  label: 'Agendadas',
                  value: 'scheduled',
                  selected: statusFilter == 'scheduled',
                  onSelect: onSelectStatus),
              _StatusChip(
                  label: 'Concluidas',
                  value: 'completed',
                  selected: statusFilter == 'completed',
                  onSelect: onSelectStatus),
              _StatusChip(
                  label: 'Canceladas',
                  value: 'cancelled',
                  selected: statusFilter == 'cancelled',
                  onSelect: onSelectStatus),
            ],
          ),
        ),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.label,
    required this.value,
    required this.selected,
    required this.onSelect,
  });

  final String label;
  final String value;
  final bool selected;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onSelect(value),
        labelStyle: t.textTheme.labelMedium?.copyWith(
          color: selected ? t.colorScheme.onPrimary : t.colorScheme.onSurface,
        ),
        selectedColor: t.colorScheme.primary,
        backgroundColor: t.colorScheme.surfaceContainerHighest,
      ),
    );
  }
}

class _KpiGrid extends StatelessWidget {
  const _KpiGrid({
    required this.isWide,
    required this.isMedium,
    required this.active,
    required this.scheduledToday,
    required this.completedToday,
    required this.lateCount,
    required this.controller,
  });

  final bool isWide;
  final bool isMedium;
  final int active;
  final int scheduledToday;
  final int completedToday;
  final int lateCount;
  final AnimationController controller;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    final cross = isWide ? 4 : (isMedium ? 4 : 2);

    return GridView.count(
      crossAxisCount: cross,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 2.2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      children: [
        _KpiCard(
          title: 'Viagens ativas',
          value: active,
          icon: Icons.timeline,
          color: t.colorScheme.primary,
          controller: controller,
        ),
        _KpiCard(
          title: 'Agendadas hoje',
          value: scheduledToday,
          icon: Icons.schedule,
          color: t.colorScheme.tertiary,
          controller: controller,
        ),
        _KpiCard(
          title: 'Concluidas hoje',
          value: completedToday,
          icon: Icons.check_circle,
          color: t.colorScheme.secondary,
          controller: controller,
        ),
        _KpiCard(
          title: 'Atrasadas',
          value: lateCount,
          icon: Icons.warning_amber_rounded,
          color: t.colorScheme.error,
          controller: controller,
        ),
      ],
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
  const _TripsPanel({
    required this.trips,
    required this.onAction,
  });

  final List<Trip> trips;
  final ValueChanged<Trip> onAction;

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
              child: Center(
                child: Text(
                  'Nada por aqui no momento.',
                  style: t.textTheme.bodyMedium?.copyWith(
    color: t.colorScheme.onSurface.withValues(alpha: 0.7),
                  ),
                ),
              ),
            )
          else
            ...trips
                .take(50)
                .map((tItem) => _TripRow(trip: tItem, onAction: onAction)),
        ],
      ),
    );
  }
}

class _TripRow extends StatelessWidget {
  const _TripRow({required this.trip, required this.onAction});
  final Trip trip;
  final ValueChanged<Trip> onAction;

  Color _statusColor(ThemeData t) {
    switch (trip.status.toLowerCase()) {
      case 'inprogress':
        return t.colorScheme.secondary;
      case 'scheduled':
        return t.colorScheme.tertiary;
      case 'completed':
        return t.colorScheme.primary;
      case 'cancelled':
        return t.colorScheme.error;
      default:
        return t.colorScheme.outline;
    }
  }

  String _statusLabel() {
    switch (trip.status.toLowerCase()) {
      case 'inprogress':
        return 'Em andamento';
      case 'scheduled':
        return 'Agendada';
      case 'completed':
        return 'Concluida';
      case 'cancelled':
        return 'Cancelada';
      default:
        return trip.status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    final color = _statusColor(t);
    return InkWell(
      onTap: () => onAction(trip),
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        child: Row(
          children: [
            // Status dot
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
            const SizedBox(width: 10),
            // Info principal
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Trip #${trip.id.substring(0, 8)}',
                      style: t.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(
                    (trip.notes?.isNotEmpty ?? false)
                        ? trip.notes!
                        : 'Rota: ${trip.routeId} -  Veiculo: ${trip.vehicleId ?? '-'}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: t.textTheme.bodySmall?.copyWith(
    color: t.colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            // Horario
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (trip.scheduledStartTime != null)
                  Text(
                    _fmtTime(trip.scheduledStartTime!),
                    style: t.textTheme.labelMedium?.copyWith(
    color: t.colorScheme.onSurface.withValues(alpha: 0.7),
                    ),
                  ),
                const SizedBox(height: 4),
                _Chip(text: _statusLabel(), color: color),
              ],
            ),
            const SizedBox(width: 6),
            Icon(Icons.more_horiz, color: t.colorScheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }

  String _fmtTime(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')} ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
}

class _RecentPanel extends StatelessWidget {
  const _RecentPanel({required this.trips});
  final List<Trip> trips;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    final recent = [...trips]
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    return Container(
      decoration: BoxDecoration(
        color: t.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(14),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          const _PanelHeader(title: 'Atividade recente'),
          const Divider(height: 16),
          ...recent.take(6).map((e) => _RecentRow(trip: e)),
          if (recent.isEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                'Sem atualizacoes recentes.',
                style: t.textTheme.bodySmall?.copyWith(
    color: t.colorScheme.onSurface.withValues(alpha: 0.7),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _RecentRow extends StatelessWidget {
  const _RecentRow({required this.trip});
  final Trip trip;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
      child: Row(
        children: [
          Icon(Icons.bolt, size: 18, color: t.colorScheme.primary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Trip ${trip.id.substring(0, 6)} ${_verb(trip.status)} -  ${_ago(trip.updatedAt)}',
              style: t.textTheme.bodySmall,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  String _verb(String s) {
    switch (s.toLowerCase()) {
      case 'inprogress':
        return 'iniciada';
      case 'completed':
        return 'concluida';
      case 'cancelled':
        return 'cancelada';
      case 'scheduled':
        return 'agendada';
      default:
        return s.toLowerCase();
    }
  }

  String _ago(DateTime d) {
    final diff = DateTime.now().difference(d);
    if (diff.inMinutes < 1) return 'agora';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min';
    if (diff.inHours < 24) return '${diff.inHours} h';
    return '${diff.inDays} d';
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
                icon: Icons.support_agent,
                label: 'Incidentes',
                onTap: () => _soon(context, 'Incidentes'),
              ),
              _ActionButton(
                icon: Icons.message,
                label: 'Mensagens',
                onTap: () => _soon(context, 'Mensagens'),
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

class _Chip extends StatelessWidget {
  const _Chip({required this.text, required this.color});
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
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _TripActionsSheet extends StatelessWidget {
  const _TripActionsSheet({required this.trip});
  final Trip trip;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    final status = trip.status.toLowerCase();
    final canStart = status == 'scheduled';
    final canComplete = status == 'inprogress';
    final canCancel = status == 'scheduled' || status == 'inprogress';

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              height: 4,
              width: 40,
              decoration: BoxDecoration(
                color: t.colorScheme.outlineVariant,
                borderRadius: BorderRadius.circular(6),
              ),
            ),
            const SizedBox(height: 12),
            Text('Trip #${trip.id.substring(0, 8)}',
                style: t.textTheme.titleMedium),
            const SizedBox(height: 8),
            if (canStart)
              ListTile(
                leading:
                    Icon(Icons.play_circle, color: t.colorScheme.secondary),
                title: const Text('Iniciar viagem'),
                onTap: () => Navigator.pop(context, 'start'),
              ),
            if (canComplete)
              ListTile(
                leading: Icon(Icons.flag_circle, color: t.colorScheme.primary),
                title: const Text('Concluir viagem'),
                onTap: () => Navigator.pop(context, 'complete'),
              ),
            if (canCancel)
              ListTile(
                leading: Icon(Icons.cancel, color: t.colorScheme.error),
                title: const Text('Cancelar viagem'),
                onTap: () => Navigator.pop(context, 'cancel'),
              ),
            ListTile(
              leading: Icon(Icons.info_outline,
                  color: t.colorScheme.onSurfaceVariant),
              title: const Text('Detalhes'),
              subtitle: Text(trip.notes ?? 'Sem observacoes'),
              onTap: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}

