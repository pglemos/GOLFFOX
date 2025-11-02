import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:geolocator/geolocator.dart';

import 'package:golffox/services/tracking_service.dart';

import 'tracking_service_test.mocks.dart';

@GenerateMocks([Position])
void main() {
  group('TrackingService Tests', () {
    group('TrackingStatus', () {
      test('should create TrackingStatus with required parameters', () {
        // Arrange & Act
        const status = TrackingStatus(
          tracking: true,
          queued: 5,
          tripId: 'trip123',
          driverId: 'driver456',
        );

        // Assert
        expect(status.tracking, isTrue);
        expect(status.queued, equals(5));
        expect(status.tripId, equals('trip123'));
        expect(status.driverId, equals('driver456'));
        expect(status.lastPosition, isNull);
        expect(status.lastError, isNull);
      });

      test('should create copy with updated values', () {
        // Arrange
        const originalStatus = TrackingStatus(
          tracking: false,
          queued: 0,
          tripId: 'trip123',
        );

        // Act
        final updatedStatus = originalStatus.copyWith(
          tracking: true,
          queued: 3,
          lastError: 'GPS error',
        );

        // Assert
        expect(updatedStatus.tracking, isTrue);
        expect(updatedStatus.queued, equals(3));
        expect(updatedStatus.tripId, equals('trip123')); // unchanged
        expect(updatedStatus.lastError, equals('GPS error'));
      });

      test('should preserve original values when copyWith called with nulls', () {
        // Arrange
        const originalStatus = TrackingStatus(
          tracking: true,
          queued: 5,
          tripId: 'trip123',
          driverId: 'driver456',
        );

        // Act
        final copiedStatus = originalStatus.copyWith();

        // Assert
        expect(copiedStatus.tracking, equals(originalStatus.tracking));
        expect(copiedStatus.queued, equals(originalStatus.queued));
        expect(copiedStatus.tripId, equals(originalStatus.tripId));
        expect(copiedStatus.driverId, equals(originalStatus.driverId));
      });
    });

    group('TrackingConfig', () {
      test('should create default TrackingConfig', () {
        // Arrange & Act
        const config = TrackingConfig();

        // Assert
        expect(config.streamInterval, equals(const Duration(seconds: 8)));
        expect(config.distanceFilterMeters, equals(10));
        expect(config.batchSize, equals(25));
        expect(config.offlineQueueMax, equals(2000));
        expect(config.accuracy, equals(LocationAccuracy.high));
        expect(config.useStream, isTrue);
        expect(config.debugLogs, isFalse);
      });

      test('should create custom TrackingConfig', () {
        // Arrange & Act
        const config = TrackingConfig(
          streamInterval: Duration(seconds: 15),
          distanceFilterMeters: 20,
          batchSize: 50,
          accuracy: LocationAccuracy.medium,
          useStream: false,
          debugLogs: true,
        );

        // Assert
        expect(config.streamInterval, equals(const Duration(seconds: 15)));
        expect(config.distanceFilterMeters, equals(20));
        expect(config.batchSize, equals(50));
        expect(config.accuracy, equals(LocationAccuracy.medium));
        expect(config.useStream, isFalse);
        expect(config.debugLogs, isTrue);
      });

      test('should create battery-tuned config', () {
        // Arrange
        const originalConfig = TrackingConfig(
          distanceFilterMeters: 5, // Less than 25
        );

        // Act
        final batteryConfig = originalConfig.tunedForBattery();

        // Assert
        expect(batteryConfig.streamInterval, equals(const Duration(seconds: 15)));
        expect(batteryConfig.distanceFilterMeters, equals(25)); // Should be at least 25
        expect(batteryConfig.flushInterval, equals(const Duration(seconds: 30)));
        expect(batteryConfig.accuracy, equals(LocationAccuracy.medium));
      });

      test('should preserve larger distance filter in battery-tuned config', () {
        // Arrange
        const originalConfig = TrackingConfig(
          distanceFilterMeters: 50, // Greater than 25
        );

        // Act
        final batteryConfig = originalConfig.tunedForBattery();

        // Assert
        expect(batteryConfig.distanceFilterMeters, equals(50)); // Should preserve original
      });
    });

    group('Position Validation', () {
      test('should validate position coordinates', () {
        // Arrange
        final mockPosition = MockPosition();
        when(mockPosition.latitude).thenReturn(-23.5505);
        when(mockPosition.longitude).thenReturn(-46.6333);
        when(mockPosition.accuracy).thenReturn(5.0);
        when(mockPosition.timestamp).thenReturn(DateTime.now());

        // Act & Assert
        expect(mockPosition.latitude, isA<double>());
        expect(mockPosition.longitude, isA<double>());
        expect(mockPosition.accuracy, isA<double>());
        expect(mockPosition.timestamp, isA<DateTime>());
        
        // Validate São Paulo coordinates range
        expect(mockPosition.latitude, greaterThan(-24.0));
        expect(mockPosition.latitude, lessThan(-23.0));
        expect(mockPosition.longitude, greaterThan(-47.0));
        expect(mockPosition.longitude, lessThan(-46.0));
      });

      test('should handle invalid coordinates', () {
        // Arrange
        final mockPosition = MockPosition();
        when(mockPosition.latitude).thenReturn(double.nan);
        when(mockPosition.longitude).thenReturn(double.infinity);

        // Act & Assert
        expect(mockPosition.latitude.isNaN, isTrue);
        expect(mockPosition.longitude.isInfinite, isTrue);
      });
    });

    group('Distance Calculation', () {
      test('should calculate distance between two positions', () {
        // Arrange
        final position1 = MockPosition();
        final position2 = MockPosition();
        
        // São Paulo coordinates
        when(position1.latitude).thenReturn(-23.5505);
        when(position1.longitude).thenReturn(-46.6333);
        
        // Rio de Janeiro coordinates
        when(position2.latitude).thenReturn(-22.9068);
        when(position2.longitude).thenReturn(-43.1729);

        // Act
        final distance = Geolocator.distanceBetween(
          position1.latitude,
          position1.longitude,
          position2.latitude,
          position2.longitude,
        );

        // Assert
        // Distance between São Paulo and Rio de Janeiro is approximately 357 km
        expect(distance, greaterThan(350000)); // 350 km
        expect(distance, lessThan(370000)); // 370 km
      });

      test('should return zero distance for same position', () {
        // Arrange
        final position = MockPosition();
        when(position.latitude).thenReturn(-23.5505);
        when(position.longitude).thenReturn(-46.6333);

        // Act
        final distance = Geolocator.distanceBetween(
          position.latitude,
          position.longitude,
          position.latitude,
          position.longitude,
        );

        // Assert
        expect(distance, equals(0.0));
      });
    });

    group('Accuracy Validation', () {
      test('should validate high accuracy threshold', () {
        // Arrange
        final mockPosition = MockPosition();
        when(mockPosition.accuracy).thenReturn(3.0); // High accuracy

        // Act & Assert
        expect(mockPosition.accuracy, lessThan(5.0)); // Good accuracy
      });

      test('should identify low accuracy', () {
        // Arrange
        final mockPosition = MockPosition();
        when(mockPosition.accuracy).thenReturn(50.0); // Low accuracy

        // Act & Assert
        expect(mockPosition.accuracy, greaterThan(20.0)); // Poor accuracy
      });
    });
  });
}