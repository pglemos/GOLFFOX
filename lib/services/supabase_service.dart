import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:golffox/models/user.dart' as app_user;
import 'package:golffox/models/driver_position.dart';
import 'package:golffox/models/trip.dart';

abstract class SupabaseService {
  SupabaseClient get client;

  Future<void> ensureAuth();
  Future<AuthResponse> signInWithEmail(String? email, String? password);
  Future<void> signOut();

  Future<app_user.User?> getCurrentUserProfile();
  Future<app_user.User> upsertUserProfile(app_user.User? user);

  Future<void> insertDriverPosition({
    required String? tripId,
    required String? driverId,
    required double? latitude,
    required double? longitude,
    double? accuracy,
    double? speed,
    double? heading,
  });

  Future<List<DriverPosition>> getDriverPositionsForTrip(String? tripId);
  Stream<List<DriverPosition>> streamDriverPositionsRealtime(String? tripId);

  Future<Trip?> getTripById(String? tripId);
  Future<Trip> createTrip(Trip? trip);
  Future<Trip> updateTrip(Trip? trip);
  Future<void> deleteTrip(String? tripId);

  Future<List<Trip>> getTripsForUser({int? limit, int? offset});
  Stream<Trip?> streamTrip(String? tripId);
  Stream<Map<String, dynamic>> streamTripStatus(String? tripId);

  Future<List<Map<String, dynamic>>> getCompanies();
  Future<List<Map<String, dynamic>>> getRoutesForUser();
  Future<List<Map<String, dynamic>>> getVehiclesForUser();

  Future<List<Map<String, dynamic>>> getTripReports({
    DateTime? startDate,
    DateTime? endDate,
    String? status,
    int? limit,
    int? offset,
  });

  Future<Map<String, dynamic>> createChecklist({
    required String? tripId,
    required String? type,
    Map<String, dynamic>? data,
  });

  Future<List<Map<String, dynamic>>> getChecklistsForTrip(String? tripId);

  Future<Map<String, dynamic>> transitionTripStatus({
    required String? tripId,
    required String? newStatus,
    required String? description,
    required double? lat,
    required double? lng,
    bool? force,
  });

  Future<Map<String, dynamic>?> getTripSummary(String? tripId);
  Future<List<Map<String, dynamic>>> getTripEvents(String? tripId);
}
