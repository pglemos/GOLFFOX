// lib/models/route_stop.dart
import 'package:flutter/foundation.dart';
import 'package:latlong2/latlong.dart';

typedef Json = Map<String, dynamic>;

@immutable
class RouteStopModel {

  const RouteStopModel({
    required this.id,
    required this.routeId,
    required this.name,
    this.description,
    required this.latitude,
    required this.longitude,
    required this.order,
    required this.type,
    this.scheduledTime,
    this.estimatedDuration,
    this.estimatedPassengers,
    this.isActive = true,
    this.address,
    this.landmark,
    required this.createdAt,
    required this.updatedAt,
  });

  factory RouteStopModel.fromJson(Map<String, dynamic> json) {
    return RouteStopModel(
      id: json[RouteStopFields.id] as String,
      routeId: json[RouteStopFields.routeId] as String,
      name: json[RouteStopFields.name] as String,
      description: json[RouteStopFields.description] as String?,
      latitude: (json[RouteStopFields.latitude] as num).toDouble(),
      longitude: (json[RouteStopFields.longitude] as num).toDouble(),
      order: json[RouteStopFields.order] as int,
      type: json[RouteStopFields.type] as String,
      scheduledTime: json[RouteStopFields.scheduledTime] != null
          ? DateTime.parse(json[RouteStopFields.scheduledTime] as String)
          : null,
      estimatedDuration: json[RouteStopFields.estimatedDuration] != null
          ? Duration(minutes: json[RouteStopFields.estimatedDuration] as int)
          : null,
      estimatedPassengers: json[RouteStopFields.estimatedPassengers] as int?,
      isActive: json[RouteStopFields.isActive] as bool? ?? true,
      address: json[RouteStopFields.address] as String?,
      landmark: json[RouteStopFields.landmark] as String?,
      createdAt: DateTime.parse(json[RouteStopFields.createdAt] as String),
      updatedAt: DateTime.parse(json[RouteStopFields.updatedAt] as String),
    );
  }
  final String id;
  final String routeId;
  final String name;
  final String? description;
  final double latitude;
  final double longitude;
  final int order;
  final String type; // pickup, dropoff, waypoint, depot
  final DateTime? scheduledTime;
  final Duration? estimatedDuration;
  final int? estimatedPassengers;
  final bool isActive;
  final String? address;
  final String? landmark;
  final DateTime createdAt;
  final DateTime updatedAt;

  /// Posicao da parada
  LatLng get position => LatLng(latitude, longitude);

  /// Tipo da parada como enum
  RouteStopType get stopType {
    switch (type.toLowerCase()) {
      case 'pickup':
        return RouteStopType.pickup;
      case 'dropoff':
        return RouteStopType.dropoff;
      case 'depot':
        return RouteStopType.depot;
      default:
        return RouteStopType.waypoint;
    }
  }

  /// Cor baseada no tipo da parada
  int get colorValue {
    switch (stopType) {
      case RouteStopType.pickup:
        return 0xFF10B981; // green-500
      case RouteStopType.dropoff:
        return 0xFFEF4444; // red-500
      case RouteStopType.depot:
        return 0xFF6366F1; // indigo-500
      case RouteStopType.waypoint:
        return 0xFFF59E0B; // amber-500
    }
  }

  /* ------------------------------ SERIALIZACAO (DB snake_case) ------------------------------ */

  Map<String, dynamic> toJson() => <String, dynamic>{
        RouteStopFields.id: id,
        RouteStopFields.routeId: routeId,
        RouteStopFields.name: name,
        RouteStopFields.description: description,
        RouteStopFields.latitude: latitude,
        RouteStopFields.longitude: longitude,
        RouteStopFields.order: order,
        RouteStopFields.type: type,
        RouteStopFields.scheduledTime: scheduledTime?.toIso8601String(),
        RouteStopFields.estimatedDuration: estimatedDuration?.inMinutes,
        RouteStopFields.estimatedPassengers: estimatedPassengers,
        RouteStopFields.isActive: isActive,
        RouteStopFields.address: address,
        RouteStopFields.landmark: landmark,
        RouteStopFields.createdAt: createdAt.toIso8601String(),
        RouteStopFields.updatedAt: updatedAt.toIso8601String(),
      };

  /* ------------------------------ METODOS UTILITARIOS ------------------------------ */

  RouteStopModel copyWith({
    String? id,
    String? routeId,
    String? name,
    String? description,
    double? latitude,
    double? longitude,
    int? order,
    String? type,
    DateTime? scheduledTime,
    Duration? estimatedDuration,
    int? estimatedPassengers,
    bool? isActive,
    String? address,
    String? landmark,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => RouteStopModel(
      id: id ?? this.id,
      routeId: routeId ?? this.routeId,
      name: name ?? this.name,
      description: description ?? this.description,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      order: order ?? this.order,
      type: type ?? this.type,
      scheduledTime: scheduledTime ?? this.scheduledTime,
      estimatedDuration: estimatedDuration ?? this.estimatedDuration,
      estimatedPassengers: estimatedPassengers ?? this.estimatedPassengers,
      isActive: isActive ?? this.isActive,
      address: address ?? this.address,
      landmark: landmark ?? this.landmark,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RouteStopModel &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() =>
      'RouteStopModel(id: $id, name: $name, type: $type, order: $order)';
}

/// Enum para tipos de parada
enum RouteStopType {
  pickup,
  dropoff,
  waypoint,
  depot,
}

extension RouteStopTypeExtension on RouteStopType {
  String get displayName {
    switch (this) {
      case RouteStopType.pickup:
        return 'Embarque';
      case RouteStopType.dropoff:
        return 'Desembarque';
      case RouteStopType.waypoint:
        return 'Ponto de Passagem';
      case RouteStopType.depot:
        return 'Garagem';
    }
  }

  String get value {
    switch (this) {
      case RouteStopType.pickup:
        return 'pickup';
      case RouteStopType.dropoff:
        return 'dropoff';
      case RouteStopType.waypoint:
        return 'waypoint';
      case RouteStopType.depot:
        return 'depot';
    }
  }
}

/// Campos da tabela route_stops no Supabase
abstract class RouteStopFields {
  static const String id = 'id';
  static const String routeId = 'route_id';
  static const String name = 'name';
  static const String description = 'description';
  static const String latitude = 'latitude';
  static const String longitude = 'longitude';
  static const String order = 'order';
  static const String type = 'type';
  static const String scheduledTime = 'scheduled_time';
  static const String estimatedDuration = 'estimated_duration';
  static const String estimatedPassengers = 'estimated_passengers';
  static const String isActive = 'is_active';
  static const String address = 'address';
  static const String landmark = 'landmark';
  static const String createdAt = 'created_at';
  static const String updatedAt = 'updated_at';
}
