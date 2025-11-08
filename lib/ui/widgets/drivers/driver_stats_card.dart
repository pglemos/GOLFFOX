// ========================================
// GolfFox Driver Stats Card v11.0
// Card compacto para estatisticas de motoristas
// ========================================

import 'package:flutter/material.dart';

import '../../../core/theme/gf_tokens.dart';
import '../../../services/driver_service.dart';

class DriverStatsCard extends StatelessWidget {
  const DriverStatsCard({
    required this.stats, super.key,
    this.isLoading = false,
    this.error,
  });

  final DriversOverviewStats stats;
  final bool isLoading;
  final String? error;

  @override
  Widget build(BuildContext context) {
    if (error != null) {
      return _ErrorCard(message: error!);
    }

    if (isLoading) {
      return const _LoadingCard();
    }

    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(GfTokens.radiusMd),
        side: const BorderSide(color: Color(GfTokens.colorBorder)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(GfTokens.spacingMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.people_alt,
                  color: Color(GfTokens.colorPrimary),
                  size: 20,
                ),
                const SizedBox(width: GfTokens.spacingSm),
                Text(
                  'Estatisticas da Frota',
                  style: GfTextStyles.labelSmall.copyWith(
                    color: const Color(GfTokens.colorOnSurface),
                  ),
                ),
                const Spacer(),
                _Tag(
                  icon: Icons.warning,
                  label: '${stats.driversWithAlerts} alertas',
                  color: stats.driversWithAlerts > 0
                      ? const Color(GfTokens.colorWarning)
                      : const Color(GfTokens.colorOnSurfaceVariant),
                ),
              ],
            ),
            const SizedBox(height: GfTokens.spacingMd),
            Row(
              children: [
                Expanded(
                  child: _StatTile(
                    label: 'Total',
                    value: stats.totalDrivers,
                    icon: Icons.people,
                    color: const Color(GfTokens.colorPrimary),
                  ),
                ),
                Expanded(
                  child: _StatTile(
                    label: 'Ativos',
                    value: stats.activeDrivers,
                    icon: Icons.check_circle,
                    color: const Color(GfTokens.colorSuccess),
                  ),
                ),
                Expanded(
                  child: _StatTile(
                    label: 'Disponiveis',
                    value: stats.availableDrivers,
                    icon: Icons.directions_bus,
                    color: const Color(GfTokens.colorInfo),
                  ),
                ),
                Expanded(
                  child: _StatTile(
                    label: 'Online',
                    value: stats.onlineDrivers,
                    icon: Icons.wifi,
                    color: const Color(GfTokens.colorWarning),
                  ),
                ),
              ],
            ),
            const SizedBox(height: GfTokens.spacingMd),
            Row(
              children: [
                Expanded(
                  child: _InfoTile(
                    title: 'Media de avaliacao',
                    subtitle:
                        '${stats.averageRating.toStringAsFixed(1)} estrelas',
                    icon: Icons.star,
                  ),
                ),
                const SizedBox(width: GfTokens.spacingSm),
                Expanded(
                  child: _InfoTile(
                    title: 'Viagens concluidas',
                    subtitle: stats.totalTrips.toString(),
                    icon: Icons.route,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String label;
  final int value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.symmetric(
        horizontal: GfTokens.spacingSm,
        vertical: GfTokens.spacingSm,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(GfTokens.radiusSm),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(height: 8),
          Text(
            value.toString(),
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: Color(GfTokens.colorOnSurface),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: GfTokens.fontSizeSm,
              color: Color(GfTokens.colorOnSurfaceVariant),
            ),
          ),
        ],
      ),
    );
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.all(GfTokens.spacingSm),
      decoration: BoxDecoration(
        color: const Color(GfTokens.surfaceMuted),
        borderRadius: BorderRadius.circular(GfTokens.radiusSm),
        border: Border.all(color: const Color(GfTokens.colorBorder)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: const Color(GfTokens.colorPrimary)),
          const SizedBox(width: GfTokens.spacingSm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: GfTokens.fontSizeSm,
                    fontWeight: FontWeight.w600,
                    color: Color(GfTokens.colorOnSurface),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: GfTokens.fontSizeSm,
                    color: Color(GfTokens.colorOnSurfaceVariant),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
}

class _Tag extends StatelessWidget {
  const _Tag({
    required this.icon,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: GfTokens.fontSizeXs,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );
}

class _LoadingCard extends StatelessWidget {
  const _LoadingCard();

  @override
  Widget build(BuildContext context) => Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(GfTokens.radiusMd),
        side: const BorderSide(color: Color(GfTokens.colorBorder)),
      ),
      child: const Padding(
        padding: EdgeInsets.all(GfTokens.spacingMd),
        child: Row(
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: GfTokens.spacingMd),
            Text('Carregando estatisticas...'),
          ],
        ),
      ),
    );
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) => Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(GfTokens.radiusMd),
        side: const BorderSide(color: Color(GfTokens.colorError)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(GfTokens.spacingMd),
        child: Row(
          children: [
            const Icon(Icons.error_outline, color: Color(GfTokens.colorError)),
            const SizedBox(width: GfTokens.spacingSm),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(
                  color: Color(GfTokens.colorError),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
}
