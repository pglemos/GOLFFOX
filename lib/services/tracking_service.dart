import 'package:geolocator/geolocator.dart';

class TrackingStatus {
  final bool tracking;
  final int queued;
  final String tripId;
  final String? driverId;
  final Position? lastPosition;
  final String? lastError;

  const TrackingStatus({
    required this.tracking,
    required this.queued,
    required this.tripId,
    this.driverId,
    this.lastPosition,
    this.lastError,
  });

  TrackingStatus copyWith({
    bool? tracking,
    int? queued,
    String? tripId,
    String? driverId,
    Position? lastPosition,
    String? lastError,
  }) {
    return TrackingStatus(
      tracking: tracking ?? this.tracking,
      queued: queued ?? this.queued,
      tripId: tripId ?? this.tripId,
      driverId: driverId ?? this.driverId,
      lastPosition: lastPosition ?? this.lastPosition,
      lastError: lastError ?? this.lastError,
    );
  }
}

class TrackingConfig {
  final Duration streamInterval;
  final int distanceFilterMeters;
  final int batchSize;
  final int offlineQueueMax;
  final Duration flushInterval;
  final LocationAccuracy accuracy;
  final bool useStream;
  final bool debugLogs;

  const TrackingConfig({
    this.streamInterval = const Duration(seconds: 8),
    this.distanceFilterMeters = 10,
    this.batchSize = 25,
    this.offlineQueueMax = 2000,
    this.flushInterval = const Duration(seconds: 15),
    this.accuracy = LocationAccuracy.high,
    this.useStream = true,
    this.debugLogs = false,
  });

  TrackingConfig tunedForBattery() {
    return TrackingConfig(
      streamInterval: const Duration(seconds: 15),
      distanceFilterMeters: distanceFilterMeters < 25 ? 25 : distanceFilterMeters,
      batchSize: batchSize,
      offlineQueueMax: offlineQueueMax,
      flushInterval: const Duration(seconds: 30),
      accuracy: LocationAccuracy.medium,
      useStream: useStream,
      debugLogs: debugLogs,
    );
  }
}

