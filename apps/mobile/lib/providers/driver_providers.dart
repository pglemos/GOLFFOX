import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/driver.dart';
import '../services/driver_service.dart';

List<Driver> _extractDrivers(AsyncValue<List<Driver>> state) =>
    state.maybeWhen(data: (drivers) => drivers, orElse: () => const []);

final driversListProvider = Provider<List<Driver>>((ref) {
  final state = ref.watch(driverServiceProvider);
  return _extractDrivers(state);
});

final driverFiltersProvider = Provider<DriverFilters>((ref) {
  ref.watch(driverServiceProvider);
  return ref.read(driverServiceProvider.notifier).currentFilters;
});

final driverStatsProvider = Provider<DriversOverviewStats>((ref) {
  ref.watch(driverServiceProvider);
  return ref.read(driverServiceProvider.notifier).getDriversStats();
});

final driversWithAlertsProvider = Provider<List<Driver>>((ref) {
  ref.watch(driverServiceProvider);
  return ref.read(driverServiceProvider.notifier).getDriversWithAlerts();
});

final availableDriversProvider = Provider<List<Driver>>((ref) {
  ref.watch(driverServiceProvider);
  return ref.read(driverServiceProvider.notifier).getAvailableDrivers();
});

final driversInTripProvider = Provider<List<Driver>>((ref) {
  final drivers = ref.watch(driversListProvider);
  return drivers
      .where((driver) => driver.status == DriverStatus.onTrip)
      .toList();
});

final onlineDriversProvider = Provider<List<Driver>>((ref) {
  ref.watch(driverServiceProvider);
  return ref.read(driverServiceProvider.notifier).getOnlineDrivers();
});

final driverProvider =
    FutureProvider.family<Driver?, String>((ref, driverId) async {
  final service = ref.read(driverServiceProvider.notifier);
  return service.getDriverById(driverId);
});
