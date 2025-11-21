// ========================================
// GolfFox Bus Stop Model v1.0
// Modelo para pontos de parada dos onibus
// ========================================

import 'package:google_maps_flutter/google_maps_flutter.dart';

enum BusStopType {
  regular,
  terminal,
  school,
  hospital,
  shopping,
}

enum BusStopStatus {
  active,
  inactive,
  maintenance,
  temporary,
}

class BusStop {
  const BusStop({
    required this.id,
    required this.name,
    required this.position,
    required this.createdAt,
    this.description,
    this.type = BusStopType.regular,
    this.status = BusStopStatus.active,
    this.routeId,
    this.routeName,
    this.sequence,
    this.estimatedArrival,
    this.lastVisit,
    this.hasAccessibility = false,
    this.hasShelter = false,
    this.hasSeating = false,
    this.address,
    this.landmark,
    this.amenities = const [],
    this.updatedAt,
  });

  factory BusStop.fromJson(Map<String, dynamic> json) => BusStop(
        id: json['id'] as String,
        name: json['name'] as String,
        position: LatLng(
          (json['latitude'] as num).toDouble(),
          (json['longitude'] as num).toDouble(),
        ),
        createdAt: DateTime.parse(json['created_at'] as String),
        description: json['description'] as String?,
        type: BusStopType.values.firstWhere(
          (e) => e.name == json['type'],
          orElse: () => BusStopType.regular,
        ),
        status: BusStopStatus.values.firstWhere(
          (e) => e.name == json['status'],
          orElse: () => BusStopStatus.active,
        ),
        routeId: json['route_id'] as String?,
        routeName: json['route_name'] as String?,
        sequence: json['sequence'] as int?,
        estimatedArrival: json['estimated_arrival'] != null
            ? DateTime.parse(json['estimated_arrival'] as String)
            : null,
        lastVisit: json['last_visit'] != null
            ? DateTime.parse(json['last_visit'] as String)
            : null,
        hasAccessibility: json['has_accessibility'] as bool? ?? false,
        hasShelter: json['has_shelter'] as bool? ?? false,
        hasSeating: json['has_seating'] as bool? ?? false,
        address: json['address'] as String?,
        landmark: json['landmark'] as String?,
        amenities: (json['amenities'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
        updatedAt: json['updated_at'] != null
            ? DateTime.parse(json['updated_at'] as String)
            : null,
      );
  final String id;
  final String name;
  final String? description;
  final LatLng position;
  final BusStopType type;
  final BusStopStatus status;
  final String? routeId;
  final String? routeName;
  final int? sequence; // Ordem na rota
  final DateTime? estimatedArrival;
  final DateTime? lastVisit;
  final bool hasAccessibility;
  final bool hasShelter;
  final bool hasSeating;
  final String? address;
  final String? landmark;
  final List<String> amenities;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'type': type.name,
        'status': status.name,
        'route_id': routeId,
        'route_name': routeName,
        'sequence': sequence,
        'estimated_arrival': estimatedArrival?.toIso8601String(),
        'last_visit': lastVisit?.toIso8601String(),
        'has_accessibility': hasAccessibility,
        'has_shelter': hasShelter,
        'has_seating': hasSeating,
        'address': address,
        'landmark': landmark,
        'amenities': amenities,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt?.toIso8601String(),
      };

  BusStop copyWith({
    String? id,
    String? name,
    String? description,
    LatLng? position,
    BusStopType? type,
    BusStopStatus? status,
    String? routeId,
    String? routeName,
    int? sequence,
    DateTime? estimatedArrival,
    DateTime? lastVisit,
    bool? hasAccessibility,
    bool? hasShelter,
    bool? hasSeating,
    String? address,
    String? landmark,
    List<String>? amenities,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) =>
      BusStop(
        id: id ?? this.id,
        name: name ?? this.name,
        description: description ?? this.description,
        position: position ?? this.position,
        type: type ?? this.type,
        status: status ?? this.status,
        routeId: routeId ?? this.routeId,
        routeName: routeName ?? this.routeName,
        sequence: sequence ?? this.sequence,
        estimatedArrival: estimatedArrival ?? this.estimatedArrival,
        lastVisit: lastVisit ?? this.lastVisit,
        hasAccessibility: hasAccessibility ?? this.hasAccessibility,
        hasShelter: hasShelter ?? this.hasShelter,
        hasSeating: hasSeating ?? this.hasSeating,
        address: address ?? this.address,
        landmark: landmark ?? this.landmark,
        amenities: amenities ?? this.amenities,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is BusStop && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() =>
      'BusStop(id: $id, name: $name, position: $position, type: $type, status: $status)';
}

extension BusStopTypeExtension on BusStopType {
  String get displayName {
    switch (this) {
      case BusStopType.regular:
        return 'Parada Regular';
      case BusStopType.terminal:
        return 'Terminal';
      case BusStopType.school:
        return 'Escola';
      case BusStopType.hospital:
        return 'Hospital';
      case BusStopType.shopping:
        return 'Shopping';
    }
  }

  String get icon {
    switch (this) {
      case BusStopType.regular:
        return '';
      case BusStopType.terminal:
        return '';
      case BusStopType.school:
        return '';
      case BusStopType.hospital:
        return '';
      case BusStopType.shopping:
        return '';
    }
  }
}

extension BusStopStatusExtension on BusStopStatus {
  String get displayName {
    switch (this) {
      case BusStopStatus.active:
        return 'Ativa';
      case BusStopStatus.inactive:
        return 'Inativa';
      case BusStopStatus.maintenance:
        return 'Manutencao';
      case BusStopStatus.temporary:
        return 'Temporaria';
    }
  }

  int get colorValue {
    switch (this) {
      case BusStopStatus.active:
        return 0xFF4CAF50; // Verde
      case BusStopStatus.inactive:
        return 0xFF9E9E9E; // Cinza
      case BusStopStatus.maintenance:
        return 0xFFFF9800; // Laranja
      case BusStopStatus.temporary:
        return 0xFF2196F3; // Azul
    }
  }
}
