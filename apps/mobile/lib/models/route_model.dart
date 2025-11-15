// lib/models/route_model.dart
import 'package:flutter/foundation.dart';
import 'package:latlong2/latlong.dart';

typedef Json = Map<String, dynamic>;

@immutable
class RouteModel {

  const RouteModel({
    required this.id,
    required this.name,
    required this.createdAt,
    required this.updatedAt,
    this.description,
    this.companyId,
    this.transporterId,
    this.polyline = const [],
    this.polylineEncoded,
    this.totalDistance,
    this.estimatedDuration,
    this.status = 'active',
    this.color,
    this.isActive = true,
  });

  factory RouteModel.fromJson(Map<String, dynamic> json) {
    final polylineSource =
        json[RouteModelFields.polyline] as List<dynamic>? ?? [];
    final polylinePoints = polylineSource
        .map((point) {
          final data = point as Map<String, dynamic>;
          return LatLng(
            (data['lat'] as num).toDouble(),
            (data['lng'] as num).toDouble(),
          );
        })
        .toList();

    return RouteModel(
      id: json[RouteModelFields.id] as String,
      name: json[RouteModelFields.name] as String,
      description: json[RouteModelFields.description] as String?,
      companyId: json[RouteModelFields.companyId] as String?,
      transporterId: json[RouteModelFields.transporterId] as String?,
      polyline: polylinePoints,
      polylineEncoded: json[RouteModelFields.polylineEncoded] as String?,
      totalDistance: (json[RouteModelFields.totalDistance] as num?)?.toDouble(),
      estimatedDuration: json[RouteModelFields.estimatedDuration] != null
          ? Duration(minutes: json[RouteModelFields.estimatedDuration] as int)
          : null,
      status: json[RouteModelFields.status] as String? ?? 'active',
      color: json[RouteModelFields.color] as String?,
      isActive: json[RouteModelFields.isActive] as bool? ?? true,
      createdAt: DateTime.parse(json[RouteModelFields.createdAt] as String),
      updatedAt: DateTime.parse(json[RouteModelFields.updatedAt] as String),
    );
  }
  final String id;
  final String name;
  final String? description;
  final String? companyId;
  final String? transporterId;
  final List<LatLng> polyline;
  final String? polylineEncoded; // Polyline codificada do Google Maps
  final double? totalDistance; // Em quilometros
  final Duration? estimatedDuration;
  final String status; // active, inactive, maintenance
  final String? color; // Cor da rota no mapa
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  /// Status da rota como enum
  RouteStatus get routeStatus {
    switch (status.toLowerCase()) {
      case 'active':
        return RouteStatus.active;
      case 'inactive':
        return RouteStatus.inactive;
      case 'maintenance':
        return RouteStatus.maintenance;
      default:
        return RouteStatus.active;
    }
  }

  /// Cor da rota (padrao azul se nao especificada)
  int get colorValue {
    if (color != null && color!.startsWith('#')) {
      return int.parse(color!.substring(1), radix: 16) + 0xFF000000;
    }
    return 0xFF2563EB; // blue-600
  }

  /// Verifica se a rota tem polyline valida
  bool get hasValidPolyline =>
      polyline.isNotEmpty || (polylineEncoded?.isNotEmpty ?? false);

  /* ------------------------------ SERIALIZACAO (DB snake_case) ------------------------------ */

  Map<String, dynamic> toJson() => <String, dynamic>{
        RouteModelFields.id: id,
        RouteModelFields.name: name,
        RouteModelFields.description: description,
        RouteModelFields.companyId: companyId,
        RouteModelFields.transporterId: transporterId,
        RouteModelFields.polyline: polyline
            .map((p) => {'lat': p.latitude, 'lng': p.longitude})
            .toList(),
        RouteModelFields.polylineEncoded: polylineEncoded,
        RouteModelFields.totalDistance: totalDistance,
        RouteModelFields.estimatedDuration: estimatedDuration?.inMinutes,
        RouteModelFields.status: status,
        RouteModelFields.color: color,
        RouteModelFields.isActive: isActive,
        RouteModelFields.createdAt: createdAt.toIso8601String(),
        RouteModelFields.updatedAt: updatedAt.toIso8601String(),
      };

  /* ------------------------------ METODOS UTILITARIOS ------------------------------ */

  RouteModel copyWith({
    String? id,
    String? name,
    String? description,
    String? companyId,
    String? transporterId,
    List<LatLng>? polyline,
    String? polylineEncoded,
    double? totalDistance,
    Duration? estimatedDuration,
    String? status,
    String? color,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => RouteModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      companyId: companyId ?? this.companyId,
      transporterId: transporterId ?? this.transporterId,
      polyline: polyline ?? this.polyline,
      polylineEncoded: polylineEncoded ?? this.polylineEncoded,
      totalDistance: totalDistance ?? this.totalDistance,
      estimatedDuration: estimatedDuration ?? this.estimatedDuration,
      status: status ?? this.status,
      color: color ?? this.color,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RouteModel && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'RouteModel(id: $id, name: $name, status: $status)';
}

/// Enum para status da rota
enum RouteStatus {
  active,
  inactive,
  maintenance,
}

extension RouteStatusExtension on RouteStatus {
  String get displayName {
    switch (this) {
      case RouteStatus.active:
        return 'Ativa';
      case RouteStatus.inactive:
        return 'Inativa';
      case RouteStatus.maintenance:
        return 'Manutencao';
    }
  }

  String get value {
    switch (this) {
      case RouteStatus.active:
        return 'active';
      case RouteStatus.inactive:
        return 'inactive';
      case RouteStatus.maintenance:
        return 'maintenance';
    }
  }

  int get colorValue {
    switch (this) {
      case RouteStatus.active:
        return 0xFF10B981; // green-500
      case RouteStatus.inactive:
        return 0xFF6B7280; // gray-500
      case RouteStatus.maintenance:
        return 0xFFF59E0B; // amber-500
    }
  }
}

/// Campos da tabela routes no Supabase
abstract class RouteModelFields {
  static const String id = 'id';
  static const String name = 'name';
  static const String description = 'description';
  static const String companyId = 'company_id';
  static const String transporterId = 'transporter_id';
  static const String polyline = 'polyline';
  static const String polylineEncoded = 'polyline_encoded';
  static const String totalDistance = 'total_distance';
  static const String estimatedDuration = 'estimated_duration';
  static const String status = 'status';
  static const String color = 'color';
  static const String isActive = 'is_active';
  static const String createdAt = 'created_at';
  static const String updatedAt = 'updated_at';
}
