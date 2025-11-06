// lib/models/route_deviation.dart
import 'package:flutter/foundation.dart';

typedef Json = Map<String, dynamic>;

/// Tipos de desvio de rota
enum RouteDeviationType {
  distanceDeviation, // Desvio por distancia
  timeDeviation, // Desvio por tempo
  stopSkipped, // Parada pulada
  unauthorizedStop, // Parada nao autorizada
}

extension RouteDeviationTypeExtension on RouteDeviationType {
  String get displayName {
    switch (this) {
      case RouteDeviationType.distanceDeviation:
        return 'Desvio de Distancia';
      case RouteDeviationType.timeDeviation:
        return 'Desvio de Tempo';
      case RouteDeviationType.stopSkipped:
        return 'Parada Pulada';
      case RouteDeviationType.unauthorizedStop:
        return 'Parada Nao Autorizada';
    }
  }

  String get description {
    switch (this) {
      case RouteDeviationType.distanceDeviation:
        return 'Veiculo se afastou da rota planejada';
      case RouteDeviationType.timeDeviation:
        return 'Veiculo atrasado em relacao ao cronograma';
      case RouteDeviationType.stopSkipped:
        return 'Parada obrigatoria foi pulada';
      case RouteDeviationType.unauthorizedStop:
        return 'Parada em local nao autorizado';
    }
  }
}

/// Status do desvio
enum RouteDeviationStatus {
  active, // Ativo
  resolved, // Resolvido
  ignored, // Ignorado
}

extension RouteDeviationStatusExtension on RouteDeviationStatus {
  String get displayName {
    switch (this) {
      case RouteDeviationStatus.active:
        return 'Ativo';
      case RouteDeviationStatus.resolved:
        return 'Resolvido';
      case RouteDeviationStatus.ignored:
        return 'Ignorado';
    }
  }
}

@immutable
class RouteDeviation {

