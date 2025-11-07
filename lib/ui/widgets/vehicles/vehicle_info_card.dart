// ========================================
// GolfFox Vehicle Info Card v11.0
// Widget para exibir informacoes detalhadas do veiculo
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/gf_tokens.dart';
import '../../../models/vehicle.dart';

class VehicleInfoCard extends StatelessWidget {

  const VehicleInfoCard({
    super.key,
    required this.vehicle,
  });
  final Vehicle vehicle;

  @override
  Widget build(BuildContext context) => Card(
      child: Padding(
        padding: const EdgeInsets.all(GfTokens.spacingMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header com nome e placa
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        vehicle.name,
                        style: const TextStyle(
                          fontSize: GfTokens.fontSizeXl,
                          fontWeight: FontWeight.w600,
                          color: Color(GfTokens.colorOnSurface),
                        ),
                      ),
                      if (vehicle.documents.licensePlate != null)
                        Text(
                          vehicle.documents.licensePlate!,
                          style: const TextStyle(
                            fontSize: GfTokens.fontSizeLg,
                            color: Color(GfTokens.colorOnSurfaceVariant),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                    ],
                  ),
                ),

                // Icone do tipo de veiculo
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: vehicle.type.colorValue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(GfTokens.radiusMd),
                    border: Border.all(
                      color: vehicle.type.colorValue.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Icon(
                    _getVehicleIcon(vehicle.type),
                    color: Color(vehicle.type.colorValue),
                    size: 30,
                  ),
                ),
              ],
            ),

            const SizedBox(height: GfTokens.spacingMd),

            // Informacoes basicas
            Row(
              children: [
                Expanded(
                  child: _buildInfoItem(
                    'Fabricante',
                    vehicle.specifications.manufacturer,
                    Icons.business,
                  ),
                ),
                Expanded(
                  child: _buildInfoItem(
                    'Modelo',
                    vehicle.specifications.model,
                    Icons.directions_car,
                  ),
                ),
                Expanded(
                  child: _buildInfoItem(
                    'Ano',
                    vehicle.specifications.year.toString(),
                    Icons.calendar_today,
                  ),
                ),
              ],
            ),

            const SizedBox(height: GfTokens.spacingMd),

            // Combustivel e capacidade
            Row(
              children: [
                Expanded(
                  child: _buildFuelInfo(),
                ),
                const SizedBox(width: GfTokens.spacingMd),
                Expanded(
                  child: _buildCapacityInfo(),
                ),
              ],
            ),

            const SizedBox(height: GfTokens.spacingMd),

            // Alertas
            if (_hasAlerts()) ...[
              _buildAlertsSection(),
              const SizedBox(height: GfTokens.spacingMd),
            ],

            // Ultima atualizacao
            Row(
              children: [
                const Icon(
                  Icons.update,
                  size: 16,
                  color: Color(GfTokens.colorOnSurfaceVariant),
                ),
                const SizedBox(width: GfTokens.spacingXs),
                Text(
                  'Atualizado em ${_formatDate(vehicle.updatedAt)}',
                  style: const TextStyle(
                    fontSize: GfTokens.fontSizeSm,
                    color: Color(GfTokens.colorOnSurfaceVariant),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.1, end: 0);

  Widget _buildInfoItem(String label, String value, IconData icon) => Column(
      children: [
        Icon(
          icon,
          color: const Color(GfTokens.colorPrimary),
          size: 20,
        ),
        const SizedBox(height: GfTokens.spacingXs),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            color: Color(GfTokens.colorOnSurface),
            fontSize: GfTokens.fontSizeSm,
          ),
          textAlign: TextAlign.center,
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
    );

  Widget _buildFuelInfo() {
    final fuelLevel = vehicle.currentFuelLevel ?? 0.0;
    final fuelColor = Color(fuelLevel < 20
        ? GfTokens.colorError
        : fuelLevel < 50
            ? GfTokens.colorWarning
            : GfTokens.colorSuccess);

    return Container(
      padding: const EdgeInsets.all(GfTokens.spacingMd),
      decoration: BoxDecoration(
        color: fuelColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(GfTokens.radiusSm),
        border: Border.all(color: fuelColor.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(
                Icons.local_gas_station,
                color: fuelColor,
                size: 20,
              ),
              Text(
                '${fuelLevel.toStringAsFixed(0)}%',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: fuelColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: GfTokens.spacingSm),

          // Barra de combustivel
          Container(
            height: 6,
            decoration: BoxDecoration(
              color: fuelColor.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(3),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: fuelLevel / 100,
              child: Container(
                decoration: BoxDecoration(
                  color: fuelColor,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
          ),
          const SizedBox(height: GfTokens.spacingSm),

          const Text(
            'Combustivel',
            style: TextStyle(
              fontSize: GfTokens.fontSizeSm,
              color: Color(GfTokens.colorOnSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCapacityInfo() => Container(
      padding: const EdgeInsets.all(GfTokens.spacingMd),
      decoration: BoxDecoration(
        color: const Color(GfTokens.colorInfo).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(GfTokens.radiusSm),
        border:
            Border.all(color: const Color(GfTokens.colorInfo).withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Icon(
                Icons.people,
                color: Color(GfTokens.colorInfo),
                size: 20,
              ),
              Text(
                '${vehicle.specifications.capacity}',
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Color(GfTokens.colorInfo),
                ),
              ),
            ],
          ),
          const SizedBox(height: GfTokens.spacingSm),

          // Indicador visual de capacidade
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              (vehicle.specifications.capacity / 10).ceil().clamp(1, 5),
              (index) => const Padding(
                padding: EdgeInsets.symmetric(horizontal: 1),
                child: Icon(
                  Icons.person,
                  size: 12,
                  color: Color(GfTokens.colorInfo),
                ),
              ),
            ),
          ),
          const SizedBox(height: GfTokens.spacingSm),

          const Text(
            'Passageiros',
            style: TextStyle(
              fontSize: GfTokens.fontSizeSm,
              color: Color(GfTokens.colorOnSurfaceVariant),
            ),
          ),
        ],
      ),
    );

  Widget _buildAlertsSection() {
    final alerts = <Widget>[];

    // Combustivel baixo
    if ((vehicle.currentFuelLevel ?? 0) < 20) {
      alerts.add(_buildAlert(
        'Combustivel baixo',
        '${(vehicle.currentFuelLevel ?? 0).toStringAsFixed(0)}%',
        Icons.local_gas_station,
        const Color(GfTokens.colorWarning),
      ));
    }

    // Manutencao necessaria
    if (vehicle.needsMaintenance) {
      alerts.add(_buildAlert(
        'Manutencao necessaria',
        'Verificar agendamento',
        Icons.build,
        const Color(GfTokens.colorError),
      ));
    }

    // Documentos vencendo
    if (vehicle.documents.hasExpiringDocuments) {
      alerts.add(_buildAlert(
        'Documentos vencendo',
        'Verificar vencimentos',
        Icons.description,
        const Color(GfTokens.colorWarning),
      ));
    }

    if (alerts.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Alertas',
          style: TextStyle(
            fontSize: GfTokens.fontSizeLg,
            fontWeight: FontWeight.w600,
            color: Color(GfTokens.colorOnSurface),
          ),
        ),
        const SizedBox(height: GfTokens.spacingSm),
        ...alerts,
      ],
    );
  }

  Widget _buildAlert(
      String title, String subtitle, IconData icon, Color color) => Container(
      margin: const EdgeInsets.only(bottom: GfTokens.spacingSm),
      padding: const EdgeInsets.all(GfTokens.spacingSm),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(GfTokens.radiusSm),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: GfTokens.spacingSm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: color,
                    fontSize: GfTokens.fontSizeSm,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: GfTokens.fontSizeXs,
                    color: color.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );

  bool _hasAlerts() => (vehicle.currentFuelLevel ?? 0) < 20 ||
        vehicle.needsMaintenance ||
        vehicle.documents.hasExpiringDocuments;

  IconData _getVehicleIcon(VehicleType type) {
    switch (type) {
      case VehicleType.bus:
        return Icons.directions_bus;
      case VehicleType.van:
        return Icons.airport_shuttle;
      case VehicleType.microbus:
        return Icons.airport_shuttle;
      case VehicleType.car:
        return Icons.directions_car;
      case VehicleType.truck:
        return Icons.local_shipping;
    }
  }

  String _formatDate(DateTime date) => '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
}
