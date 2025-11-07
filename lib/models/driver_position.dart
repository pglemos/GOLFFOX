// lib/models/driver_position.dart
import 'package:flutter/foundation.dart';

typedef Json = Map<String, dynamic>;

@immutable
class DriverPosition {

  const DriverPosition({
    required this.id,
    required this.tripId,
    required this.driverId,
    required this.latitude,
    required this.longitude,
    this.accuracy,
    this.speed,
    this.heading,
    required this.timestamp,
    required this.createdAt,
  });

  /// Leitura tolerante a tipos/chaves (snake_case do DB)
  factory DriverPosition.fromJson(Map<String, dynamic> json) {
    final id = _asString(json['id']);
    final tripId = _asString(json['trip_id']);
    final driverId = _asString(json['driver_id']);
    final latitude = _asDouble(json['lat']);
    final longitude = _asDouble(json['lng']);
    final timestamp = _asDateTime(json['timestamp']);

    if (id == null || id.isEmpty) {
      throw ArgumentError('DriverPosition ID cannot be null or empty');
    }
    if (tripId == null || tripId.isEmpty) {
      throw ArgumentError('DriverPosition tripId cannot be null or empty');
    }
    if (driverId == null || driverId.isEmpty) {
      throw ArgumentError('DriverPosition driverId cannot be null or empty');
    }
    if (latitude == null) {
      throw ArgumentError('DriverPosition latitude cannot be null');
    }
    if (longitude == null) {
      throw ArgumentError('DriverPosition longitude cannot be null');
    }
    if (timestamp == null) {
      throw ArgumentError('DriverPosition timestamp cannot be null');
    }

    return DriverPosition(
      id: id,
      tripId: tripId,
      driverId: driverId,
      latitude: latitude,
      longitude: longitude,
      accuracy: _asDouble(json['accuracy']),
      speed: _asDouble(json['speed']),
      heading: _asDouble(json['heading']),
      timestamp: timestamp,
      createdAt: _asDateTime(json['created_at']) ??
          _asDateTime(json['timestamp']) ??
          DateTime.now(),
    );
  }

  /// Aceita chaves camelCase (util em caches/LocalStorage etc.)
  factory DriverPosition.fromAppJson(Map<String, dynamic> json) {
    final id = _asString(json['id']);
    final tripId = _asString(json['tripId']);
    final driverId = _asString(json['driverId']);
    final latitude = _asDouble(json['latitude']);
    final longitude = _asDouble(json['longitude']);
    final timestamp = _asDateTime(json['timestamp']);

    if (id == null || id.isEmpty) {
      throw ArgumentError('DriverPosition ID cannot be null or empty');
    }
    if (tripId == null || tripId.isEmpty) {
      throw ArgumentError('DriverPosition tripId cannot be null or empty');
    }
    if (driverId == null || driverId.isEmpty) {
      throw ArgumentError('DriverPosition driverId cannot be null or empty');
    }
    if (latitude == null) {
      throw ArgumentError('DriverPosition latitude cannot be null');
    }
    if (longitude == null) {
      throw ArgumentError('DriverPosition longitude cannot be null');
    }
    if (timestamp == null) {
      throw ArgumentError('DriverPosition timestamp cannot be null');
    }

    return DriverPosition(
      id: id,
      tripId: tripId,
      driverId: driverId,
      latitude: latitude,
      longitude: longitude,
      accuracy: _asDouble(json['accuracy']),
      speed: _asDouble(json['speed']),
      heading: _asDouble(json['heading']),
      timestamp: timestamp,
      createdAt: _asDateTime(json['createdAt']) ??
          _asDateTime(json['timestamp']) ??
          DateTime.now(),
    );
  }
  final String id;
  final String tripId;
  final String driverId;
  final double latitude;
  final double longitude;
  final double? accuracy; // metros
  final double? speed; // m/s (padrao de sensores)
  final double? heading; // graus [0..360]
  final DateTime timestamp;
  final DateTime createdAt;

  /* ====================== SERIALIZACAO (DB snake_case) ====================== */

