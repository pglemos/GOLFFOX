// ========================================
// GolfFox Dashboard v11.0 - Clear Theme
// P├ígina principal do painel administrativo
// ========================================

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
                  // GR├üFICO DE OCUPA├ç├âO
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
          'Vis├úo geral das opera├º├Áes em tempo real',
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
          'M├®tricas principais',
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
              onTap: _navigateToTrips,
            ),
            GfKpiCardVariants.activeVehicles(
              value: '${metrics['activeVehicles'] ?? 0}',
              onTap: _navigateToVehicles,
            ),
            GfKpiCardVariants.routesToday(
              value: '${metrics['routesToday'] ?? 0}',
              onTap: _navigateToRoutes,
            ),
            GfKpiCardVariants.criticalAlerts(
              value: '${metrics['criticalAlerts'] ?? 0}',
              onTap: _navigateToAlerts,
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
            'Erro ao carregar m├®tricas',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Color(GfTokens.textTitle),
            ),
          ),
          SizedBox(height: GfTokens.space2),
          Text(
            'Verifique sua conexao e tente novamente',
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
            'Ocupa├º├úo por hor├írio',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Color(GfTokens.textTitle),
            ),
          ),
          const SizedBox(height: GfTokens.space2),
          const Text(
            'Distribuicao de passageiros ao longo do dia',
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
                        color: GfTokens.brand.withValues(alpha: 0.1),
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
          'A├º├Áes R├ípidas',
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
                  color: GfTokens.brand.withValues(alpha: 0.1),
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
            '- Pico de demanda identificado entre 17h-19h com 85% de ocupa├º├úo├º├úo\n'
            '- Rota Centro-Zona Sul apresenta maior efici├¬ncia operacional\n'
            '- Sugest├úo: adicionar 2 ve├¡culos no hor├írio de pico para otimizar fluxo\n'
            '- Economia potencial de 15% no combust├¡vel com ajuste de rotas',
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
  void _navigateToTrips() {
    // TODO(golffox-team): Implementar navega├º├úo para viagens
    LoggerService.instance.debug('Navegando para viagens');
  }

  void _navigateToVehicles() {
    // TODO(golffox-team): Implementar navega├º├úo para ve├¡culos
    LoggerService.instance.debug('Navegando para ve├¡culos');
  }

  void _navigateToRoutes() {
    // TODO(golffox-team): Implementar navega├º├úo para rotas
    LoggerService.instance.debug('Navegando para rotas');
  }

  void _navigateToAlerts() {
    // TODO(golffox-team): Implementar navega├º├úo para alertas
    LoggerService.instance.debug('Navegando para alertas');
  }

  void _navigateToMap() {
    // TODO(golffox-team): Implementar navega├º├úo para mapa
    LoggerService.instance.debug('Navegando para mapa');
  }

  void _navigateToReports() {
    // TODO(golffox-team): Implementar navega├º├úo para relat├│rios
    LoggerService.instance.debug('Navegando para relat├│rios');
  }

  void _openSettings() {
    // TODO(golffox-team): Implementar abertura de configura├º├Áes
    LoggerService.instance.debug('Abrindo configura├º├Áes');
  }

  void _showReopenTripDialog() {
    // TODO(golffox-team): Implementar dialogo de reabertura de viagem
    LoggerService.instance.debug('Mostrando dialogo de reabertura de viagem');
  }
}
