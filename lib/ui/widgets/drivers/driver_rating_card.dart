import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/gf_tokens.dart';
import '../../../models/driver.dart';
import '../../../widgets/gx_card.dart';
import '../../../widgets/gx_empty.dart';

class DriverRatingCard extends StatelessWidget {

  const DriverRatingCard({
    super.key,
    required this.driver,
  });
  final Driver driver;

  @override
  Widget build(BuildContext context) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Resumo das Avaliacoes
        _buildRatingSummary(),

        const SizedBox(height: 24),

        // Distribuicao das Avaliacoes
        _buildRatingDistribution(),

        const SizedBox(height: 24),

        // Lista de Avaliacoes
        _buildRatingsList(),
      ],
    );

  Widget _buildRatingSummary() => GxCard(
      child: Column(
        children: [
          Row(
            children: [
              Icon(
                Icons.star,
                size: 24,
                color: const Color(GfTokens.colorWarning),
              ),
              const SizedBox(width: 8),
              Text(
                'Resumo das Avaliacoes',
                style: GfTextStyles.labelLarge.copyWith(
                  color: const Color(GfTokens.colorPrimary),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              // Avaliacao media grande
              Expanded(
                flex: 2,
                child: Column(
                  children: [
                    Text(
                      driver.stats.averageRating.toStringAsFixed(1),
                      style: GfTextStyles.headlineSmall.copyWith(
                        color: const Color(GfTokens.colorWarning),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        return Icon(
                          index < driver.stats.averageRating.floor()
                              ? Icons.star
                              : index < driver.stats.averageRating
                                  ? Icons.star_half
                                  : Icons.star_border,
                          color: const Color(GfTokens.colorWarning),
                          size: 20,
                        );
                      }),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${driver.stats.totalRatings} avaliacoes',
                      style: GfTextStyles.labelSmall.copyWith(
                        color: const Color(GfTokens.colorOnSurfaceVariant),
                      ),
                    ),
                  ],
                ),
              ),

              // Estatisticas detalhadas
              Expanded(
                flex: 3,
                child: Column(
                  children: [
                    _buildStatRow(
                      'Excelente (5)',
                      _getRatingCount(5),
                      driver.stats.totalRatings,
                      const Color(GfTokens.colorSuccess),
                    ),
                    _buildStatRow(
                      'Muito Bom (4)',
                      _getRatingCount(4),
                      driver.stats.totalRatings,
                      const Color(GfTokens.colorSuccess).withValues(alpha: 0.7),
                    ),
                    _buildStatRow(
                      'Bom (3)',
                      _getRatingCount(3),
                      driver.stats.totalRatings,
                      const Color(GfTokens.colorWarning),
                    ),
                    _buildStatRow(
                      'Regular (2)',
                      _getRatingCount(2),
                      driver.stats.totalRatings,
                      const Color(GfTokens.colorError).withValues(alpha: 0.7),
                    ),
                    _buildStatRow(
                      'Ruim (1)',
                      _getRatingCount(1),
                      driver.stats.totalRatings,
                      const Color(GfTokens.colorError),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: -0.1);

  Widget _buildRatingDistribution() => GxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.bar_chart,
                size: 20,
                color: const Color(GfTokens.colorPrimary),
              ),
              const SizedBox(width: 8),
              Text(
                'Distribuicao das Avaliacoes',
                style: GfTextStyles.labelLarge.copyWith(
                  color: const Color(GfTokens.colorPrimary),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Grafico de barras simples
          for (int i = 5; i >= 1; i--) _buildDistributionBar(i),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms).slideY(begin: -0.1);

  Widget _buildRatingsList() {
    if (driver.ratings.isEmpty) {
      return const GxCard(
        child: GxEmpty(
          icon: Icons.star_outline,
          title: 'Nenhuma Avaliacao',
          message: 'Este motorista ainda nao recebeu avaliacoes.',
        ),
      );
    }

    return GxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.reviews,
                size: 20,
                color: Color(GfTokens.colorPrimary),
              ),
              const SizedBox(width: 8),
              Text(
                'Avaliacoes Recentes',
                style: GfTextStyles.labelLarge.copyWith(
                  color: const Color(GfTokens.colorPrimary),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Lista de avaliacoes (limitada as 10 mais recentes)
          ...driver.ratings
              .take(10)
              .map(_buildRatingItem)
              ,

          if (driver.ratings.length > 10) ...[
            const SizedBox(height: 16),
            Center(
              child: TextButton(
                onPressed: () {
                  // TODO: Implementar visualizacao de todas as avaliacoes
                },
                child: Text(
                  'Ver todas as ${driver.ratings.length} avaliacoes',
                  style: const TextStyle(color: Color(GfTokens.colorPrimary)),
                ),
              ),
            ),
          ],
        ],
      ),
    ).animate().fadeIn(delay: 200.ms).slideY(begin: -0.1);
  }

  Widget _buildStatRow(String label, int count, int total, Color color) {
    final percentage = total > 0 ? (count / total) : 0.0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: GfTextStyles.labelSmall,
            ),
          ),
          Expanded(
            flex: 3,
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    height: 6,
                    decoration: BoxDecoration(
                      color: const Color(GfTokens.colorSurfaceVariant),
                      borderRadius: BorderRadius.circular(3),
                    ),
                    child: FractionallySizedBox(
                      alignment: Alignment.centerLeft,
                      widthFactor: percentage,
                      child: Container(
                        decoration: BoxDecoration(
                          color: color,
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 30,
                  child: Text(
                    count.toString(),
                    style: GfTextStyles.labelSmall.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.end,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDistributionBar(int stars) {
    final count = _getRatingCount(stars);
    final percentage = driver.stats.totalRatings > 0
        ? (count / driver.stats.totalRatings)
        : 0.0;

    Color color;
    switch (stars) {
      case 5:
      case 4:
        color = const Color(GfTokens.colorSuccess);
        break;
      case 3:
        color = const Color(GfTokens.colorWarning);
        break;
      case 2:
      case 1:
        color = const Color(GfTokens.colorError);
        break;
      default:
        color = const Color(GfTokens.colorOnSurfaceVariant);
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          SizedBox(
            width: 20,
            child: Text(
              '$stars',
              style: GfTextStyles.bodyMedium.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 4),
          const Icon(
            Icons.star,
            size: 16,
            color: Color(GfTokens.colorWarning),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              height: 8,
              decoration: BoxDecoration(
                color: const Color(GfTokens.colorSurfaceVariant),
                borderRadius: BorderRadius.circular(4),
              ),
              child: FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: percentage,
                child: Container(
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 40,
            child: Text(
              '${(percentage * 100).toStringAsFixed(0)}%',
              style: GfTextStyles.labelSmall.copyWith(
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRatingItem(DriverRating rating) => Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: GfTokens.colorSurfaceVariant.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: const Color(GfTokens.colorOutlineVariant),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Estrelas
              Row(
                children: List.generate(5, (index) {
                  return Icon(
                    index < rating.rating ? Icons.star : Icons.star_border,
                    color: const Color(GfTokens.colorWarning),
                    size: 16,
                  );
                }),
              ),
              const Spacer(),
              // Data
              Text(
                DateFormat('dd/MM/yyyy').format(rating.createdAt),
                style: GfTextStyles.labelSmall.copyWith(
                  color: const Color(GfTokens.colorOnSurfaceVariant),
                ),
              ),
            ],
          ),
          if (rating.comment != null && rating.comment!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              rating.comment!,
              style: GfTextStyles.bodyMedium,
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(
                Icons.person,
                size: 14,
                color: const Color(GfTokens.colorOnSurfaceVariant),
              ),
              const SizedBox(width: 4),
              Text(
                'Passageiro: ${rating.passengerId}',
                style: GfTextStyles.labelSmall.copyWith(
                  color: const Color(GfTokens.colorOnSurfaceVariant),
                ),
              ),
              if (rating.tripId != null) ...[
                const SizedBox(width: 16),
                Icon(
                  Icons.route,
                  size: 14,
                  color: const Color(GfTokens.colorOnSurfaceVariant),
                ),
                const SizedBox(width: 4),
                Text(
                  'Viagem: ${rating.tripId}',
                  style: GfTextStyles.labelSmall.copyWith(
                    color: const Color(GfTokens.colorOnSurfaceVariant),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );

  int _getRatingCount(int stars) => driver.ratings.where((rating) => rating.rating == stars).length;
}
