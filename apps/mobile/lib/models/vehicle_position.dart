// ========================================
// GolfFox Vehicle Position Model v11.0
// Modelo para posicoes de veiculos no mapa
// ========================================

import 'package:google_maps_flutter/google_maps_flutter.dart';

enum VehicleStatus {
  active,
  inactive,
  maintenance,
  emergency,
  offline,
}

extension VehicleStatusExtension on VehicleStatus {
  String get displayName {
    switch (this) {
      case VehicleStatus.active:
        return 'Ativo';
      case VehicleStatus.inactive:
        return 'Inativo';
      case VehicleStatus.maintenance:
        return 'Manutencao';
      case VehicleStatus.emergency:
        return 'Emergencia';
      case VehicleStatus.offline:
        return 'Offline';
    }
  }

  int get colorValue {
    switch (this) {
      case VehicleStatus.active:
        return 0xFF10B981; // Green
      case VehicleStatus.inactive:
        return 0xFF6B7280; // Gray
      case VehicleStatus.maintenance:
        return 0xFFF59E0B; // Orange
      case VehicleStatus.emergency:
        return 0xFFEF4444; // Red
      case VehicleStatus.offline:
        return 0xFF374151; // Dark Gray
    }
  }
}

class VehiclePosition {
  const VehiclePosition({
    required this.id,
    required this.vehicleId,
    required this.licensePlate,
    required this.driverName,
    required this.position,
    required this.status,
    required this.lastUpdate,
    this.speed,
    this.heading,
    this.routeId,
    this.routeName,
    this.passengerCount,
    this.capacity,
  });

  factory VehiclePosition.fromJson(Map<String, dynamic> json) =>
      VehiclePosition(
        id: json['id'] as String,
        vehicleId: json['vehicle_id'] as String,
        licensePlate: json['license_plate'] as String,
        driverName: json['driver_name'] as String,
        position: LatLng(
          (json['latitude'] as num).toDouble(),
          (json['longitude'] as num).toDouble(),
        ),
        status: VehicleStatus.values.firstWhere(
          (e) => e.name == json['status'],
          orElse: () => VehicleStatus.offline,
        ),
        speed: json['speed'] as double?,
        heading: json['heading'] as double?,
        lastUpdate: DateTime.parse(json['last_update'] as String),
        routeId: json['route_id'] as String?,
        routeName: json['route_name'] as String?,
        passengerCount: json['passenger_count'] as int?,
        capacity: json['capacity'] as int?,
      );
  final String id;
  final String vehicleId;
  final String licensePlate;
  final String driverName;
  final LatLng position;
  final VehicleStatus status;
  final double? speed;
  final double? heading;
  final DateTime lastUpdate;
  final String? routeId;
  final String? routeName;
  final int? passengerCount;
  final int? capacity;

  Map<String, dynamic> toJson() => {
        'id': id,
        'vehicle_id': vehicleId,
        'license_plate': licensePlate,
        'driver_name': driverName,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'status': status.name,
        'speed': speed,
        'heading': heading,
        'last_update': lastUpdate.toIso8601String(),
        'route_id': routeId,
        'route_name': routeName,
        'passenger_count': passengerCount,
        'capacity': capacity,
      };

  VehiclePosition copyWith({
    String? id,
    String? vehicleId,
    String? licensePlate,
    String? driverName,
    LatLng? position,
    VehicleStatus? status,
    double? speed,
    double? heading,
    DateTime? lastUpdate,
    String? routeId,
    String? routeName,
    int? passengerCount,
    int? capacity,
  }) =>
      VehiclePosition(
        id: id ?? this.id,
        vehicleId: vehicleId ?? this.vehicleId,
        licensePlate: licensePlate ?? this.licensePlate,
        driverName: driverName ?? this.driverName,
        position: position ?? this.position,
        status: status ?? this.status,
        speed: speed ?? this.speed,
        heading: heading ?? this.heading,
        lastUpdate: lastUpdate ?? this.lastUpdate,
        routeId: routeId ?? this.routeId,
        routeName: routeName ?? this.routeName,
        passengerCount: passengerCount ?? this.passengerCount,
        capacity: capacity ?? this.capacity,
      );

  bool get isOnline => DateTime.now().difference(lastUpdate).inMinutes < 5;

  String get statusText => status.displayName;

  String get occupancyText {
    if (passengerCount == null || capacity == null) return 'N/A';
    return '$passengerCount/$capacity';
  }

  double get occupancyPercentage {
    if (passengerCount == null || capacity == null || capacity == 0) return 0;
    return (passengerCount! / capacity!).clamp(0.0, 1.0);
  }
}