  const RouteDeviation({
    required this.id,
    required this.tripId,
    required this.vehicleId,
    required this.driverId,
    required this.routeId,
    required this.deviationType,
    required this.status,
    required this.latitude,
    required this.longitude,
    this.distanceFromRoute,
    this.timeDeviationMinutes,
    this.routeStopId,
    this.description,
    required this.detectedAt,
    this.resolvedAt,
    this.resolvedBy,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  /* ====================== SERIALIZACAO (DB snake_case) ====================== */

  factory RouteDeviation.fromJson(Json json) {
    return RouteDeviation(
      id: json[RouteDeviationFields.id] as String,
      tripId: json[RouteDeviationFields.tripId] as String,
      vehicleId: json[RouteDeviationFields.vehicleId] as String,
      driverId: json[RouteDeviationFields.driverId] as String,
      routeId: json[RouteDeviationFields.routeId] as String,
      deviationType: RouteDeviationType.values.firstWhere(
        (e) => e.name == json[RouteDeviationFields.deviationType],
        orElse: () => RouteDeviationType.distanceDeviation,
      ),
      status: RouteDeviationStatus.values.firstWhere(
        (e) => e.name == json[RouteDeviationFields.status],
        orElse: () => RouteDeviationStatus.active,
      ),
      latitude: (json[RouteDeviationFields.latitude] as num).toDouble(),
      longitude: (json[RouteDeviationFields.longitude] as num).toDouble(),
      distanceFromRoute:
          (json[RouteDeviationFields.distanceFromRoute] as num?)?.toDouble(),
      timeDeviationMinutes:
          json[RouteDeviationFields.timeDeviationMinutes] as int?,
      routeStopId: json[RouteDeviationFields.routeStopId] as String?,
      description: json[RouteDeviationFields.description] as String?,
      detectedAt:
          DateTime.parse(json[RouteDeviationFields.detectedAt] as String),
      resolvedAt: json[RouteDeviationFields.resolvedAt] != null
          ? DateTime.parse(json[RouteDeviationFields.resolvedAt] as String)
          : null,
      resolvedBy: json[RouteDeviationFields.resolvedBy] as String?,
      notes: json[RouteDeviationFields.notes] as String?,
      createdAt: DateTime.parse(json[RouteDeviationFields.createdAt] as String),
      updatedAt: DateTime.parse(json[RouteDeviationFields.updatedAt] as String),
    );
  }
  final String id;
  final String tripId;
  final String vehicleId;
  final String driverId;
  final String routeId;
  final RouteDeviationType deviationType;
  final RouteDeviationStatus status;
  final double latitude;
  final double longitude;
  final double? distanceFromRoute;
  final int? timeDeviationMinutes;
  final String? routeStopId;
  final String? description;
  final DateTime detectedAt;
  final DateTime? resolvedAt;
  final String? resolvedBy;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  Json toJson() => {
      RouteDeviationFields.id: id,
      RouteDeviationFields.tripId: tripId,
      RouteDeviationFields.vehicleId: vehicleId,
      RouteDeviationFields.driverId: driverId,
      RouteDeviationFields.routeId: routeId,
      RouteDeviationFields.deviationType: deviationType.name,
      RouteDeviationFields.status: status.name,
      RouteDeviationFields.latitude: latitude,
      RouteDeviationFields.longitude: longitude,
      RouteDeviationFields.distanceFromRoute: distanceFromRoute,
      RouteDeviationFields.timeDeviationMinutes: timeDeviationMinutes,
      RouteDeviationFields.routeStopId: routeStopId,
      RouteDeviationFields.description: description,
      RouteDeviationFields.detectedAt: detectedAt.toIso8601String(),
      RouteDeviationFields.resolvedAt: resolvedAt?.toIso8601String(),
      RouteDeviationFields.resolvedBy: resolvedBy,
      RouteDeviationFields.notes: notes,
      RouteDeviationFields.createdAt: createdAt.toIso8601String(),
      RouteDeviationFields.updatedAt: updatedAt.toIso8601String(),
    };

  /* ================================= Copy ================================= */

  RouteDeviation copyWith({
    String? id,
    String? tripId,
    String? vehicleId,
    String? driverId,
    String? routeId,
    RouteDeviationType? deviationType,
    RouteDeviationStatus? status,
    double? latitude,
    double? longitude,
    double? distanceFromRoute,
    int? timeDeviationMinutes,
    String? routeStopId,
    String? description,
    DateTime? detectedAt,
    DateTime? resolvedAt,
    String? resolvedBy,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => RouteDeviation(
      id: id ?? this.id,
      tripId: tripId ?? this.tripId,
      vehicleId: vehicleId ?? this.vehicleId,
      driverId: driverId ?? this.driverId,
      routeId: routeId ?? this.routeId,
      deviationType: deviationType ?? this.deviationType,
      status: status ?? this.status,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      distanceFromRoute: distanceFromRoute ?? this.distanceFromRoute,
      timeDeviationMinutes: timeDeviationMinutes ?? this.timeDeviationMinutes,
      routeStopId: routeStopId ?? this.routeStopId,
      description: description ?? this.description,
      detectedAt: detectedAt ?? this.detectedAt,
      resolvedAt: resolvedAt ?? this.resolvedAt,
      resolvedBy: resolvedBy ?? this.resolvedBy,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );

  /// Verifica se o desvio esta ativo
  bool get isActive => status == RouteDeviationStatus.active;

  /// Verifica se o desvio foi resolvido
  bool get isResolved => status == RouteDeviationStatus.resolved;

  /// Duracao do desvio (se resolvido)
  Duration? get duration {
    if (resolvedAt != null) {
      return resolvedAt!.difference(detectedAt);
    }
    return null;
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RouteDeviation &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() =>
      'RouteDeviation(id: $id, type: $deviationType, status: $status)';
}

/* ------------------------------ Constantes/Campos ------------------------------ */

abstract class RouteDeviationFields {
  static const String id = 'id';
  static const String tripId = 'trip_id';
  static const String vehicleId = 'vehicle_id';
  static const String driverId = 'driver_id';
  static const String routeId = 'route_id';
  static const String deviationType = 'deviation_type';
  static const String status = 'status';
  static const String latitude = 'latitude';
  static const String longitude = 'longitude';
  static const String distanceFromRoute = 'distance_from_route';
  static const String timeDeviationMinutes = 'time_deviation_minutes';
  static const String routeStopId = 'route_stop_id';
  static const String description = 'description';
  static const String detectedAt = 'detected_at';
  static const String resolvedAt = 'resolved_at';
  static const String resolvedBy = 'resolved_by';
  static const String notes = 'notes';
  static const String createdAt = 'created_at';
  static const String updatedAt = 'updated_at';
}
