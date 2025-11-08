// lib/models/vehicle_status.dart
import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'driver_position.dart';
import 'garage.dart';

/// Status do veiculo baseado na posicao e movimento
enum VehicleStatusType {
  moving, // Verde - Em movimento
  stoppedShort, // Amarelo - Parado  2 min
  stoppedLong, // Vermelho - Parado  3 min
  garage, // Azul - Na garagem / fim de rota
  offline, // Cinza - Sem dados recentes
}

extension VehicleStatusTypeExtension on VehicleStatusType {
  String get displayName {
    switch (this) {
      case VehicleStatusType.moving:
        return 'Em movimento';
      case VehicleStatusType.stoppedShort:
        return 'Parado  2 min';
      case VehicleStatusType.stoppedLong:
        return 'Parado  3 min';
      case VehicleStatusType.garage:
        return 'Na garagem';
      case VehicleStatusType.offline:
        return 'Offline';
    }
  }

  Color get color {
    switch (this) {
      case VehicleStatusType.moving:
        return const Color(0xFF10B981); // Verde
      case VehicleStatusType.stoppedShort:
        return const Color(0xFFF59E0B); // Amarelo
      case VehicleStatusType.stoppedLong:
        return const Color(0xFFEF4444); // Vermelho
      case VehicleStatusType.garage:
        return const Color(0xFF3B82F6); // Azul
      case VehicleStatusType.offline:
        return const Color(0xFF6B7280); // Cinza
    }
  }

  int get colorValue => color.toARGB32();

  IconData get icon {
    switch (this) {
      case VehicleStatusType.moving:
        return Icons.directions_bus;
      case VehicleStatusType.stoppedShort:
        return Icons.pause_circle_outline;
      case VehicleStatusType.stoppedLong:
        return Icons.stop_circle_outlined;
      case VehicleStatusType.garage:
        return Icons.garage;
      case VehicleStatusType.offline:
        return Icons.signal_wifi_off;
    }
  }
}

/// Classe utilitaria para calcular o status do veiculo
class VehicleStatusCalculator {
  /// Calcula o status do veiculo baseado na ultima posicao e garagens
  static VehicleStatusType calculateStatus({
    required DriverPosition? lastPosition,
    required List<Garage> garages,
    bool? isVehicleInGarage,
  }) {
    // Se nao ha posicao recente, veiculo esta offline
    if (lastPosition == null) {
      return VehicleStatusType.offline;
    }

    final now = DateTime.now();
    final timeDelta = now.difference(lastPosition.timestamp);

    // Se a ultima posicao e muito antiga (> 5 minutos), considerar offline
    if (timeDelta.inMinutes > 5) {
      return VehicleStatusType.offline;
    }

    // Verificar se esta na garagem (flag do veiculo ou posicao dentro da garagem)
    if (isVehicleInGarage ?? false || _isInAnyGarage(lastPosition, garages)) {
      return VehicleStatusType.garage;
    }

    // Verificar se esta em movimento
    if (_isMoving(lastPosition, timeDelta)) {
      return VehicleStatusType.moving;
    }

    // Calcular tempo parado
    final stoppedDuration = _calculateStoppedDuration(lastPosition, timeDelta);

    if (stoppedDuration.inMinutes <= 2) {
      return VehicleStatusType.stoppedShort;
    } else {
      return VehicleStatusType.stoppedLong;
    }
  }

  /// Verifica se o veiculo esta em movimento
  static bool _isMoving(DriverPosition position, Duration timeDelta) =>
      // Se velocidade > 2 km/h OU ultima atualizacao  30s
      (position.speedKmh ?? 0.0) > 2.0 || timeDelta.inSeconds <= 30;

  /// Verifica se a posicao esta dentro de alguma garagem
  static bool _isInAnyGarage(DriverPosition position, List<Garage> garages) {
    final positionLatLng = LatLng(position.latitude, position.longitude);
    for (final garage in garages) {
      if (garage.containsPosition(positionLatLng)) {
        return true;
      }
    }
    return false;
  }

  /// Calcula o tempo que o veiculo esta parado
  static Duration _calculateStoppedDuration(
      DriverPosition position, Duration timeDelta) {
    // Se a velocidade e 0, usar o tempo desde a ultima atualizacao
    if (position.speed == 0) {
      return timeDelta;
    }

    // Se ha velocidade baixa mas nao zero, considerar parado por menos tempo
    if ((position.speedKmh ?? 0.0) < 2.0) {
      return Duration(minutes: timeDelta.inMinutes ~/ 2);
    }

    return Duration.zero;
  }

  /// Obtem a cor do marcador baseada no status
  static Color getMarkerColor(VehicleStatusType status) => status.color;

  /// Obtem a cor do marcador com opacidade para diferentes estados
  static Color getMarkerColorWithOpacity(VehicleStatusType status,
      {bool isSelected = false}) {
    final baseColor = status.color;
    if (isSelected) {
      return baseColor;
    }
    return baseColor.withValues(alpha: 0.8);
  }

  /// Obtem a cor da borda do marcador
  static Color getBorderColor(VehicleStatusType status,
      {bool isSelected = false}) {
    if (isSelected) {
      return Colors.white;
    }
    return status.color.withValues(alpha: 0.3);
  }
}

/// Classe para representar o status completo do veiculo
class VehicleStatus {

  const VehicleStatus({
    required this.vehicleId,
    required this.status,
    required this.calculatedAt,
    this.lastPosition,
    this.stoppedDuration,
  });
  final String vehicleId;
  final VehicleStatusType status;
  final DriverPosition? lastPosition;
  final Duration? stoppedDuration;
  final DateTime calculatedAt;

  /// Verifica se o status esta atualizado (calculado ha menos de 1 minuto)
  bool get isUpToDate => DateTime.now().difference(calculatedAt).inMinutes < 1;

  /// Obtem a cor do marcador
  Color get markerColor => status.color;

  /// Obtem o icone do status
  IconData get icon => status.icon;

  /// Obtem a descricao do status
  String get description => status.displayName;

  @override
  String toString() => 'VehicleStatus(vehicleId: $vehicleId, status: $status)';
}
