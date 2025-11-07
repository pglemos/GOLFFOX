// lib/models/trip.dart
import 'package:flutter/foundation.dart';

typedef Json = Map<String, dynamic>;

@immutable
class Trip {

  const Trip({
    required this.id,
    required this.routeId,
    this.driverId,
    this.vehicleId,
    required this.status,
    this.scheduledStartTime,
    this.actualStartTime,
    this.actualEndTime,
    this.startLatitude,
    this.startLongitude,
    this.endLatitude,
    this.endLongitude,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  })  : assert(id != ''),
        assert(routeId != '');

  /// Leitura tolerante (snake_case de views/RPCs do Supabase)
  factory Trip.fromJson(Map<String, dynamic> json) {
    final id = _asString(json[TripFields.id]);
    final routeId = _asString(json[TripFields.routeId]);

    if (id == null || id.isEmpty) {
      throw ArgumentError('Trip ID cannot be null or empty');
    }
    if (routeId == null || routeId.isEmpty) {
      throw ArgumentError('Trip routeId cannot be null or empty');
    }

    return Trip(
      id: id,
      routeId: routeId,
      driverId: _asString(json[TripFields.driverId]),
      vehicleId: _asString(json[TripFields.vehicleId]),
      status:
          _normalizeStatus(_asString(json[TripFields.status]) ?? 'scheduled'),
      scheduledStartTime: _asDateTime(json[TripFields.scheduledStartTime]) ??
          _asDateTime(json[TripFields.scheduledAt]),
      actualStartTime: _asDateTime(json[TripFields.actualStartTime]) ??
          _asDateTime(json[TripFields.startedAt]),
      actualEndTime: _asDateTime(json[TripFields.actualEndTime]) ??
          _asDateTime(json[TripFields.completedAt]),
      startLatitude: _asDouble(json[TripFields.startLatitude]),
      startLongitude: _asDouble(json[TripFields.startLongitude]),
      endLatitude: _asDouble(json[TripFields.endLatitude]),
      endLongitude: _asDouble(json[TripFields.endLongitude]),
      notes: _asString(json[TripFields.notes]),
      createdAt: _asDateTime(json['created_at']) ?? DateTime.now(),
      updatedAt: _asDateTime(json[TripFields.updatedAt]) ?? DateTime.now(),
    );
  }

  factory Trip.fromAppJson(Map<String, dynamic> json) {
    final id = _asString(json['id']);
    final routeId = _asString(json['routeId']);

    if (id == null || id.isEmpty) {
      throw ArgumentError('Trip ID cannot be null or empty');
    }
    if (routeId == null || routeId.isEmpty) {
      throw ArgumentError('Trip routeId cannot be null or empty');
    }

    return Trip(
      id: id,
      routeId: routeId,
      driverId: _asString(json['driverId']),
      vehicleId: _asString(json['vehicleId']),
      status: _normalizeStatus(_asString(json['status']) ?? 'scheduled'),
      scheduledStartTime: _asDateTime(json['scheduledStartTime']),
      actualStartTime: _asDateTime(json['actualStartTime']),
      actualEndTime: _asDateTime(json['actualEndTime']),
      startLatitude: _asDouble(json['startLatitude']),
      startLongitude: _asDouble(json['startLongitude']),
      endLatitude: _asDouble(json['endLatitude']),
      endLongitude: _asDouble(json['endLongitude']),
      notes: _asString(json['notes']),
      createdAt: _asDateTime(json['createdAt']) ?? DateTime.now(),
      updatedAt: _asDateTime(json['updatedAt']) ?? DateTime.now(),
    );
  }
  final String id;
  final String routeId;
  final String? driverId;
  final String? vehicleId;

  /// Valores canonicos: scheduled | inProgress | completed | cancelled
  final String status;

  final DateTime? scheduledStartTime;
  final DateTime? actualStartTime;
  final DateTime? actualEndTime;

