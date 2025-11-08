// ========================================
// GolfFox Vehicle Marker Widget v12.0
// Marcador customizado para veiculos no mapa com status em tempo real
// ========================================

import 'package:flutter/material.dart';

import '../../../core/theme/unified_theme.dart';
import '../../../models/driver_position.dart';
import '../../../models/vehicle_position.dart';
import '../../../models/vehicle_status.dart' as vs;

class VehicleMarker extends StatelessWidget {

  const VehicleMarker({
    required this.vehicle,
    this.vehicleStatus,
    this.lastPosition,
    this.onTap,
    this.isSelected = false,
    this.size = 40,
    super.key,
  });
  final VehiclePosition vehicle;
  final vs.VehicleStatusType? vehicleStatus;
  final DriverPosition? lastPosition;
  final VoidCallback? onTap;
  final bool isSelected;
  final double size;

  @override
  Widget build(BuildContext context) {
    final currentStatus = vehicleStatus ?? _getDefaultStatus();
    final statusColor = currentStatus.color;
    final borderColor = vs.VehicleStatusCalculator.getBorderColor(currentStatus,
        isSelected: isSelected);

    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: size * 1.2,
        height: size * 1.2,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Corpo principal do onibus
            Container(
              width: size,
              height: size * 0.6,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(size * 0.15),
                color: statusColor,
                border: Border.all(
                  color: isSelected ? Colors.white : borderColor,
                  width: isSelected ? 2.5 : 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.3),
                    blurRadius: 6,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Center(
                child: Icon(
                  _getVehicleIcon(currentStatus),
                  color: Colors.white,
                  size: size * 0.25,
                ),
              ),
            ),

            // Halo de selecao
            if (isSelected)
              Container(
                width: size * 1.4,
                height: size * 1.4,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white,
                    width: 3,
                  ),
                ),
              ),

            // Badge de ocupacao
            if (vehicle.passengerCount != null)
              Positioned(
                bottom: -4,
                right: -4,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  decoration: BoxDecoration(
                    color: _getOccupancyColor(),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.white),
                  ),
                  child: Text(
                    '${vehicle.passengerCount}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  IconData _getVehicleIcon(vs.VehicleStatusType status) => status.icon;

  vs.VehicleStatusType _getDefaultStatus() {
    switch (vehicle.status) {
      case VehicleStatus.active:
        return vs.VehicleStatusType.moving;
      case VehicleStatus.inactive:
        return vs.VehicleStatusType.offline;
      case VehicleStatus.maintenance:
        return vs.VehicleStatusType.offline;
      case VehicleStatus.emergency:
        return vs.VehicleStatusType.offline;
      case VehicleStatus.offline:
        return vs.VehicleStatusType.offline;
    }
  }

  Color _getOccupancyColor() {
    if (vehicle.passengerCount == null) return const Color(0xFF10B981);

    final count = vehicle.passengerCount!;
    if (count >= 40) return const Color(0xFFEF4444); // Red
    if (count >= 30) return const Color(0xFFF59E0B); // Orange
    if (count >= 20) return const Color(0xFFFBBF24); // Yellow
    return const Color(0xFF10B981); // Green
  }
}

class VehicleClusterMarker extends StatelessWidget {

  const VehicleClusterMarker({
    required this.count,
    this.onTap,
    this.size = 50,
    super.key,
  });
  final int count;
  final VoidCallback? onTap;
  final double size;

  @override
  Widget build(BuildContext context) => GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: GolfFoxTheme.primaryOrange,
          border: Border.all(color: Colors.white, width: 3),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Center(
          child: Text(
            count.toString(),
            style: TextStyle(
              color: Colors.white,
              fontSize: size * 0.3,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
}