  /// Compativel com Supabase: snake_case + ISO8601 para datas
  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'trip_id': tripId,
        'driver_id': driverId,
        'lat': latitude,
        'lng': longitude,
        if (accuracy != null) 'accuracy': accuracy,
        if (speed != null) 'speed': speed,
        if (heading != null) 'heading': heading,
        'timestamp': timestamp.toIso8601String(),
        'created_at': createdAt.toIso8601String(),
      };

  /* ====================== SERIALIZACAO (App camelCase) ====================== */

  Map<String, dynamic> toAppJson() => <String, dynamic>{
        'id': id,
        'tripId': tripId,
        'driverId': driverId,
        'latitude': latitude,
        'longitude': longitude,
        'accuracy': accuracy,
        'speed': speed,
        'heading': heading,
        'timestamp': timestamp.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
      };

  /* ================== Helpers p/ Supabase (INSERT/UPDATE) =================== */

  Map<String, dynamic> toDbInsert() => <String, dynamic>{
        'id': id,
        'trip_id': tripId,
        'driver_id': driverId,
        'lat': latitude,
        'lng': longitude,
        if (accuracy != null) 'accuracy': accuracy,
        if (speed != null) 'speed': speed,
        if (heading != null) 'heading': heading,
        'timestamp': timestamp.toIso8601String(),
        'created_at': createdAt.toIso8601String(),
      };

  Map<String, dynamic> toDbUpdate() => <String, dynamic>{
        'lat': latitude,
        'lng': longitude,
        if (accuracy != null) 'accuracy': accuracy,
        if (speed != null) 'speed': speed,
        if (heading != null) 'heading': heading,
        'timestamp': timestamp.toIso8601String(),
      };

  /* ============================== Utils ============================== */

  /// km/h (arredonda pra string se quiser exibir direto)
  double? get speedKmh => speed == null ? null : speed! * 3.6;

  /// Direcao (0-360). Alguns sensores usam -1 como "sem heading".
  double? get bearingDeg =>
      (heading == null || heading!.isNaN) ? null : (heading! % 360 + 360) % 360;

  /// Ordenacao por tempo: util para `list.sort((a,b)=>a.compareToTimestamp(b))`
  int compareToTimestamp(DriverPosition other) =>
      timestamp.compareTo(other.timestamp);

  List<String> validate() {
    final errs = <String>[];
    if (id.trim().isEmpty) errs.add('id obrigatorio');
    if (tripId.trim().isEmpty) errs.add('tripId obrigatorio');
    if (driverId.trim().isEmpty) errs.add('driverId obrigatorio');
    if (latitude.isNaN || latitude < -90 || latitude > 90) {
      errs.add('latitude invalida');
    }
    if (longitude.isNaN || longitude < -180 || longitude > 180) {
      errs.add('longitude invalida');
    }
    return errs;
  }

  DriverPosition copyWith({
    String? id,
    String? tripId,
    String? driverId,
    double? latitude,
    double? longitude,
    double? accuracy,
    double? speed,
    double? heading,
    DateTime? timestamp,
    DateTime? createdAt,
  }) =>
      DriverPosition(
        id: id ?? this.id,
        tripId: tripId ?? this.tripId,
        driverId: driverId ?? this.driverId,
        latitude: latitude ?? this.latitude,
        longitude: longitude ?? this.longitude,
        accuracy: accuracy ?? this.accuracy,
        speed: speed ?? this.speed,
        heading: heading ?? this.heading,
        timestamp: timestamp ?? this.timestamp,
        createdAt: createdAt ?? this.createdAt,
      );

  /// Permite limpar campos opcionais (setar `null`) sem perder os demais
  DriverPosition copyWithNullable({
    bool clearAccuracy = false,
    bool clearSpeed = false,
    bool clearHeading = false,
    double? accuracy,
    double? speed,
    double? heading,
  }) =>
      DriverPosition(
        id: id,
        tripId: tripId,
        driverId: driverId,
        latitude: latitude,
        longitude: longitude,
        accuracy: clearAccuracy ? null : (accuracy ?? this.accuracy),
        speed: clearSpeed ? null : (speed ?? this.speed),
        heading: clearHeading ? null : (heading ?? this.heading),
        timestamp: timestamp,
        createdAt: createdAt,
      );

  /* ============================ Igualdade ============================ */

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is DriverPosition &&
          runtimeType == other.runtimeType &&
          id == other.id);

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() =>
      'DriverPosition(id: $id, trip: $tripId, lat: $latitude, lng: $longitude, ts: ${timestamp.toIso8601String()})';

  /* ============================ Parsers ============================= */

  static String? _asString(Object? v) => v?.toString();

  static double? _asDouble(Object? v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    if (v is String && v.trim().isNotEmpty) return double.tryParse(v.trim());
    return null;
    // se vier algo invalido, retornara null e a validacao pode acusar depois
  }

  static DateTime? _asDateTime(Object? v) {
    if (v == null) return null;
    if (v is DateTime) return v;
    if (v is int) {
      // aceita epoch ms ou s (heuristica simples)
      final isSeconds = v < 100000000000; // ~ano 5138 em ms
      return DateTime.fromMillisecondsSinceEpoch(isSeconds ? v * 1000 : v,
              isUtc: true)
          .toLocal();
    }
    if (v is String && v.isNotEmpty) {
      // ISO8601 ou '2025-01-01 12:00:00+00'
      return DateTime.parse(v);
    }
    return null;
  }
}
