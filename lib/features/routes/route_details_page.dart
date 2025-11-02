// ========================================
// GolfFox Route Details Page v11.0
// Pagina de detalhes da rota
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/gf_tokens.dart';
import '../../core/utils/date_utils.dart';
import '../../ui/widgets/gf_app_bar.dart';
import '../../ui/widgets/routes/route_progress_indicator.dart';
import '../../ui/widgets/routes/route_stop_timeline.dart';
import '../../services/route_service.dart';
import '../../models/route.dart';
import 'create_route_page.dart';

class RouteDetailsPage extends ConsumerStatefulWidget {
  final BusRoute route;

  const RouteDetailsPage({
    super.key,
    required this.route,
  });

  @override
  ConsumerState<RouteDetailsPage> createState() => _RouteDetailsPageState();
}

class _RouteDetailsPageState extends ConsumerState<RouteDetailsPage>
    with TickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final routeAsync = ref.watch(routeByIdProvider(widget.route.id));

    return Scaffold(
      appBar: GfAppBar(
        title: widget.route.name,
        automaticallyImplyLeading: true,
        actions: [
          if (widget.route.status == RouteStatus.planned)
            IconButton(
              onPressed: () => _editRoute(),
              icon: const Icon(Icons.edit),
              tooltip: 'Editar Rota',
            ),
          PopupMenuButton<String>(
            onSelected: _handleMenuAction,
            itemBuilder: (context) => [
              if (widget.route.status == RouteStatus.planned)
                const PopupMenuItem(
                  value: 'start',
                  child: ListTile(
                    leading:
                        Icon(Icons.play_arrow, color: Color(GfTokens.success)),
                    title: Text('Iniciar Rota'),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              if (widget.route.isActive)
                const PopupMenuItem(
                  value: 'cancel',
                  child: ListTile(
                    leading:
                        Icon(Icons.stop, color: Color(GfTokens.colorError)),
                    title: Text('Cancelar Rota'),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              const PopupMenuItem(
                value: 'duplicate',
                child: ListTile(
                  leading: Icon(Icons.copy),
                  title: Text('Duplicar Rota'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              if (widget.route.status == RouteStatus.planned)
                const PopupMenuItem(
                  value: 'delete',
                  child: ListTile(
                    leading:
                        Icon(Icons.delete, color: Color(GfTokens.colorError)),
                    title: Text('Excluir Rota'),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
            ],
          ),
        ],
      ),
      body: routeAsync.when(
        data: (route) => _buildContent(route ?? widget.route),
        loading: () => _buildLoadingState(),
        error: (error, stack) => _buildErrorState(error),
      ),
    );
  }

  Widget _buildContent(BusRoute route) {
    return Column(
      children: [
        // Cabecalho com status e informacoes principais
        _buildHeader(route),

        // Tabs
        TabBar(
          controller: _tabController,
          labelColor: const Color(GfTokens.primary),
          unselectedLabelColor: const Color(GfTokens.colorOnSurfaceVariant),
          indicatorColor: const Color(GfTokens.primary),
          tabs: const [
            Tab(text: 'Visao Geral'),
            Tab(text: 'Paradas'),
            Tab(text: 'Historico'),
          ],
        ),

        // Conteudo das tabs
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildOverviewTab(route),
              _buildStopsTab(route),
              _buildHistoryTab(route),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHeader(BusRoute route) {
    return Container(
      padding: const EdgeInsets.all(GfTokens.space4),
      decoration: const BoxDecoration(
        color: Color(GfTokens.surface),
        border: Border(
          bottom: BorderSide(color: Color(GfTokens.stroke)),
        ),
      ),
      child: Column(
        children: [
          // Status e progresso
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: GfTokens.space3,
                  vertical: GfTokens.space2,
                ),
                decoration: BoxDecoration(
                  color: Color(route.status.colorValue).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
                  border: Border.all(
                    color:
                        Color(route.status.colorValue).withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: Color(route.status.colorValue),
                        shape: BoxShape.circle,
                      ),
                    )
                        .animate(
                          onPlay: (controller) => controller.repeat(),
                        )
                        .scale(
                          begin: const Offset(1.0, 1.0),
                          end: const Offset(1.2, 1.2),
                          duration: const Duration(seconds: 1),
                        )
                        .then()
                        .scale(
                          begin: const Offset(1.2, 1.2),
                          end: const Offset(1.0, 1.0),
                          duration: const Duration(seconds: 1),
                        ),
                    const SizedBox(width: 8),
                    Text(
                      route.status.displayName,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Color(route.status.colorValue),
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              if (route.isActive)
                Text(
                  '${route.progressPercentage.toInt()}% concluido',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Color(GfTokens.primary),
                  ),
                ),
            ],
          ),

          if (route.isActive) ...[
            const SizedBox(height: GfTokens.space3),
            RouteProgressIndicator(route: route),
          ],

          const SizedBox(height: GfTokens.space4),

          // Metricas principais
          Row(
            children: [
              Expanded(
                child: _buildMetricCard(
                  icon: Icons.location_on,
                  label: 'Paradas',
                  value: '${route.stops.length}',
                  color: const Color(GfTokens.primary),
                ),
              ),
              const SizedBox(width: GfTokens.space3),
              Expanded(
                child: _buildMetricCard(
                  icon: Icons.access_time,
                  label: 'Duracao',
                  value: '${route.estimatedDuration}min',
                  color: const Color(GfTokens.warning),
                ),
              ),
              const SizedBox(width: GfTokens.space3),
              Expanded(
                child: _buildMetricCard(
                  icon: Icons.straighten,
                  label: 'Distancia',
                  value: '${route.totalDistance.toStringAsFixed(1)}km',
                  color: const Color(GfTokens.info),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(GfTokens.space3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(GfTokens.radiusMd),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: Color(GfTokens.colorOnSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewTab(BusRoute route) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(GfTokens.space4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Informacoes basicas
          _buildInfoCard(
            title: 'Informacoes da Rota',
            children: [
              _buildInfoRow('Nome', route.name),
              if (route.description != null)
                _buildInfoRow('Descricao', route.description!),
              _buildInfoRow('Status', route.status.displayName),
              _buildInfoRow('Criada em', GfDateUtils.formatDateTime(route.createdAt)),
              if (route.updatedAt != route.createdAt)
                _buildInfoRow('Atualizada em', GfDateUtils.formatDateTime(route.updatedAt)),
            ],
          ),

          const SizedBox(height: GfTokens.space4),

          // Atribuicoes
          _buildInfoCard(
            title: 'Atribuicoes',
            children: [
              if (route.vehicleId != null)
                _buildInfoRow('Veiculo', 'Veiculo ${route.vehicleId}'),
              if (route.driverId != null)
                _buildInfoRow('Motorista', route.driverId!),
              if (route.scheduledStartTime != null)
                _buildInfoRow(
                  'Horario Programado',
                  formatDateTime(route.scheduledStartTime!),
                ),
              if (route.actualStartTime != null)
                _buildInfoRow(
                  'Horario Real de Inicio',
                  formatDateTime(route.actualStartTime!),
                ),
              if (route.actualEndTime != null)
                _buildInfoRow(
                  'Horario de Conclusao',
                  formatDateTime(route.actualEndTime!),
                ),
            ],
          ),

          const SizedBox(height: GfTokens.space4),

          // Estatisticas
          _buildInfoCard(
            title: 'Estatisticas',
            children: [
              _buildInfoRow('Total de Paradas', '${route.stops.length}'),
              _buildInfoRow(
                'Paradas Concluidas',
                '${route.stops.where((s) => s.actualArrivalTime != null).length}',
              ),
          _buildInfoRow(
            'Distancia Total',
            '${(route.actualDistance ?? route.estimatedDistance ?? 0).toStringAsFixed(2)} km',
          ),
              _buildInfoRow(
                  'Duracao Estimada', '${route.estimatedDuration} minutos'),
          if (route.isActive)
                _buildInfoRow('Progresso', '${route.progressPercentage.toInt()}%'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStopsTab(BusRoute route) {
    return RouteStopTimeline(stops: route.stops, isActive: route.isActive);
  }

  Widget _buildHistoryTab(BusRoute route) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(GfTokens.space4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Historico da Rota',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(GfTokens.colorOnSurface),
            ),
          ),
          const SizedBox(height: GfTokens.space4),

          // Lista de eventos do historico
          _buildHistoryItem(
            icon: Icons.add_circle,
            title: 'Rota Criada',
            subtitle: 'Rota criada no sistema',
            time: route.createdAt,
            color: const Color(GfTokens.success),
          ),

          if (route.updatedAt != route.createdAt)
            _buildHistoryItem(
              icon: Icons.edit,
              title: 'Rota Atualizada',
              subtitle: 'Informacoes da rota foram modificadas',
              time: route.updatedAt,
              color: const Color(GfTokens.info),
            ),

          if (route.startTime != null)
            _buildHistoryItem(
              icon: Icons.play_arrow,
              title: 'Rota Iniciada',
              subtitle: 'Execucao da rota foi iniciada',
              time: route.startTime!,
              color: const Color(GfTokens.primary),
            ),

          if (route.endTime != null)
            _buildHistoryItem(
              icon: Icons.check_circle,
              title: 'Rota Concluida',
              subtitle: 'Todas as paradas foram visitadas',
              time: route.endTime!,
              color: const Color(GfTokens.success),
            ),

          // Historico das paradas
          ...route.stops
              .where((stop) => stop.actualTime != null)
              .map((stop) => _buildHistoryItem(
                    icon: Icons.location_on,
                    title: 'Parada Visitada',
                    subtitle: stop.name,
                    time: stop.actualTime!,
                    color: const Color(GfTokens.primary),
                  )),
        ],
      ),
    );
  }

  Widget _buildInfoCard({
    required String title,
    required List<Widget> children,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(GfTokens.space4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(GfTokens.textTitle),
              ),
            ),
            const SizedBox(height: GfTokens.space3),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: GfTokens.space2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                color: Color(GfTokens.textMuted),
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                color: Color(GfTokens.textBody),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHistoryItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required DateTime time,
    required Color color,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: GfTokens.space3),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
              border: Border.all(color: color.withValues(alpha: 0.3)),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: GfTokens.space3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Color(GfTokens.textTitle),
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(GfTokens.textMuted),
                  ),
                ),
              ],
            ),
          ),
          Text(
            timeAgo(time),
            style: const TextStyle(
              fontSize: 12,
              color: Color(GfTokens.textMuted),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: CircularProgressIndicator(
        color: Color(GfTokens.primary),
      ),
    );
  }

  Widget _buildErrorState(Object error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            size: 64,
            color: Color(GfTokens.error),
          ),
          const SizedBox(height: GfTokens.space4),
          Text(
            'Erro ao carregar detalhes da rota',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(GfTokens.textTitle),
            ),
          ),
          const SizedBox(height: GfTokens.space2),
          Text(
            error.toString(),
            style: const TextStyle(
              fontSize: 14,
              color: Color(GfTokens.textMuted),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  void _handleMenuAction(String action) {
    switch (action) {
      case 'start':
        _startRoute();
        break;
      case 'cancel':
        _cancelRoute();
        break;
      case 'duplicate':
        _duplicateRoute();
        break;
      case 'delete':
        _deleteRoute();
        break;
    }
  }

  void _editRoute() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => CreateRoutePage(
          route: widget.route,
          isAutoGenerated: false,
        ),
      ),
    );
  }

  void _startRoute() async {
    setState(() => _isLoading = true);

    try {
      await ref.read(routeServiceProvider).startRoute(widget.route.id);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Rota iniciada com sucesso'),
            backgroundColor: Color(GfTokens.success),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao iniciar rota: $e'),
            backgroundColor: const Color(GfTokens.error),
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _cancelRoute() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancelar Rota'),
        content: const Text('Tem certeza que deseja cancelar esta rota?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Nao'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();

              try {
                await ref.read(routeServiceProvider).cancelRoute(
                      widget.route.id,
                      'Cancelada pelo usuario',
                    );

                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Rota cancelada'),
                      backgroundColor: Color(GfTokens.warning),
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Erro ao cancelar rota: $e'),
                      backgroundColor: const Color(GfTokens.error),
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(GfTokens.error),
              foregroundColor: Colors.white,
            ),
            child: const Text('Sim, Cancelar'),
          ),
        ],
      ),
    );
  }

  void _duplicateRoute() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => CreateRoutePage(
          route: widget.route.copyWith(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            name: '${widget.route.name} (Copia)',
            status: RouteStatus.planned,
            actualStartTime: null,
            actualEndTime: null,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
          isAutoGenerated: false,
        ),
      ),
    );
  }

  void _deleteRoute() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Excluir Rota'),
        content: const Text(
          'Tem certeza que deseja excluir esta rota? Esta acao nao pode ser desfeita.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();

              try {
                await ref
                    .read(routeServiceProvider)
                    .deleteRoute(widget.route.id);

                if (mounted) {
                  Navigator.of(context).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Rota excluida com sucesso'),
                      backgroundColor: Color(GfTokens.success),
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Erro ao excluir rota: $e'),
                      backgroundColor: const Color(GfTokens.error),
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(GfTokens.error),
              foregroundColor: Colors.white,
            ),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
  }
}
