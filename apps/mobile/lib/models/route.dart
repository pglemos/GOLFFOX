// ========================================
// GolfFox Route Model v11.0
// Modelo de dados para rotas e pontos de parada
// ========================================

import 'package:google_maps_flutter/google_maps_flutter.dart';

enum RouteStatus {
  active,
  inactive,
  planned,
  completed,
  cancelled,
}

extension RouteStatusExtension on RouteStatus {
  String get displayName {
    switch (this) {
      case RouteStatus.active:
        return 'Ativa';
      case RouteStatus.inactive:
        return 'Inativa';
      case RouteStatus.planned:
        return 'Planejada';
      case RouteStatus.completed:
        return 'Concluida';
      case RouteStatus.cancelled:
        return 'Cancelada';
    }
  }

  int get colorValue {
    switch (this) {
      case RouteStatus.active:
        return 0xFF10B981; // green-500
      case RouteStatus.inactive:
        return 0xFF6B7280; // gray-500
      case RouteStatus.planned:
        return 0xFF3B82F6; // blue-500
      case RouteStatus.completed:
        return 0xFF8B5CF6; // violet-500
      case RouteStatus.cancelled:
        return 0xFFEF4444; // red-500
    }
  }
}

enum StopType {
  pickup,
  dropoff,
  waypoint,
  depot,
}

extension StopTypeExtension on StopType {
  String get displayName {
    switch (this) {
      case StopType.pickup:
        return 'Embarque';
      case StopType.dropoff:
        return 'Desembarque';
      case StopType.waypoint:
        return 'Ponto de Passagem';
      case StopType.depot:
        return 'Garagem';
    }
  }

  int get colorValue {
    switch (this) {
      case StopType.pickup:
        return 0xFF10B981; // green-500
      case StopType.dropoff:
        return 0xFFEF4444; // red-500
      case StopType.waypoint:
        return 0xFFF59E0B; // amber-500
      case StopType.depot:
        return 0xFF6366F1; // indigo-500
    }
  }
}

class RouteStop {
  const RouteStop({
    required this.id,
    required this.name,
    required this.position,
    required this.type,
    required this.order,
    this.description,
    this.scheduledTime,
    this.actualTime,
    this.estimatedPassengers,
    this.actualPassengers,
    this.estimatedDuration,
    this.isCompleted = false,
    this.notes,
  });

  factory RouteStop.fromJson(Map<String, dynamic> json) => RouteStop(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        position: LatLng(
          (json['latitude'] as num).toDouble(),
          (json['longitude'] as num).toDouble(),
        ),
        type: StopType.values.firstWhere(
          (e) => e.name == json['type'],
          orElse: () => StopType.waypoint,
        ),
        scheduledTime: json['scheduled_time'] != null
            ? DateTime.parse(json['scheduled_time'] as String)
            : null,
        actualTime: json['actual_time'] != null
            ? DateTime.parse(json['actual_time'] as String)
            : null,
        order: json['order'] as int,
        estimatedPassengers: json['estimated_passengers'] as int?,
        actualPassengers: json['actual_passengers'] as int?,
        estimatedDuration: json['estimated_duration'] != null
            ? Duration(seconds: json['estimated_duration'] as int)
            : null,
        isCompleted: json['is_completed'] as bool? ?? false,
        notes: json['notes'] as String?,
      );
  final String id;
  final String name;
  final String? description;
  final LatLng position;
  final StopType type;
  final DateTime? scheduledTime;
  final DateTime? actualTime;
  final int order;
  final int? estimatedPassengers;
  final int? actualPassengers;
  final Duration? estimatedDuration;
  final bool isCompleted;
  final String? notes;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'latitude': position.latitude,
        'longitude': position.longitude,
        'type': type.name,
        'scheduled_time': scheduledTime?.toIso8601String(),
        'actual_time': actualTime?.toIso8601String(),
        'order': order,
        'estimated_passengers': estimatedPassengers,
        'actual_passengers': actualPassengers,
        'estimated_duration': estimatedDuration?.inSeconds,
        'is_completed': isCompleted,
        'notes': notes,
      };

  RouteStop copyWith({
    String? id,
    String? name,
    String? description,
    LatLng? position,
    StopType? type,
    DateTime? scheduledTime,
    DateTime? actualTime,
    int? order,
    int? estimatedPassengers,
    int? actualPassengers,
    Duration? estimatedDuration,
    bool? isCompleted,
    String? notes,
  }) =>
      RouteStop(
        id: id ?? this.id,
        name: name ?? this.name,
        description: description ?? this.description,
        position: position ?? this.position,
        type: type ?? this.type,
        scheduledTime: scheduledTime ?? this.scheduledTime,
        actualTime: actualTime ?? this.actualTime,
        order: order ?? this.order,
        estimatedPassengers: estimatedPassengers ?? this.estimatedPassengers,
        actualPassengers: actualPassengers ?? this.actualPassengers,
        estimatedDuration: estimatedDuration ?? this.estimatedDuration,
        isCompleted: isCompleted ?? this.isCompleted,
        notes: notes ?? this.notes,
      );

  bool get isDelayed {
    if (scheduledTime == null || actualTime == null) return false;
    return actualTime!.isAfter(scheduledTime!.add(const Duration(minutes: 5)));
  }

  bool get isOnTime {
    if (scheduledTime == null || actualTime == null) return false;
    final difference = actualTime!.difference(scheduledTime!).abs();
    return difference.inMinutes <= 5;
  }

  String get statusText {
    if (isCompleted) {
      if (isOnTime) return 'No horario';
      if (isDelayed) return 'Atrasado';
      return 'Concluido';
    }
    return 'Pendente';
  }
}

