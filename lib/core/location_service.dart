import 'package:geolocator/geolocator.dart';

class LocationService {
  factory LocationService() => _instance;
  LocationService._internal();
  static final LocationService _instance = LocationService._internal();

  static LocationService get instance => _instance;

  Future<Position?> getCurrentLocation() async {
    try {
      var serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw Exception('Serviço de localização desabilitado');
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Permissão de localização negada');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('Permissão de localização permanentemente negada');
      }

      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (e) {
      print('Erro ao obter localização: $e');
      return null;
    }
  }

  Future<void> getLocationUpdates(void Function(Position) callback) async {
    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10, // metros
    );

    Geolocator.getPositionStream(locationSettings: locationSettings)
        .listen(callback);
  }
}

