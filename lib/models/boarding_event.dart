// lib/models/boarding_event.dart
import 'package:flutter/foundation.dart';

typedef Json = Map<String, dynamic>;

/// Tipos de eventos de embarque/desembarque
enum BoardingEventType {
  boarding, // Embarque
  alighting, // Desembarque
}

extension BoardingEventTypeExtension on BoardingEventType {
  String get displayName {
    switch (this) {
      case BoardingEventType.boarding:
        return 'Embarque';
      case BoardingEventType.alighting:
        return 'Desembarque';
    }
  }
}

@immutable
class BoardingEvent {

  const BoardingEvent({
    required this.id,
    required this.tripId,
    required this.passengerId,
    this.routeStopId,
    required this.eventType,
    required this.timestamp,
    this.latitude,
    this.longitude,
    this.nfcTagId,
    this.qrCodeData,
    this.notes,
    required this.createdAt,
  });

  /* ====================== SERIALIZACAO (DB snake_case) ====================== */

  factory BoardingEvent.fromJson(Json json) {
    return BoardingEvent(
      id: json[BoardingEventFields.id] as String,
      tripId: json[BoardingEventFields.tripId] as String,
      passengerId: json[BoardingEventFields.passengerId] as String,
      routeStopId: json[BoardingEventFields.routeStopId] as String?,
      eventType: BoardingEventType.values.firstWhere(
        (e) => e.name == json[BoardingEventFields.eventType],
        orElse: () => BoardingEventType.boarding,
      ),
      timestamp: DateTime.parse(json[BoardingEventFields.timestamp] as String),
      latitude: (json[BoardingEventFields.latitude] as num?)?.toDouble(),
      longitude: (json[BoardingEventFields.longitude] as num?)?.toDouble(),
      nfcTagId: json[BoardingEventFields.nfcTagId] as String?,
      qrCodeData: json[BoardingEventFields.qrCodeData] as String?,
      notes: json[BoardingEventFields.notes] as String?,
      createdAt: DateTime.parse(json[BoardingEventFields.createdAt] as String),
    );
  }
  final String id;
  final String tripId;
  final String passengerId;
  final String? routeStopId;
  final BoardingEventType eventType;
  final DateTime timestamp;
  final double? latitude;
  final double? longitude;
  final String? nfcTagId;
  final String? qrCodeData;
  final String? notes;
  final DateTime createdAt;

  Json toJson() => {
      BoardingEventFields.id: id,
      BoardingEventFields.tripId: tripId,
      BoardingEventFields.passengerId: passengerId,
      BoardingEventFields.routeStopId: routeStopId,
      BoardingEventFields.eventType: eventType.name,
      BoardingEventFields.timestamp: timestamp.toIso8601String(),
      BoardingEventFields.latitude: latitude,
      BoardingEventFields.longitude: longitude,
      BoardingEventFields.nfcTagId: nfcTagId,
      BoardingEventFields.qrCodeData: qrCodeData,
      BoardingEventFields.notes: notes,
      BoardingEventFields.createdAt: createdAt.toIso8601String(),
    };

  /* ================================= Copy ================================= */

  BoardingEvent copyWith({
    String? id,
    String? tripId,
    String? passengerId,
    String? routeStopId,
    BoardingEventType? eventType,
    DateTime? timestamp,
    double? latitude,
    double? longitude,
    String? nfcTagId,
    String? qrCodeData,
    String? notes,
    DateTime? createdAt,
  }) => BoardingEvent(
      id: id ?? this.id,
      tripId: tripId ?? this.tripId,
      passengerId: passengerId ?? this.passengerId,
      routeStopId: routeStopId ?? this.routeStopId,
      eventType: eventType ?? this.eventType,
      timestamp: timestamp ?? this.timestamp,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      nfcTagId: nfcTagId ?? this.nfcTagId,
      qrCodeData: qrCodeData ?? this.qrCodeData,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
    );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BoardingEvent &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() =>
      'BoardingEvent(id: $id, tripId: $tripId, eventType: $eventType)';
}

/* ------------------------------ Constantes/Campos ------------------------------ */

abstract class BoardingEventFields {
  static const String id = 'id';
  static const String tripId = 'trip_id';
  static const String passengerId = 'passenger_id';
  static const String routeStopId = 'route_stop_id';
  static const String eventType = 'event_type';
  static const String timestamp = 'timestamp';
  static const String latitude = 'latitude';
  static const String longitude = 'longitude';
  static const String nfcTagId = 'nfc_tag_id';
  static const String qrCodeData = 'qr_code_data';
  static const String notes = 'notes';
  static const String createdAt = 'created_at';
}
