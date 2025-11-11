// ========================================
// GolfFox Dashboard v11.0 - Clear Theme
// Página principal do painel administrativo
// ========================================

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/routing/app_router.dart';
import '../../core/routing/app_routes.dart';
import '../../core/services/logger_service.dart';
import '../../core/theme/gf_tokens.dart';
import '../../data/golf_fox_repo.dart';
import '../../ui/widgets/alert_banner.dart';
import '../../ui/widgets/kpi_card.dart';
import '../../ui/widgets/quick_action.dart';
import '../../ui/widgets/side_nav.dart';
import '../../ui/widgets/top_bar.dart';

// ========================================
// PROVIDERS
// ========================================
final dashboardMetricsProvider = FutureProvider<Map<String, int>>((ref) async {
  final repo = ref.read(golfFoxRepoProvider);
  final result = await repo.loadDashboardMetrics();
  if (result.isOk) {
    return result.ok!;
  } else {
    throw result.err!;
  }
});

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final metricsAsync = ref.watch(dashboardMetricsProvider);

    return Scaffold(
      backgroundColor: const Color(GfTokens.page),
      appBar: const GfTopBar(),
      body: Row(
        children: [
          const GfSideNav(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(GfTokens.space6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ========================================
                  // CABECALHO
                  // ========================================
                  _buildHeader(),

                  const SizedBox(height: GfTokens.space8),

                  // ========================================
                  // KPIs
                  // ========================================
                  _buildKpiSection(metricsAsync),

                  const SizedBox(height: GfTokens.space8),

                  // ========================================
                  // GRÁFICO DE OCUPAÇÃO
                  // ========================================
                  _buildOccupancyChart(),

                  const SizedBox(height: GfTokens.space8),

                  // ========================================
                  // A├ç├òES RAPIDAS
                  // ========================================
                  _buildQuickActions(),

                  const SizedBox(height: GfTokens.space8),

                  // ========================================
                  // BANNER DE ALERTA
                  // ========================================
                  _buildAlertBanner(metricsAsync),

                  const SizedBox(height: GfTokens.space8),

                  // ========================================
                  // INSIGHTS DA IA
                  // ========================================
                  _buildAiInsights(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Dashboard',
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w700,
            color: Color(GfTokens.colorOnSurface),
          ),
        ).animate().fadeIn(duration: 300.ms).slideX(begin: -0.1, end: 0),
        const SizedBox(height: GfTokens.space2),
        const Text(
          'Visão geral das operações em tempo real',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w400,
            color: Color(GfTokens.colorOnSurfaceVariant),
          ),
        )
            .animate()
            .fadeIn(duration: 300.ms, delay: 100.ms)
            .slideX(begin: -0.1, end: 0),
      ],
    );

  Widget _buildKpiSection(AsyncValue<Map<String, int>> metricsAsync) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Métricas principais',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Color(GfTokens.textTitle),
          ),
        ),
        const SizedBox(height: GfTokens.space4),
        metricsAsync.when(
          data: _buildKpiGrid,
          loading: _buildKpiGridLoading,
          error: _buildKpiGridError,
        ),
      ],
    );

  Widget _buildKpiGrid(Map<String, int> metrics) => LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth > 800;
        final crossAxisCount = isWide ? 4 : 2;
        final childAspectRatio = isWide ? 1.2 : 1.0;

        return GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: crossAxisCount,
          crossAxisSpacing: GfTokens.space4,
          mainAxisSpacing: GfTokens.space4,
          childAspectRatio: childAspectRatio,
          children: [
            GfKpiCardVariants.inTransit(
              value: '${metrics['inTransit'] ?? 0}',
              onTap: () => _navigateToTrips(context),
            ),
            GfKpiCardVariants.activeVehicles(
              value: '${metrics['activeVehicles'] ?? 0}',
              onTap: () => _navigateToVehicles(context),
            ),
            GfKpiCardVariants.routesToday(
              value: '${metrics['routesToday'] ?? 0}',
              onTap: () => _navigateToRoutes(context),
            ),
            GfKpiCardVariants.criticalAlerts(
              value: '${metrics['criticalAlerts'] ?? 0}',
              onTap: () => _navigateToAlerts(context),
            ),
          ],
        );
      },
    );

  Widget _buildKpiGridLoading() => LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth > 800;
        final crossAxisCount = isWide ? 4 : 2;

        return GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: crossAxisCount,
          crossAxisSpacing: GfTokens.space4,
          mainAxisSpacing: GfTokens.space4,
          childAspectRatio: 1.2,
          children: List.generate(
            4,
            (index) => const GfKpiCard(
              title: '',
              value: '',
              icon: Icons.circle,
              iconColor: Colors.grey,
              isLoading: true,
            ),
          ),
        );
      },
    );

  Widget _buildKpiGridError(Object _, StackTrace __) => Container(
      padding: const EdgeInsets.all(GfTokens.space6),
      decoration: BoxDecoration(
        color: const Color(GfTokens.surface),
        borderRadius: BorderRadius.circular(GfTokens.radius),
        border: Border.all(color: const Color(GfTokens.stroke)),
      ),
      child: const Column(
        children: [
          Icon(
            Icons.error_outline,
            color: Color(GfTokens.danger),
            size: 48,
          ),
          SizedBox(height: GfTokens.space3),
          Text(
            'Erro ao carregar métricas',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(GfTokens.textTitle),
            ),
          ),
          SizedBox(height: GfTokens.space2),
          Text(
            'Verifique sua conexão e tente novamente',
            style: TextStyle(
              fontSize: 14,
              color: Color(GfTokens.textMuted),
            ),
          ),
        ],
      ),
    );

  Widget _buildOccupancyChart() => Container(
      padding: const EdgeInsets.all(GfTokens.space6),
      decoration: BoxDecoration(
        color: const Color(GfTokens.surface),
        borderRadius: BorderRadius.circular(GfTokens.radius),
        border: Border.all(color: const Color(GfTokens.stroke)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Ocupação por horário',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Color(GfTokens.textTitle),
            ),
          ),
          const SizedBox(height: GfTokens.space2),
          const Text(
            'Distribuição de passageiros ao longo do dia',
            style: TextStyle(
              fontSize: 14,
              color: Color(GfTokens.textMuted),
            ),
          ),
          const SizedBox(height: GfTokens.space6),
          SizedBox(
            height: 200,
            child: RepaintBoundary(
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(
                    drawVerticalLine: false,
                    horizontalInterval: 20,
                    getDrawingHorizontalLine: (value) => const FlLine(
                      color: Color(GfTokens.stroke),
                      strokeWidth: 1,
                    ),
                  ),
                  titlesData: FlTitlesData(
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        reservedSize: 40,
                        getTitlesWidget: (value, meta) => Text(
                          '${value.toInt()}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(GfTokens.textMuted),
                          ),
                        ),
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        reservedSize: 30,
                        getTitlesWidget: (value, meta) {
                          final hours = [
                            '6h',
                            '9h',
                            '12h',
                            '15h',
                            '18h',
                            '21h'
                          ];
                          final index = value.toInt();
                          if (index >= 0 && index < hours.length) {
                            return Text(
                              hours[index],
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(GfTokens.textMuted),
                              ),
                            );
                          }
                          return const Text('');
                        },
                      ),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  lineBarsData: [
                    LineChartBarData(
                      spots: const [
                        FlSpot(0, 30),
                        FlSpot(1, 85),
                        FlSpot(2, 45),
                        FlSpot(3, 60),
                        FlSpot(4, 90),
                        FlSpot(5, 25),
                      ],
                      isCurved: true,
                      color: const Color(GfTokens.brand),
                      barWidth: 3,
                      dotData: FlDotData(
                        getDotPainter: (spot, percent, barData, index) =>
                            FlDotCirclePainter(
                          radius: 4,
                          color: const Color(GfTokens.brand),
                          strokeWidth: 2,
                          strokeColor: const Color(GfTokens.surface),
                        ),
                      ),
                      belowBarData: BarAreaData(
                        color: const Color(GfTokens.brand).withValues(alpha: 0.1),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(duration: 300.ms, delay: 200.ms)
        .slideY(begin: 0.1, end: 0);

  Widget _buildQuickActions() => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Ações Rápidas',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Color(GfTokens.textTitle),
          ),
        ),
        const SizedBox(height: GfTokens.space4),
        LayoutBuilder(
          builder: (context, constraints) {
            final isWide = constraints.maxWidth > 800;
            final crossAxisCount = isWide ? 4 : 2;

            return GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: crossAxisCount,
              crossAxisSpacing: GfTokens.space4,
              mainAxisSpacing: GfTokens.space4,
              children: [
                GfQuickActionVariants.trackVehicles(
                  onTap: _navigateToMap,
                ),
                GfQuickActionVariants.viewAnalytics(
                  onTap: _navigateToReports,
                ),
                GfQuickActionVariants.settings(
                  onTap: _openSettings,
                ),
                GfQuickActionVariants.reopenTrip(
                  onTap: _showReopenTripDialog,
                ),
              ],
            );
          },
        ),
      ],
    );

  Widget _buildAlertBanner(AsyncValue<Map<String, int>> metricsAsync) => metricsAsync.when(
      data: (metrics) {
        final criticalAlerts = metrics['criticalAlerts'] ?? 0;
        if (criticalAlerts > 0) {
          return GfAlertBannerVariants.criticalAlerts(
            count: criticalAlerts,
            onViewAlerts: _navigateToAlerts,
          );
        }
        return const SizedBox.shrink();
      },
      loading: () => const SizedBox.shrink(),
      error: (error, stack) => const SizedBox.shrink(),
    );

  Widget _buildAiInsights() => Container(
      padding: const EdgeInsets.all(GfTokens.space6),
      decoration: BoxDecoration(
        color: const Color(GfTokens.surface),
        borderRadius: BorderRadius.circular(GfTokens.radius),
        border: Border.all(color: const Color(GfTokens.stroke)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(GfTokens.space2),
                decoration: BoxDecoration(
                  color: const Color(GfTokens.brand).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
                ),
                child: const Icon(
                  Icons.psychology,
                  color: Color(GfTokens.brand),
                  size: 20,
                ),
              ),
              const SizedBox(width: GfTokens.space3),
              const Text(
                'Insights da IA',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: Color(GfTokens.textTitle),
                ),
              ),
            ],
          ),
          const SizedBox(height: GfTokens.space4),
          const Text(
            '- Pico de demanda identificado entre 17h-19h com 85% de ocupação\n'
            '- Rota Centro-Zona Sul apresenta maior eficiência operacional\n'
            '- Sugestão: adicionar 2 veículos no horário de pico para otimizar fluxo\n'
            '- Economia potencial de 15% no combustível com ajuste de rotas',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w400,
              color: Color(GfTokens.textBody),
              height: 1.5,
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(duration: 300.ms, delay: 400.ms)
        .slideY(begin: 0.1, end: 0);

  // ========================================
  // METODOS DE NAVEGACAO
  // ========================================
  static void _navigateToTrips(BuildContext context) {
    try {
      AppRouter.instance.go(AppRoutes.operatorTrips);
    } catch (e) {
      LoggerService.instance.error('Erro ao navegar para viagens: $e');
    }
  }

  static void _navigateToVehicles(BuildContext context) {
    try {
      AppRouter.instance.go(AppRoutes.operatorVehicles);
    } catch (e) {
      LoggerService.instance.error('Erro ao navegar para veículos: $e');
    }
  }

  static void _navigateToRoutes(BuildContext context) {
    try {
      // Assumindo que há uma rota de rotas - ajustar conforme necessário
      AppRouter.instance.go('/admin/rotas');
    } catch (e) {
      LoggerService.instance.error('Erro ao navegar para rotas: $e');
    }
  }

  static void _navigateToAlerts(BuildContext context) {
    try {
      AppRouter.instance.go('/admin/alertas');
    } catch (e) {
      LoggerService.instance.error('Erro ao navegar para alertas: $e');
    }
  }

  static void _navigateToMap(BuildContext context) {
    try {
      AppRouter.instance.go(AppRoutes.map);
    } catch (e) {
      LoggerService.instance.error('Erro ao navegar para mapa: $e');
    }
  }

  static void _navigateToReports(BuildContext context) {
    try {
      AppRouter.instance.go(AppRoutes.operatorReports);
    } catch (e) {
      LoggerService.instance.error('Erro ao navegar para relatórios: $e');
    }
  }

  static void _openSettings(BuildContext context) {
    try {
      AppRouter.instance.go(AppRoutes.settings);
    } catch (e) {
      LoggerService.instance.error('Erro ao abrir configurações: $e');
    }
  }

  static void _showReopenTripDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reabrir Viagem'),
        content: const Text(
          'Funcionalidade de reabertura de viagem será implementada em breve.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Fechar'),
          ),
        ],
      ),
    );
  }
}
