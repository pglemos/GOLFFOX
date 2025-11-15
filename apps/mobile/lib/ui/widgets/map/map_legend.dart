// lib/ui/widgets/map/map_legend.dart
import 'package:flutter/material.dart';

import '../../../models/vehicle_status.dart' as vs;

class MapLegend extends StatelessWidget {

  const MapLegend({
    this.isExpanded = true,
    this.onToggle,
    this.statusCounts,
    super.key,
  });
  final bool isExpanded;
  final VoidCallback? onToggle;
  final Map<vs.VehicleStatusType, int>? statusCounts;

  @override
  Widget build(BuildContext context) => Positioned(
      bottom: 20,
      right: 20,
      child: Material(
        elevation: 8,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 280),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              _buildHeader(),

              // Content
              if (isExpanded) _buildContent(),
            ],
          ),
        ),
      ),
    );

  Widget _buildHeader() => InkWell(
      onTap: onToggle,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: const BoxDecoration(
          color: Color(0xFFF9FAFB),
          borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.info_outline,
              size: 18,
              color: Color(0xFF6B7280),
            ),
            const SizedBox(width: 8),
            const Text(
              'Legenda',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF374151),
              ),
            ),
            if (onToggle != null) ...[
              const SizedBox(width: 8),
              Icon(
                isExpanded ? Icons.expand_less : Icons.expand_more,
                size: 18,
                color: const Color(0xFF6B7280),
              ),
            ],
          ],
        ),
      ),
    );

  Widget _buildContent() => Container(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status dos veiculos
          const Text(
            'Status dos Veiculos',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 8),

          // Lista de status
          ...vs.VehicleStatusType.values.map(_buildStatusItem),

          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0xFFE5E7EB)),
          const SizedBox(height: 12),

          // Pontos de parada
          const Text(
            'Pontos de Parada',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Color(0xFF374151),
            ),
          ),
          const SizedBox(height: 8),

          _buildStopItem(
            icon: Icons.circle_outlined,
            color: const Color(0xFF6366F1),
            label: 'Ponto de parada',
          ),
        ],
      ),
    );

  Widget _buildStatusItem(vs.VehicleStatusType status) {
    final count = statusCounts?[status] ?? 0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          // Icone colorido
          Container(
            width: 16,
            height: 16,
            decoration: BoxDecoration(
              color: status.color,
              shape: BoxShape.circle,
            ),
            child: Icon(
              status.icon,
              size: 10,
              color: Colors.white,
            ),
          ),

          const SizedBox(width: 8),

          // Label
          Expanded(
            child: Text(
              status.displayName,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF374151),
              ),
            ),
          ),

          // Contador
          if (statusCounts != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
    color: status.color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                count.toString(),
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: status.color,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStopItem({
    required IconData icon,
    required Color color,
    required String label,
  }) => Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(
            icon,
            size: 16,
            color: color,
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF374151),
            ),
          ),
        ],
      ),
    );
}

/// Widget compacto da legenda para quando esta minimizada
class CompactMapLegend extends StatelessWidget {

  const CompactMapLegend({
    this.onExpand,
    this.statusCounts,
    super.key,
  });
  final VoidCallback? onExpand;
  final Map<vs.VehicleStatusType, int>? statusCounts;

  @override
  Widget build(BuildContext context) {
    final totalVehicles =
        statusCounts?.values.fold(0, (sum, count) => sum + count) ?? 0;

    return Positioned(
      bottom: 20,
      right: 20,
      child: Material(
        elevation: 8,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onExpand,
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.info_outline,
                  size: 16,
                  color: Color(0xFF6B7280),
                ),
                const SizedBox(width: 6),
                Text(
                  '$totalVehicles veiculos',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF374151),
                  ),
                ),
                const SizedBox(width: 4),
                // Indicadores coloridos compactos
                if (statusCounts != null) ...[
                  const SizedBox(width: 4),
                  Row(
                    children: vs.VehicleStatusType.values
                        .where((status) => (statusCounts![status] ?? 0) > 0)
                        .take(3) // Mostrar apenas os 3 primeiros
                        .map((status) => Container(
                              width: 8,
                              height: 8,
                              margin: const EdgeInsets.only(left: 2),
                              decoration: BoxDecoration(
                                color: status.color,
                                shape: BoxShape.circle,
                              ),
                            ))
                        .toList(),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
