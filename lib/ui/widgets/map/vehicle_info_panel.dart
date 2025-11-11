// ========================================
// GolfFox Vehicle Info Panel v11.0
// Painel de informacoes do veiculo selecionado
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../core/theme/gf_tokens.dart';
import '../../../core/theme/unified_theme.dart';
import '../../../core/utils/date_utils.dart';
import '../../../models/vehicle_position.dart';

class VehicleInfoPanel extends StatelessWidget {

  const VehicleInfoPanel({
    required this.vehicle,
    this.onClose,
    this.onTrack,
    this.onContact,
    super.key,
  });
  final VehiclePosition vehicle;
  final VoidCallback? onClose;
  final VoidCallback? onTrack;
  final VoidCallback? onContact;

  @override
  Widget build(BuildContext context) => Container(
      margin: const EdgeInsets.all(GfTokens.space4),
      decoration: BoxDecoration(
        color: const Color(GfTokens.surface),
        borderRadius: BorderRadius.circular(GfTokens.radius),
        border: Border.all(color: const Color(GfTokens.stroke)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(GfTokens.space4),
            decoration: BoxDecoration(
              color: vehicle.status.colorValue.withValues(alpha: 0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(GfTokens.radius),
                topRight: Radius.circular(GfTokens.radius),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Color(vehicle.status.colorValue),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    _getVehicleIcon(),
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: GfTokens.space3),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        vehicle.licensePlate,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(GfTokens.textTitle),
                        ),
                      ),
                      Text(
                        vehicle.driverName,
                        style: const TextStyle(
                          fontSize: 14,
                          color: Color(GfTokens.textMuted),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Color(vehicle.status.colorValue),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    vehicle.status.displayName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(width: GfTokens.space2),
                IconButton(
                  onPressed: onClose,
                  icon: const Icon(Icons.close),
                  iconSize: 20,
                  color: const Color(GfTokens.textMuted),
                ),
              ],
            ),
          ),

          // Conteudo
          Padding(
            padding: const EdgeInsets.all(GfTokens.space4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Informacoes principais
                Row(
                  children: [
                    Expanded(
                      child: _InfoCard(
                        icon: Icons.route,
                        label: 'Rota',
                        value: vehicle.routeName ?? 'Sem rota',
                        color: GolfFoxTheme.primaryOrange,
                      ),
                    ),
                    const SizedBox(width: GfTokens.space3),
                    Expanded(
                      child: _InfoCard(
                        icon: Icons.speed,
                        label: 'Velocidade',
                        value:
                            '${vehicle.speed?.toStringAsFixed(0) ?? '0'} km/h',
                        color: GolfFoxTheme.success,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: GfTokens.space3),

                // Ocupacao
                _InfoCard(
                  icon: Icons.people,
                  label: 'Ocupacao',
                  value: vehicle.occupancyText,
                  color: GolfFoxTheme.warning,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: GfTokens.space2),
                      LinearProgressIndicator(
                        value: vehicle.occupancyPercentage / 100,
                        backgroundColor: const Color(GfTokens.surfaceMuted),
                        valueColor: AlwaysStoppedAnimation<Color>(
                          _getOccupancyColor(vehicle.occupancyPercentage),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: GfTokens.space3),

                // Ultima atualizacao
                Row(
                  children: [
                    const Icon(
                      Icons.access_time,
                      size: 16,
                      color: Color(GfTokens.textMuted),
                    ),
                    const SizedBox(width: GfTokens.space1),
                    Text(
                      'Atualizado ${GfDateUtils.timeAgo(vehicle.lastUpdate)}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(GfTokens.textMuted),
                      ),
                    ),
                    const Spacer(),
                    if (vehicle.isOnline)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: GolfFoxTheme.success,
                          shape: BoxShape.circle,
                        ),
                      )
                          .animate(onPlay: (controller) => controller.repeat())
                          .scale(
                              begin: const Offset(1, 1),
                              end: const Offset(1.2, 1.2))
                          .then()
                          .scale(
                              begin: const Offset(1.2, 1.2),
                              end: const Offset(1, 1)),
                  ],
                ),

                const SizedBox(height: GfTokens.space4),

                // Acoes
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: onTrack,
                        icon: const Icon(Icons.my_location, size: 16),
                        label: const Text('Rastrear'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: GolfFoxTheme.primaryOrange,
                          side: const BorderSide(color: GolfFoxTheme.primaryOrange),
                        ),
                      ),
                    ),
                    const SizedBox(width: GfTokens.space2),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: onContact,
                        icon: const Icon(Icons.phone, size: 16),
                        label: const Text('Contatar'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: GolfFoxTheme.primaryOrange,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().slideY(begin: 0.3, end: 0).fadeIn();

  IconData _getVehicleIcon() {
    switch (vehicle.status) {
      case VehicleStatus.active:
        return Icons.directions_bus;
      case VehicleStatus.inactive:
        return Icons.bus_alert;
      case VehicleStatus.maintenance:
        return Icons.build;
      case VehicleStatus.offline:
        return Icons.signal_wifi_off;
      case VehicleStatus.emergency:
        return Icons.emergency;
    }
  }

  Color _getOccupancyColor(double percentage) {
    if (percentage >= 90) return GolfFoxTheme.error;
    if (percentage >= 70) return GolfFoxTheme.warning;
    return GolfFoxTheme.success;
  }
}

class _InfoCard extends StatelessWidget {

  const _InfoCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    this.child,
  });
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final Widget? child;

  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.all(GfTokens.space3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                icon,
                size: 16,
                color: color,
              ),
              const SizedBox(width: GfTokens.space1),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: GfTokens.space1),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Color(GfTokens.textTitle),
            ),
          ),
          if (child != null) child!,
        ],
      ),
    );
}