  final double? startLatitude;
  final double? startLongitude;
  final double? endLatitude;
  final double? endLongitude;

  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  /* ------------------------------ SERIALIZACAO (DB snake_case) ------------------------------ */

  /// Mantem compatibilidade com Supabase (snake_case)
  Map<String, dynamic> toJson() => <String, dynamic>{
        TripFields.id: id,
        TripFields.routeId: routeId,
        TripFields.driverId: driverId,
        TripFields.vehicleId: vehicleId,
        TripFields.status: status,
        TripFields.scheduledStartTime: scheduledStartTime?.toIso8601String(),
        TripFields.actualStartTime: actualStartTime?.toIso8601String(),
        TripFields.actualEndTime: actualEndTime?.toIso8601String(),
        TripFields.startLatitude: startLatitude,
        TripFields.startLongitude: startLongitude,
        TripFields.endLatitude: endLatitude,
        TripFields.endLongitude: endLongitude,
        TripFields.notes: notes,
        TripFields.createdAt: createdAt.toIso8601String(),
        TripFields.updatedAt: updatedAt.toIso8601String(),
      };

  /* ------------------------------ SERIALIZACAO (App camelCase) ------------------------------ */

  Map<String, dynamic> toAppJson() => <String, dynamic>{
        'id': id,
        'routeId': routeId,
        'driverId': driverId,
        'vehicleId': vehicleId,
        'status': status,
        'scheduledStartTime': scheduledStartTime?.toIso8601String(),
        'actualStartTime': actualStartTime?.toIso8601String(),
        'actualEndTime': actualEndTime?.toIso8601String(),
        'startLatitude': startLatitude,
        'startLongitude': startLongitude,
        'endLatitude': endLatitude,
        'endLongitude': endLongitude,
        'notes': notes,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  /* ------------------------------ Helpers p/ Supabase ------------------------------ */

  Map<String, dynamic> toDbInsert() => <String, dynamic>{
        TripFields.id: id,
        TripFields.routeId: routeId,
        if (driverId != null) TripFields.driverId: driverId,
        if (vehicleId != null) TripFields.vehicleId: vehicleId,
        TripFields.status: status,
        if (scheduledStartTime != null)
          TripFields.scheduledAt: scheduledStartTime!.toIso8601String(),
        if (actualStartTime != null)
          TripFields.startedAt: actualStartTime!.toIso8601String(),
        if (actualEndTime != null)
          TripFields.completedAt: actualEndTime!.toIso8601String(),
        if (notes != null) TripFields.notes: notes,
        TripFields.updatedAt: updatedAt.toIso8601String(),
      };

  Map<String, dynamic> toDbUpdate() => <String, dynamic>{
        TripFields.routeId: routeId,
        TripFields.status: status,
        if (driverId != null) TripFields.driverId: driverId,
        if (vehicleId != null) TripFields.vehicleId: vehicleId,
        TripFields.updatedAt: updatedAt.toIso8601String(),
        TripFields.scheduledAt: scheduledStartTime?.toIso8601String(),
        TripFields.startedAt: actualStartTime?.toIso8601String(),
        TripFields.completedAt: actualEndTime?.toIso8601String(),
        TripFields.notes: notes,
      };

  /* -------------------------------- Regras de Negocio -------------------------------- */

  bool get isActive =>
      status == TripStatus.scheduled || status == TripStatus.inProgress;
  bool get isCompleted => status == TripStatus.completed;
  bool get isCancelled => status == TripStatus.cancelled;
  bool get hasStarted => actualStartTime != null;
  bool get hasEnded => actualEndTime != null;

  /// Duracao real (se iniciou e terminou)
  Duration? get actualDuration =>
      (actualStartTime != null && actualEndTime != null)
          ? actualEndTime!.difference(actualStartTime!)
          : null;

  /// Atualiza status para `inProgress` e seta `actualStartTime` se nao existir.
  Trip begin({DateTime? at, double? lat, double? lng}) => copyWith(
        status: TripStatus.inProgress,
        actualStartTime: actualStartTime ?? (at ?? DateTime.now()),
        startLatitude: lat ?? startLatitude,
        startLongitude: lng ?? startLongitude,
        updatedAt: DateTime.now(),
      );

  /// Atualiza status para `completed` e seta `actualEndTime`.
  Trip complete({DateTime? at, double? lat, double? lng}) => copyWith(
        status: TripStatus.completed,
        actualEndTime: at ?? DateTime.now(),
        endLatitude: lat ?? endLatitude,
        endLongitude: lng ?? endLongitude,
        updatedAt: DateTime.now(),
      );

  /// Atualiza status para `cancelled`.
  Trip cancel({String? reason}) => copyWith(
        status: TripStatus.cancelled,
        notes: [
          if ((notes ?? '').trim().isNotEmpty) notes!.trim(),
          if ((reason ?? '').trim().isNotEmpty) 'Cancelada: ${reason!.trim()}',
        ].where((e) => e.isNotEmpty).join('  '),
        updatedAt: DateTime.now(),
      );

  /// Ordena por prioridade de status (inProgress  scheduled  completed  cancelled) e horario
  static int compareByPriorityThenTime(Trip a, Trip b) {
    int rank(String s) {
      switch (_normalizeStatus(s)) {
        case TripStatus.inProgress:
          return 0;
        case TripStatus.scheduled:
          return 1;
        case TripStatus.completed:
          return 2;
        case TripStatus.cancelled:
          return 3;
        default:
          return 4;
      }
    }

    final r = rank(a.status).compareTo(rank(b.status));
    if (r != 0) return r;

    final as = a.scheduledStartTime;
    final bs = b.scheduledStartTime;
    if (as != null && bs != null) return as.compareTo(bs);

    // Fallback para updatedAt (recente por ultimo aqui, ou troque o sinal)
    return b.updatedAt.compareTo(a.updatedAt);
  }

  /// Validacao leve (para UX/erros proximos do usuario)
  List<String> validate() {
    final errs = <String>[];
    if (id.trim().isEmpty) errs.add('id e obrigatorio');
    if (routeId.trim().isEmpty) errs.add('routeId e obrigatorio');
    final s = _normalizeStatus(status);
    if (!TripStatus.all.contains(s)) errs.add('status invalido: $status');
    bool coordOk(double? lat, double? lng) =>
        (lat == null && lng == null) ||
        ((lat != null && lng != null) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180);
    if (!coordOk(startLatitude, startLongitude)) {
      errs.add('coordenadas de inicio invalidas');
    }
    if (!coordOk(endLatitude, endLongitude)) {
      errs.add('coordenadas de termino invalidas');
    }
    return errs;
  }

  /* --------------------------------- Copy --------------------------------- */

  Trip copyWith({
    String? id,
    String? routeId,
    String? driverId,
    String? vehicleId,
    String? status,
    DateTime? scheduledStartTime,
    DateTime? actualStartTime,
    DateTime? actualEndTime,
    double? startLatitude,
    double? startLongitude,
    double? endLatitude,
    double? endLongitude,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) =>
      Trip(
        id: id ?? this.id,
        routeId: routeId ?? this.routeId,
        driverId: driverId ?? this.driverId,
        vehicleId: vehicleId ?? this.vehicleId,
        status: status != null ? _normalizeStatus(status) : this.status,
        scheduledStartTime: scheduledStartTime ?? this.scheduledStartTime,
        actualStartTime: actualStartTime ?? this.actualStartTime,
        actualEndTime: actualEndTime ?? this.actualEndTime,
        startLatitude: startLatitude ?? this.startLatitude,
        startLongitude: startLongitude ?? this.startLongitude,
        endLatitude: endLatitude ?? this.endLatitude,
        endLongitude: endLongitude ?? this.endLongitude,
        notes: notes ?? this.notes,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );

  /// Permite **limpar** campos opcionais (setar `null`)
  Trip copyWithNullable({
    bool clearDriver = false,
    bool clearVehicle = false,
    bool clearStartCoords = false,
    bool clearEndCoords = false,
    bool clearNotes = false,
    String? driverId,
    String? vehicleId,
    double? startLatitude,
    double? startLongitude,
    double? endLatitude,
    double? endLongitude,
    String? notes,
  }) =>
      Trip(
        id: id,
        routeId: routeId,
        driverId: clearDriver ? null : (driverId ?? this.driverId),
        vehicleId: clearVehicle ? null : (vehicleId ?? this.vehicleId),
        status: status,
        scheduledStartTime: scheduledStartTime,
        actualStartTime: actualStartTime,
        actualEndTime: actualEndTime,
        startLatitude:
            clearStartCoords ? null : (startLatitude ?? this.startLatitude),
        startLongitude:
            clearStartCoords ? null : (startLongitude ?? this.startLongitude),
        endLatitude: clearEndCoords ? null : (endLatitude ?? this.endLatitude),
        endLongitude:
            clearEndCoords ? null : (endLongitude ?? this.endLongitude),
        notes: clearNotes ? null : (notes ?? this.notes),
        createdAt: createdAt,
        updatedAt: updatedAt,
      );

  /* --------------------------------- Equality --------------------------------- */

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Trip && runtimeType == other.runtimeType && id == other.id);

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'Trip(id: $id, status: $status, routeId: $routeId)';

  /* --------------------------------- Parsers --------------------------------- */

  static String? _asString(Object? v) => v?.toString();

  static double? _asDouble(Object? v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    if (v is String && v.trim().isNotEmpty) return double.tryParse(v.trim());
    return null;
  }

  static DateTime? _asDateTime(Object? v) {
    if (v == null) return null;
    if (v is DateTime) return v;
    if (v is int) {
      final isSeconds = v < 100000000000; // heuristica ms vs s
      return DateTime.fromMillisecondsSinceEpoch(isSeconds ? v * 1000 : v,
              isUtc: true)
          .toLocal();
    }
    if (v is String && v.isNotEmpty) return DateTime.parse(v);
    return null;
  }

  static String _normalizeStatus(String s) {
    final x = s.replaceAll(RegExp(r'[_\s-]'), '').toLowerCase();
    if (x == 'inprogress') return TripStatus.inProgress;
    if (x == 'scheduled') return TripStatus.scheduled;
    if (x == 'completed') return TripStatus.completed;
    if (x == 'cancelled' || x == 'canceled') return TripStatus.cancelled;
    return s; // devolve original se desconhecido (para debug/erros de dados)
  }
}

/* ------------------------------ Constantes/Campos ------------------------------ */

abstract class TripFields {
  static const String id = 'id';
  static const String routeId = 'route_id';
  static const String driverId = 'driver_id';
  static const String vehicleId = 'vehicle_id';
  static const String status = 'status';
  static const String scheduledStartTime = 'scheduled_start_time';
  static const String actualStartTime = 'actual_start_time';
  static const String actualEndTime = 'actual_end_time';
  static const String startLatitude = 'start_latitude';
  static const String startLongitude = 'start_longitude';
  static const String endLatitude = 'end_latitude';
  static const String endLongitude = 'end_longitude';
  static const String notes = 'notes';
  static const String createdAt = 'created_at';
  static const String updatedAt = 'updated_at';

  // Alternative field names used by migration_complete_v74.sql
  static const String scheduledAt = 'scheduled_at';
  static const String startedAt = 'started_at';
  static const String completedAt = 'completed_at';
}

abstract class TripStatus {
  static const String scheduled = 'scheduled';
  static const String inProgress = 'inProgress';
  static const String completed = 'completed';
  static const String cancelled = 'cancelled';

  static const List<String> all = [scheduled, inProgress, completed, cancelled];
}
