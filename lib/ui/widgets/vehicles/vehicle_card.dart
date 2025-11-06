// ========================================
// GolfFox Vehicle Card Widget v11.0
// Widget para exibir informacoes de veiculo
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/gf_tokens.dart';
import '../../../core/utils/date_utils.dart';
import '../../../models/vehicle.dart';

class VehicleCard extends StatelessWidget {

  const VehicleCard({
    super.key,
    required this.vehicle,
    this.onTap,
    this.onEdit,
    this.onDelete,
    this.showActions = true,
  });
  final Vehicle vehicle;
  final VoidCallback? onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final bool showActions;

  @override
  Widget build(BuildContext context) => Container(
      margin: const EdgeInsets.only(bottom: GfTokens.spacingMd),
      child: Material(
        color: const Color(GfTokens.colorSurface),
        borderRadius: BorderRadius.circular(GfTokens.radiusLg),
        elevation: 2,
        shadowColor: GfTokens.colorShadow.withValues(alpha: 0.1),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(GfTokens.radiusLg),
          child: Container(
            padding: const EdgeInsets.all(GfTokens.spacingMd),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Cabecalho
                Row(
                  children: [
                    // Icone do veiculo
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: Color(vehicle.status.colorValue)
                            .withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(GfTokens.radiusMd),
                      ),
                      child: Icon(
                        _getVehicleIcon(),
                        color: Color(vehicle.status.colorValue),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: GfTokens.spacingMd),

                    // Informacoes principais
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  vehicle.name,
                                  style: TextStyle(
                                    fontSize: GfTokens.fontSizeLg,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(GfTokens.colorOnSurface),
                                  ),
                                ),
                              ),
                              // Badge de status
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: GfTokens.spacingSm,
                                  vertical: GfTokens.spacingXs,
                                ),
                                decoration: BoxDecoration(
                                  color: vehicle.status.colorValue
                                      .withValues(alpha: 0.1),
                                  borderRadius:
                                      BorderRadius.circular(GfTokens.radiusSm),
                                  border: Border.all(
                                    color: vehicle.status.colorValue
                                        .withValues(alpha: 0.3),
                                  ),
                                ),
                                child: Text(
                                  vehicle.status.displayName,
                                  style: TextStyle(
                                    fontSize: GfTokens.fontSizeXs,
                                    fontWeight: FontWeight.w500,
                                    color: Color(vehicle.status.colorValue),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: GfTokens.spacingXs),
                          Row(
                            children: [
                              Text(
                                vehicle.documents.licensePlate ?? 'Sem placa',
                                style: TextStyle(
                                  fontSize: GfTokens.fontSizeMd,
                                  fontWeight: FontWeight.w500,
                                  color: const Color(
                                      GfTokens.colorOnSurfaceVariant),
                                ),
                              ),
                              const SizedBox(width: GfTokens.spacingSm),
                              Container(
                                width: 4,
                                height: 4,
                                decoration: BoxDecoration(
                                  color: const Color(
                                      GfTokens.colorOnSurfaceVariant),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: GfTokens.spacingSm),
                              Text(
                                '${vehicle.specifications.manufacturer} ${vehicle.specifications.model}',
                                style: TextStyle(
                                  fontSize: GfTokens.fontSizeMd,
                                  color: const Color(
                                      GfTokens.colorOnSurfaceVariant),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Menu de acoes
                    if (showActions)
                      PopupMenuButton<String>(
                        icon: Icon(
                          Icons.more_vert,
                          color: const Color(GfTokens.colorOnSurfaceVariant),
                        ),
                        onSelected: (value) {
                          switch (value) {
                            case 'edit':
                              onEdit?.call();
                              break;
                            case 'delete':
                              onDelete?.call();
                              break;
                          }
                        },
                        itemBuilder: (context) => [
                          PopupMenuItem(
                            value: 'edit',
                            child: Row(
                              children: [
                                Icon(Icons.edit,
                                    size: 20,
                                    color:
                                        const Color(GfTokens.colorOnSurface)),
                                const SizedBox(width: GfTokens.spacingSm),
                                const Text('Editar'),
                              ],
                            ),
                          ),
                          PopupMenuItem(
                            value: 'delete',
                            child: Row(
                              children: [
                                Icon(Icons.delete,
                                    size: 20,
                                    color: const Color(GfTokens.colorError)),
                                const SizedBox(width: GfTokens.spacingSm),
                                Text(
                                  'Excluir',
                                  style: TextStyle(
                                      color: const Color(GfTokens.colorError)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                  ],
                ),

                const SizedBox(height: GfTokens.spacingMd),

                // Metricas
                Row(
                  children: [
                    // Combustivel
                    Expanded(
                      child: _buildMetric(
                        icon: Icons.local_gas_station,
                        label: 'Combustivel',
                        value:
                            '${((vehicle.currentFuelLevel ?? 0.0) * 100).round()}%',
                        color: _getFuelColor(),
                      ),
                    ),

                    // Capacidade
                    Expanded(
                      child: _buildMetric(
                        icon: Icons.people,
                        label: 'Capacidade',
                        value: '${vehicle.specifications.capacity}',
                        color: const Color(GfTokens.colorOnSurfaceVariant),
                      ),
                    ),

                    // Odometro
                    Expanded(
                      child: _buildMetric(
                        icon: Icons.speed,
                        label: 'Km',
                        value: vehicle.formattedOdometer,
                        color: const Color(GfTokens.colorOnSurfaceVariant),
                      ),
                    ),
                  ],
                ),

                // Alertas
                if (_hasAlerts()) ...[
                  const SizedBox(height: GfTokens.spacingMd),
                  _buildAlerts(),
                ],

                // Ultima atualizacao
                const SizedBox(height: GfTokens.spacingSm),
                Row(
                  children: [
                    Icon(
                      Icons.access_time,
                      size: 14,
                      color: const Color(GfTokens.colorOnSurfaceVariant),
                    ),
                    const SizedBox(width: GfTokens.spacingXs),
                    Text(
                      'Atualizado ${GfDateUtils.timeAgo(vehicle.updatedAt)}',
                      style: TextStyle(
                        fontSize: GfTokens.fontSizeXs,
                        color: const Color(GfTokens.colorOnSurfaceVariant),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );

  Widget _buildMetric({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) => Column(
      children: [
        Icon(
          icon,
          size: 20,
          color: color,
        ),
        const SizedBox(height: GfTokens.spacingXs),
        Text(
          value,
          style: TextStyle(
            fontSize: GfTokens.fontSizeMd,
            fontWeight: FontWeight.w600,
            color: const Color(GfTokens.colorOnSurface),
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: GfTokens.fontSizeXs,
            color: const Color(GfTokens.colorOnSurfaceVariant),
          ),
        ),
      ],
    );

  Widget _buildAlerts() {
    final alerts = <Widget>[];

    if (vehicle.hasLowFuel) {
      alerts.add(_buildAlert(
        icon: Icons.local_gas_station,
        message: 'Combustivel baixo',
        color: const Color(GfTokens.colorWarning),
      ));
    }

    if (vehicle.needsMaintenance) {
      alerts.add(_buildAlert(
        icon: Icons.build,
        message: 'Manutencao necessaria',
        color: const Color(GfTokens.colorError),
      ));
    }

    if (vehicle.hasExpiringDocuments) {
      alerts.add(_buildAlert(
        icon: Icons.description,
        message: 'Documentos vencendo',
        color: const Color(GfTokens.colorWarning),
      ));
    }

    if (alerts.isEmpty) return const SizedBox.shrink();

    return Wrap(
      spacing: GfTokens.spacingSm,
      runSpacing: GfTokens.spacingXs,
      children: alerts,
    );
  }

  Widget _buildAlert({
    required IconData icon,
    required String message,
    required Color color,
  }) => Container(
      padding: const EdgeInsets.symmetric(
        horizontal: GfTokens.spacingSm,
        vertical: GfTokens.spacingXs,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(GfTokens.radiusSm),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 14,
            color: color,
          ),
          const SizedBox(width: GfTokens.spacingXs),
          Text(
            message,
            style: TextStyle(
              fontSize: GfTokens.fontSizeXs,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    )
        .animate()
        .shimmer(
          duration: const Duration(seconds: 2),
          color: color.withValues(alpha: 0.3),
        )
        .then()
        .shimmer(
          duration: const Duration(seconds: 2),
          color: color.withValues(alpha: 0.3),
        );

  IconData _getVehicleIcon() {
    switch (vehicle.type) {
      case VehicleType.bus:
        return Icons.directions_bus;
      case VehicleType.van:
        return Icons.airport_shuttle;
      case VehicleType.microbus:
        return Icons.directions_bus_filled;
      case VehicleType.car:
        return Icons.directions_car;
      case VehicleType.truck:
        return Icons.local_shipping;
    }
  }

  Color _getFuelColor() {
    final fuelLevel = vehicle.currentFuelLevel ?? 0.0;
    if (fuelLevel < 0.2) {
      return const Color(GfTokens.colorError);
    } else if (fuelLevel < 0.4) {
      return const Color(GfTokens.colorWarning);
    } else {
      return const Color(GfTokens.colorSuccess);
    }
  }

  bool _hasAlerts() => vehicle.hasLowFuel ||
        vehicle.needsMaintenance ||
        vehicle.hasExpiringDocuments;
}
