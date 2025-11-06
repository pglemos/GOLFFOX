// lib/models/garage.dart
import 'package:flutter/foundation.dart';
import 'package:latlong2/latlong.dart';

typedef Json = Map<String, dynamic>;

@immutable
class Garage {

  const Garage({
    required this.id,
    required this.name,
    this.description,
    this.address,
    required this.latitude,
    required this.longitude,
    this.radius = 100.0, // 100 metros por padrao
    this.polygon,
    this.isActive = true,
    this.companyId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Garage.fromJson(Map<String, dynamic> json) {
    List<LatLng>? polygonPoints;
    if (json['polygon'] != null) {
      final polygonData = json['polygon'] as List;
      polygonPoints = polygonData
          .map((p) => LatLng(p['lat'] as double, p['lng'] as double))
          .toList();
    }

    return Garage(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      address: json['address'] as String?,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      radius:
          json['radius'] != null ? (json['radius'] as num).toDouble() : 100.0,
      polygon: polygonPoints,
      isActive: json['is_active'] as bool? ?? true,
      companyId: json['company_id'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }
  final String id;
  final String name;
  final String? description;
  final String? address;
  final double latitude;
  final double longitude;
  final double?
      radius; // Raio em metros para determinar se veiculo esta na garagem
  final List<LatLng>? polygon; // Poligono da area da garagem (opcional)
  final bool isActive;
  final String? companyId;
  final DateTime createdAt;
  final DateTime updatedAt;

  /// Posicao central da garagem
  LatLng get position => LatLng(latitude, longitude);

  /// Verifica se uma posicao esta dentro da garagem
  bool containsPosition(LatLng position) {
    if (polygon != null && polygon!.isNotEmpty) {
      // Usar poligono se disponivel
      return _isPointInPolygon(position, polygon!);
    } else {
      // Usar raio circular
      const distance = Distance();
      final distanceInMeters =
          distance.as(LengthUnit.Meter, this.position, position);
      return distanceInMeters <= (radius ?? 100.0);
    }
  }

  /// Algoritmo para verificar se um ponto esta dentro de um poligono
  bool _isPointInPolygon(LatLng point, List<LatLng> polygon) {
    var intersectCount = 0;
    for (var j = 0; j < polygon.length - 1; j++) {
      if (_rayCastIntersect(point, polygon[j], polygon[j + 1])) {
        intersectCount++;
      }
    }
    return (intersectCount % 2) == 1; // Impar = dentro
  }

  bool _rayCastIntersect(LatLng point, LatLng vertA, LatLng vertB) {
    var aY = vertA.latitude;
    var bY = vertB.latitude;
    var aX = vertA.longitude;
    var bX = vertB.longitude;
    var pY = point.latitude;
    var pX = point.longitude;

    if ((aY > pY) != (bY > pY) &&
        (pX < (bX - aX) * (pY - aY) / (bY - aY) + aX)) {
      return true;
    }
    return false;
  }

  /* ------------------------------ SERIALIZACAO (DB snake_case) ------------------------------ */

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'description': description,
        'address': address,
        'latitude': latitude,
        'longitude': longitude,
        'radius': radius,
        'polygon': polygon
            ?.map((p) => {'lat': p.latitude, 'lng': p.longitude})
            .toList(),
        'is_active': isActive,
        'company_id': companyId,
        'created_at': createdAt.toIso8601String(),
        'updated_at': updatedAt.toIso8601String(),
      };

  /* ------------------------------ METODOS UTILITARIOS ------------------------------ */

  Garage copyWith({
    String? id,
    String? name,
    String? description,
    String? address,
    double? latitude,
    double? longitude,
    double? radius,
    List<LatLng>? polygon,
    bool? isActive,
    String? companyId,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => Garage(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      address: address ?? this.address,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      radius: radius ?? this.radius,
      polygon: polygon ?? this.polygon,
      isActive: isActive ?? this.isActive,
      companyId: companyId ?? this.companyId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Garage && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'Garage(id: $id, name: $name, position: $position)';
}

/// Campos da tabela garages no Supabase
abstract class GarageFields {
  static const String id = 'id';
  static const String name = 'name';
  static const String description = 'description';
  static const String address = 'address';
  static const String latitude = 'latitude';
  static const String longitude = 'longitude';
  static const String radius = 'radius';
  static const String polygon = 'polygon';
  static const String isActive = 'is_active';
  static const String companyId = 'company_id';
  static const String createdAt = 'created_at';
  static const String updatedAt = 'updated_at';
}
