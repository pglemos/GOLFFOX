import 'package:flutter/material.dart';
import 'trip.dart';

// Enum para status de viagem com propriedades visuais
enum TripStatus {
  scheduled('Agendada', Icons.schedule, Colors.blue),
  inProgress('Em Andamento', Icons.directions_car, Colors.orange),
  completed('Concluida', Icons.check_circle, Colors.green),
  cancelled('Cancelada', Icons.cancel, Colors.red);

  const TripStatus(this.displayName, this.iconData, this.colorValue);

  final String displayName;
  final IconData iconData;
  final Color colorValue;

  static TripStatus fromString(String status) {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return TripStatus.scheduled;
      case 'inprogress':
      case 'in_progress':
        return TripStatus.inProgress;
      case 'completed':
        return TripStatus.completed;
      case 'cancelled':
      case 'canceled':
        return TripStatus.cancelled;
      default:
        return TripStatus.scheduled;
    }
  }
}

// Classe Trip estendida para o widget de historico
class TripExtended {

  const TripExtended({
    required this.id,
    required this.driverId,
    required this.passengerId,
    required this.origin,
    required this.destination,
    required this.startTime,
    required this.distance,
    required this.fare,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.endTime,
    this.rating,
    this.notes,
  });

  // Conversao do Trip original para TripExtended
  factory TripExtended.fromTrip(
    Trip trip, {
    required String passengerId,
    required String origin,
    required String destination,
    required double distance,
    required double fare,
    double? rating,
  }) =>
      TripExtended(
        id: trip.id,
        driverId: trip.driverId ?? '',
        passengerId: passengerId,
        origin: origin,
        destination: destination,
        startTime:
            trip.actualStartTime ?? trip.scheduledStartTime ?? trip.createdAt,
        endTime: trip.actualEndTime,
        distance: distance,
        fare: fare,
        status: TripStatus.fromString(trip.status),
        rating: rating,
        notes: trip.notes,
        createdAt: trip.createdAt,
        updatedAt: trip.updatedAt,
      );

  factory TripExtended.fromJson(Map<String, dynamic> json) => TripExtended(
        id: json['id'] as String? ?? '',
        driverId: json['driverId'] as String? ?? '',
        passengerId: json['passengerId'] as String? ?? '',
        origin: json['origin'] as String? ?? '',
        destination: json['destination'] as String? ?? '',
        startTime: DateTime.parse(
          json['startTime'] as String? ??
              DateTime.now().toIso8601String(),
        ),
        endTime: (json['endTime'] as String?) != null
            ? DateTime.parse(json['endTime'] as String)
            : null,
        distance: (json['distance'] as num?)?.toDouble() ?? 0,
        fare: (json['fare'] as num?)?.toDouble() ?? 0,
        status: TripStatus.fromString(json['status']?.toString() ?? ''),
        rating: (json['rating'] as num?)?.toDouble(),
        notes: json['notes'] as String?,
        createdAt: DateTime.parse(
          json['createdAt'] as String? ??
              DateTime.now().toIso8601String(),
        ),
        updatedAt: DateTime.parse(
          json['updatedAt'] as String? ??
              DateTime.now().toIso8601String(),
        ),
      );
  final String id;
  final String driverId;
  final String passengerId;
  final String origin;
  final String destination;
  final DateTime startTime;
  final DateTime? endTime;
  final double distance;
  final double fare;
  final TripStatus status;
  final double? rating;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  Duration get duration {
    if (endTime != null) {
      return endTime!.difference(startTime);
    }
    // Se ainda esta em andamento, calcula duracao ate agora
    if (status == TripStatus.inProgress) {
      return DateTime.now().difference(startTime);
    }
    // Para viagens canceladas ou sem fim definido, retorna duracao zero
    return Duration.zero;
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'driverId': driverId,
        'passengerId': passengerId,
        'origin': origin,
        'destination': destination,
        'startTime': startTime.toIso8601String(),
        'endTime': endTime?.toIso8601String(),
        'distance': distance,
        'fare': fare,
        'status': status.name,
        'rating': rating,
        'notes': notes,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  TripExtended copyWith({
    String? id,
    String? driverId,
    String? passengerId,
    String? origin,
    String? destination,
    DateTime? startTime,
    DateTime? endTime,
    double? distance,
    double? fare,
    TripStatus? status,
    double? rating,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => TripExtended(
      id: id ?? this.id,
      driverId: driverId ?? this.driverId,
      passengerId: passengerId ?? this.passengerId,
      origin: origin ?? this.origin,
      destination: destination ?? this.destination,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      distance: distance ?? this.distance,
      fare: fare ?? this.fare,
      status: status ?? this.status,
      rating: rating ?? this.rating,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TripExtended &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'TripExtended(id: $id, status: ${status.name})';
}
