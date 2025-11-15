import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:golffox/models/user.dart' as app_user;
import 'package:golffox/models/driver_position.dart';
import 'package:golffox/models/trip.dart';

abstract class SupabaseService {
  SupabaseClient get client;

  Future<AuthResponse> signInWithEmail(String email, String password);
  Future<app_user.User?> getCurrentUserProfile();
  Future<app_user.User> upsertUserProfile(app_user.User? user);

  Future<List<DriverPosition>> getDriverPositionsForTrip(String tripId);
  Stream<List<DriverPosition>> streamDriverPositionsRealtime(String tripId);

  Future<Trip?> getTripById(String tripId);
  Future<Trip> createTrip(Trip? trip);
  Future<Trip> updateTrip(Trip? trip);
  Future<List<Trip>> getTripsForUser({required String userId});
  Stream<Trip?> streamTrip(String tripId);
}
