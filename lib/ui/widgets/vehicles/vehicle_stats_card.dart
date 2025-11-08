// ========================================
// GolfFox Vehicle Stats Card Widget v11.0
// Widget para exibir estatisticas de veiculos
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/gf_tokens.dart';
import '../../../services/vehicle_service.dart';

class VehicleStatsCard extends ConsumerWidget {
  const VehicleStatsCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) => Container(
      margin: const EdgeInsets.all(GfTokens.spacingMd),
      child: FutureBuilder<Map<String, dynamic>>(
        future: ref.read(vehicleServiceProvider).getVehicleStats(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return _buildLoadingCard();
          }

          if (snapshot.hasError) {
            return _buildErrorCard();
          }

          final stats = snapshot.data ?? {};
          return _buildStatsCard(stats);
        },
      ),
    );

  Widget _buildLoadingCard() => Container(
      padding: const EdgeInsets.all(GfTokens.spacingMd),
      decoration: BoxDecoration(
        color: const Color(GfTokens.colorSurface),
        borderRadius: BorderRadius.circular(GfTokens.radiusLg),
        border: Border.all(color: const Color(GfTokens.colorBorder)),
      ),
      child: const Row(
        children: [
          CircularProgressIndicator(
            strokeWidth: 2,
            valueColor: AlwaysStoppedAnimation<Color>(
                Color(GfTokens.colorPrimary)),
          ),
          SizedBox(width: GfTokens.spacingMd),
          Text(
            'Carregando estatisticas...',
            style: TextStyle(
              fontSize: GfTokens.fontSizeMd,
              color: Color(GfTokens.colorOnSurfaceVariant),
            ),
          ),
        ],
      ),
    );

  Widget _buildErrorCard() => Container(
      padding: const EdgeInsets.all(GfTokens.spacingMd),
      decoration: BoxDecoration(
        color: const Color(GfTokens.colorErrorContainer),
        borderRadius: BorderRadius.circular(GfTokens.radiusLg),
        border: Border.all(
            color: const Color(GfTokens.colorError).withValues(alpha: 0.3)),
      ),
      child: const Row(
        children: [
          Icon(
            Icons.error_outline,
            color: Color(GfTokens.colorError),
            size: 20,
          ),
          SizedBox(width: GfTokens.spacingMd),
          Text(
            'Erro ao carregar estatisticas',
            style: TextStyle(
              fontSize: GfTokens.fontSizeMd,
              color: Color(GfTokens.colorOnErrorContainer),
            ),
          ),
        ],
      ),
    );

  Widget _buildStatsCard(Map<String, dynamic> stats) => Container(
      padding: const EdgeInsets.all(GfTokens.spacingMd),
      decoration: BoxDecoration(
        color: const Color(GfTokens.colorSurface),
        borderRadius: BorderRadius.circular(GfTokens.radiusLg),
        border: Border.all(color: const Color(GfTokens.colorBorder)),
        boxShadow: [
          BoxShadow(
            color: const Color(GfTokens.colorShadow).withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cabecalho
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(GfTokens.spacingSm),
                decoration: BoxDecoration(
                  color: const Color(GfTokens.colorPrimary).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(GfTokens.radiusMd),
                ),
                child: const Icon(
                  Icons.analytics,
                  color: Color(GfTokens.colorPrimary),
                  size: 20,
                ),
              ),
              const SizedBox(width: GfTokens.spacingMd),
              const Text(
                'Estatisticas da Frota',
                style: TextStyle(
                  fontSize: GfTokens.fontSizeLg,
                  fontWeight: FontWeight.w600,
                  color: Color(GfTokens.colorOnSurface),
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: GfTokens.spacingSm,
                  vertical: GfTokens.spacingXs,
                ),
                decoration: BoxDecoration(
                  color: const Color(GfTokens.colorSuccess).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(GfTokens.radiusSm),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.trending_up,
                      size: 14,
                      color: Color(GfTokens.colorSuccess),
                    ),
                    const SizedBox(width: GfTokens.spacingXs),
                    Text(
                      '${stats['utilizationRate'] ?? 0}%',
                      style: const TextStyle(
                        fontSize: GfTokens.fontSizeXs,
                        fontWeight: FontWeight.w600,
                        color: Color(GfTokens.colorSuccess),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: GfTokens.spacingMd),

          // Estatisticas principais
          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  icon: Icons.directions_bus,
                  label: 'Total',
                  value: stats['total']?.toString() ?? '0',
                  color: const Color(GfTokens.colorPrimary),
                ),
              ),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.check_circle,
                  label: 'Ativos',
                  value: stats['active']?.toString() ?? '0',
                  color: const Color(GfTokens.colorSuccess),
                ),
              ),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.schedule,
                  label: 'Disponiveis',
                  value: stats['available']?.toString() ?? '0',
                  color: const Color(GfTokens.colorInfo),
                ),
              ),
              Expanded(
                child: _buildStatItem(
                  icon: Icons.play_arrow,
                  label: 'Em Uso',
                  value: stats['inUse']?.toString() ?? '0',
                  color: const Color(GfTokens.colorSecondary),
                ),
              ),
            ],
          ),

          const SizedBox(height: GfTokens.spacingMd),

          // Alertas
          Row(
            children: [
              Expanded(
                child: _buildAlertItem(
                  icon: Icons.build,
                  label: 'Manutencao',
                  value: stats['maintenance']?.toString() ?? '0',
                  color: const Color(GfTokens.colorError),
                ),
              ),
              Expanded(
                child: _buildAlertItem(
                  icon: Icons.local_gas_station,
                  label: 'Combustivel Baixo',
                  value: stats['lowFuel']?.toString() ?? '0',
                  color: const Color(GfTokens.colorWarning),
                ),
              ),
              Expanded(
                child: _buildAlertItem(
                  icon: Icons.description,
                  label: 'Docs. Vencendo',
                  value: stats['expiringDocuments']?.toString() ?? '0',
                  color: const Color(GfTokens.colorWarning),
                ),
              ),
            ],
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(duration: const Duration(milliseconds: 300))
        .slideY(begin: -0.2, end: 0);

  Widget _buildStatItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) => Container(
      padding: const EdgeInsets.all(GfTokens.spacingSm),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(GfTokens.radiusMd),
        border: Border.all(color: color.withValues(alpha: 0.1)),
      ),
      child: Column(
        children: [
          Icon(
            icon,
            color: color,
            size: 24,
          ),
          const SizedBox(height: GfTokens.spacingXs),
          Text(
            value,
            style: TextStyle(
              fontSize: GfTokens.fontSizeXl,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          Text(
            label,
            style: const TextStyle(
              fontSize: GfTokens.fontSizeXs,
              color: Color(GfTokens.colorOnSurfaceVariant),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    )
        .animate()
        .scale(
          begin: const Offset(0.8, 0.8),
          end: const Offset(1, 1),
          duration: const Duration(milliseconds: 300),
          curve: Curves.elasticOut,
        )
        .fadeIn();

  Widget _buildAlertItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    final hasAlert = int.tryParse(value) != null && int.parse(value) > 0;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: GfTokens.spacingSm,
        vertical: GfTokens.spacingXs,
      ),
      decoration: BoxDecoration(
        color: hasAlert
            ? color.withValues(alpha: 0.1)
            : const Color(GfTokens.colorSurfaceVariant),
        borderRadius: BorderRadius.circular(GfTokens.radiusSm),
        border: Border.all(
          color: hasAlert
              ? color.withValues(alpha: 0.3)
              : const Color(GfTokens.colorBorder),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color:
                hasAlert ? color : const Color(GfTokens.colorOnSurfaceVariant),
            size: 16,
          ),
          const SizedBox(width: GfTokens.spacingXs),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: TextStyle(
                    fontSize: GfTokens.fontSizeMd,
                    fontWeight: FontWeight.w600,
                    color: hasAlert
                        ? color
                        : const Color(GfTokens.colorOnSurfaceVariant),
                  ),
                ),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: GfTokens.fontSizeXs,
                    color: hasAlert
                        ? color
                        : const Color(GfTokens.colorOnSurfaceVariant),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    )
        .animate(
          target: hasAlert ? 1 : 0,
        )
        .shimmer(
          duration: const Duration(seconds: 2),
          color: color.withValues(alpha: 0.3),
        );
  }
}