class BusRoute {
  const BusRoute({
    required this.id,
    required this.name,
    required this.status,
    required this.stops,
    required this.createdAt,
    required this.updatedAt,
    this.description,
    this.vehicleId,
    this.driverId,
    this.scheduledStartTime,
    this.startTime,
    this.endTime,
    this.estimatedDuration,
    this.actualDuration,
    this.estimatedDistance,
    this.actualDistance,
    this.maxPassengers,
    this.notes,
  });

  factory BusRoute.fromJson(Map<String, dynamic> json) => BusRoute(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        status: RouteStatus.values.firstWhere(
          (e) => e.name == json['status'],
          orElse: () => RouteStatus.planned,
        ),
        stops: (json['stops'] as List<dynamic>?)
                ?.map(
                    (stop) => RouteStop.fromJson(stop as Map<String, dynamic>))
                .toList() ??
            [],
        vehicleId: json['vehicle_id'] as String?,
        driverId: json['driver_id'] as String?,
        scheduledStartTime: json['scheduled_start_time'] != null
            ? DateTime.parse(json['scheduled_start_time'] as String)
            : null,
        startTime: json['start_time'] != null
            ? DateTime.parse(json['start_time'] as String)
            : null,
        endTime: json['end_time'] != null
            ? DateTime.parse(json['end_time'] as String)
            : null,
        estimatedDuration: json['estimated_duration'] != null
            ? Duration(seconds: json['estimated_duration'] as int)
            : null,
        actualDuration: json['actual_duration'] != null
            ? Duration(seconds: json['actual_duration'] as int)
            : null,
        estimatedDistance: (json['estimated_distance'] as num?)?.toDouble(),
        actualDistance: (json['actual_distance'] as num?)?.toDouble(),
        maxPassengers: json['max_passengers'] as int?,
        notes: json['notes'] as String?,
        createdAt: DateTime.parse(json['created_at'] as String),
        updatedAt: DateTime.parse(json['updated_at'] as String),
      );
  final String id;
  final String name;
  final String? description;
  final RouteStatus status;
  final List<RouteStop> stops;
  final String? vehicleId;
  final String? driverId;
  final DateTime? scheduledStartTime;
  final DateTime? startTime;
  final DateTime? endTime;
  final Duration? estimatedDuration;
  final Duration? actualDuration;
  final double? estimatedDistance;
  final double? actualDistance;
  final int? maxPassengers;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'status': status.name,
        'stops': stops.map((stop) => stop.toJson()).toList(),
        'vehicle_id': vehicleId,
        'driver_id': driverId,
        'start_time': startTime?.toIso8601String(),
        'end_time': endTime?.toIso8601String(),
        'estimated_duration': estimatedDuration?.inSeconds,
        'actual_duration': actualDuration?.inSeconds,
        'estimated_distance': estimatedDistance,
        'actual_distance': actualDistance,
        'max_passengers': maxPassengers,
        'notes': notes,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
      };

  BusRoute copyWith({
    String? id,
    String? name,
    String? description,
    RouteStatus? status,
    List<RouteStop>? stops,
    String? vehicleId,
    String? driverId,
    DateTime? scheduledStartTime,
    DateTime? startTime,
    DateTime? endTime,
    Duration? estimatedDuration,
    Duration? actualDuration,
    double? estimatedDistance,
    double? actualDistance,
    int? maxPassengers,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) =>
      BusRoute(
        id: id ?? this.id,
        name: name ?? this.name,
        description: description ?? this.description,
        status: status ?? this.status,
        stops: stops ?? this.stops,
        vehicleId: vehicleId ?? this.vehicleId,
        driverId: driverId ?? this.driverId,
        scheduledStartTime: scheduledStartTime ?? this.scheduledStartTime,
        startTime: startTime ?? this.startTime,
        endTime: endTime ?? this.endTime,
        estimatedDuration: estimatedDuration ?? this.estimatedDuration,
        actualDuration: actualDuration ?? this.actualDuration,
        estimatedDistance: estimatedDistance ?? this.estimatedDistance,
        actualDistance: actualDistance ?? this.actualDistance,
        maxPassengers: maxPassengers ?? this.maxPassengers,
        notes: notes ?? this.notes,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );

  // Getters uteis
  List<RouteStop> get orderedStops =>
      List<RouteStop>.from(stops)..sort((a, b) => a.order.compareTo(b.order));

  RouteStop? get currentStop => orderedStops.firstWhere(
        (stop) => !stop.isCompleted,
        orElse: () => orderedStops.last,
      );

  RouteStop? get nextStop {
    final current = currentStop;
    if (current == null) return null;

    final currentIndex = orderedStops.indexOf(current);
    if (currentIndex < orderedStops.length - 1) {
      return orderedStops[currentIndex + 1];
    }
    return null;
  }

  int get completedStopsCount => stops.where((stop) => stop.isCompleted).length;

  double get progressPercentage {
    if (stops.isEmpty) return 0;
    return (completedStopsCount / stops.length) * 100;
  }

  bool get isCompleted =>
      status == RouteStatus.completed ||
      stops.isNotEmpty && stops.every((stop) => stop.isCompleted);

  bool get isActive => status == RouteStatus.active;

  bool get isDelayed {
    if (estimatedDuration == null || actualDuration == null) return false;
    return actualDuration! > estimatedDuration! + const Duration(minutes: 15);
  }

  String get statusText {
    if (isCompleted) return 'Concluida';
    if (isDelayed) return 'Atrasada';
    if (isActive) return 'Em andamento';
    return status.displayName;
  }

  Duration? get estimatedTimeRemaining {
    if (!isActive || estimatedDuration == null || startTime == null) {
      return null;
    }

    final elapsed = DateTime.now().difference(startTime!);
    final remaining = estimatedDuration! - elapsed;

    return remaining.isNegative ? Duration.zero : remaining;
  }
}
