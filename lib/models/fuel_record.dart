// ========================================
// GolfFox Fuel Record Model v11.0
// Modelo de dados para registros de combustivel
// ========================================

import '../core/theme/gf_tokens.dart';
import 'vehicle.dart';

enum FuelRecordType {
  refuel,
  consumption,
  leak,
  theft,
}

extension FuelRecordTypeExtension on FuelRecordType {
  String get displayName {
    switch (this) {
      case FuelRecordType.refuel:
        return 'Abastecimento';
      case FuelRecordType.consumption:
        return 'Consumo';
      case FuelRecordType.leak:
        return 'Vazamento';
      case FuelRecordType.theft:
        return 'Furto';
    }
  }

  int get colorValue {
    switch (this) {
      case FuelRecordType.refuel:
        return GfTokens.success;
      case FuelRecordType.consumption:
        return GfTokens.info;
      case FuelRecordType.leak:
        return GfTokens.warning;
      case FuelRecordType.theft:
        return GfTokens.colorError;
    }
  }
}

class FuelStation {

  const FuelStation({
    required this.id,
    required this.name,
    required this.address,
    this.cnpj,
    this.phone,
    this.latitude,
    this.longitude,
    required this.isPreferred,
  });

  factory FuelStation.fromJson(Map<String, dynamic> json) {
    return FuelStation(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      cnpj: json['cnpj'],
      phone: json['phone'],
      latitude: json['latitude']?.toDouble(),
      longitude: json['longitude']?.toDouble(),
      isPreferred: json['is_preferred'] ?? false,
    );
  }
  final String id;
  final String name;
  final String address;
  final String? cnpj;
  final String? phone;
  final double? latitude;
  final double? longitude;
  final bool isPreferred;

  Map<String, dynamic> toJson() => {
      'id': id,
      'name': name,
      'address': address,
      'cnpj': cnpj,
      'phone': phone,
      'latitude': latitude,
      'longitude': longitude,
      'is_preferred': isPreferred,
    };

  FuelStation copyWith({
    String? id,
    String? name,
    String? address,
    String? cnpj,
    String? phone,
    double? latitude,
    double? longitude,
    bool? isPreferred,
  }) => FuelStation(
      id: id ?? this.id,
      name: name ?? this.name,
      address: address ?? this.address,
      cnpj: cnpj ?? this.cnpj,
      phone: phone ?? this.phone,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      isPreferred: isPreferred ?? this.isPreferred,
    );
}

class FuelRecord {

  const FuelRecord({
    required this.id,
    required this.vehicleId,
    required this.type,
    required this.fuelType,
    required this.quantity,
    required this.pricePerLiter,
    required this.totalCost,
    required this.odometerReading,
    this.fuelLevelBefore,
    this.fuelLevelAfter,
    this.fuelStationId,
    this.fuelStationName,
    this.driverId,
    this.driverName,
    this.receiptNumber,
    this.notes,
    required this.attachments,
    required this.timestamp,
    required this.createdAt,
    required this.updatedAt,
    required this.companyId,
  });

  factory FuelRecord.fromJson(Map<String, dynamic> json) {
    return FuelRecord(
      id: json['id'] ?? '',
      vehicleId: json['vehicle_id'] ?? '',
      type: FuelRecordType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => FuelRecordType.refuel,
      ),
      fuelType: FuelType.values.firstWhere(
        (e) => e.name == json['fuel_type'],
        orElse: () => FuelType.diesel,
      ),
      quantity: (json['quantity'] ?? 0.0).toDouble(),
      pricePerLiter: (json['price_per_liter'] ?? 0.0).toDouble(),
      totalCost: (json['total_cost'] ?? 0.0).toDouble(),
      odometerReading: (json['odometer_reading'] ?? 0.0).toDouble(),
      fuelLevelBefore: json['fuel_level_before']?.toDouble(),
      fuelLevelAfter: json['fuel_level_after']?.toDouble(),
      fuelStationId: json['fuel_station_id'],
      fuelStationName: json['fuel_station_name'],
      driverId: json['driver_id'],
      driverName: json['driver_name'],
      receiptNumber: json['receipt_number'],
      notes: json['notes'],
      attachments: List<String>.from(json['attachments'] ?? []),
      timestamp:
          DateTime.parse(json['timestamp'] ?? DateTime.now().toIso8601String()),
      createdAt: DateTime.parse(
          json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(
          json['updated_at'] ?? DateTime.now().toIso8601String()),
      companyId: json['company_id'] ?? '',
    );
  }
  final String id;
  final String vehicleId;
  final FuelRecordType type;
  final FuelType fuelType;
  final double quantity;
  final double pricePerLiter;
  final double totalCost;
  final double odometerReading;
  final double? fuelLevelBefore;
  final double? fuelLevelAfter;
  final String? fuelStationId;
  final String? fuelStationName;
  final String? driverId;
  final String? driverName;
  final String? receiptNumber;
  final String? notes;
  final List<String> attachments;
  final DateTime timestamp;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String companyId;

  Map<String, dynamic> toJson() => {
      'id': id,
      'vehicle_id': vehicleId,
      'type': type.name,
      'fuel_type': fuelType.name,
      'quantity': quantity,
      'price_per_liter': pricePerLiter,
      'total_cost': totalCost,
      'odometer_reading': odometerReading,
      'fuel_level_before': fuelLevelBefore,
      'fuel_level_after': fuelLevelAfter,
      'fuel_station_id': fuelStationId,
      'fuel_station_name': fuelStationName,
      'driver_id': driverId,
      'driver_name': driverName,
      'receipt_number': receiptNumber,
      'notes': notes,
      'attachments': attachments,
      'timestamp': timestamp.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'company_id': companyId,
    };

  FuelRecord copyWith({
    String? id,
    String? vehicleId,
    FuelRecordType? type,
    FuelType? fuelType,
    double? quantity,
    double? pricePerLiter,
    double? totalCost,
    double? odometerReading,
    double? fuelLevelBefore,
    double? fuelLevelAfter,
    String? fuelStationId,
    String? fuelStationName,
    String? driverId,
    String? driverName,
    String? receiptNumber,
    String? notes,
    List<String>? attachments,
    DateTime? timestamp,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? companyId,
  }) => FuelRecord(
      id: id ?? this.id,
      vehicleId: vehicleId ?? this.vehicleId,
      type: type ?? this.type,
      fuelType: fuelType ?? this.fuelType,
      quantity: quantity ?? this.quantity,
      pricePerLiter: pricePerLiter ?? this.pricePerLiter,
      totalCost: totalCost ?? this.totalCost,
      odometerReading: odometerReading ?? this.odometerReading,
      fuelLevelBefore: fuelLevelBefore ?? this.fuelLevelBefore,
      fuelLevelAfter: fuelLevelAfter ?? this.fuelLevelAfter,
      fuelStationId: fuelStationId ?? this.fuelStationId,
      fuelStationName: fuelStationName ?? this.fuelStationName,
      driverId: driverId ?? this.driverId,
      driverName: driverName ?? this.driverName,
      receiptNumber: receiptNumber ?? this.receiptNumber,
      notes: notes ?? this.notes,
      attachments: attachments ?? this.attachments,
      timestamp: timestamp ?? this.timestamp,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      companyId: companyId ?? this.companyId,
    );

  // Getters uteis
  bool get isRefuel => type == FuelRecordType.refuel;
  bool get isConsumption => type == FuelRecordType.consumption;
  bool get isLoss =>
      type == FuelRecordType.leak || type == FuelRecordType.theft;

  String get typeText => type.displayName;
  String get fuelTypeText => fuelType.displayName;

  String get quantityText => '${quantity.toStringAsFixed(2)}L';
  String get priceText => 'R\$ ${pricePerLiter.toStringAsFixed(3)}';
  String get totalCostText => 'R\$ ${totalCost.toStringAsFixed(2)}';
  String get odometerText => '${odometerReading.toStringAsFixed(0)} km';

  double get fuelLevelChange {
    if (fuelLevelBefore != null && fuelLevelAfter != null) {
      return fuelLevelAfter! - fuelLevelBefore!;
    }
    return 0;
  }

  String get fuelLevelChangeText {
    final change = fuelLevelChange;
    if (change == 0.0) return 'N/A';

    final sign = change > 0 ? '+' : '';
    return '$sign${(change * 100).toStringAsFixed(1)}%';
  }
}

class FuelConsumptionStats {

  const FuelConsumptionStats({
    required this.totalFuelConsumed,
    required this.totalDistance,
    required this.averageConsumption,
    required this.totalCost,
    required this.averagePricePerLiter,
    required this.totalRefuels,
    required this.periodStart,
    required this.periodEnd,
  });

  factory FuelConsumptionStats.fromRecords(
    List<FuelRecord> records,
    DateTime periodStart,
    DateTime periodEnd,
  ) {
    final refuelRecords = records.where((r) => r.isRefuel).toList();

    if (refuelRecords.isEmpty) {
      return FuelConsumptionStats(
        totalFuelConsumed: 0.0,
        totalDistance: 0.0,
        averageConsumption: 0.0,
        totalCost: 0.0,
        averagePricePerLiter: 0.0,
        totalRefuels: 0,
        periodStart: periodStart,
        periodEnd: periodEnd,
      );
    }

    final totalFuel = refuelRecords.fold(0.0, (sum, r) => sum + r.quantity);
    final totalCost = refuelRecords.fold(0.0, (sum, r) => sum + r.totalCost);

    // Calcular distancia percorrida
    refuelRecords
        .sort((a, b) => a.odometerReading.compareTo(b.odometerReading));
    final totalDistance = refuelRecords.last.odometerReading -
        refuelRecords.first.odometerReading;

    final averageConsumption =
        totalDistance > 0 ? totalDistance / totalFuel : 0.0;
    final averagePrice = totalFuel > 0 ? totalCost / totalFuel : 0.0;

    return FuelConsumptionStats(
      totalFuelConsumed: totalFuel,
      totalDistance: totalDistance,
      averageConsumption: averageConsumption,
      totalCost: totalCost,
      averagePricePerLiter: averagePrice,
      totalRefuels: refuelRecords.length,
      periodStart: periodStart,
      periodEnd: periodEnd,
    );
  }
  final double totalFuelConsumed;
  final double totalDistance;
  final double averageConsumption;
  final double totalCost;
  final double averagePricePerLiter;
  final int totalRefuels;
  final DateTime periodStart;
  final DateTime periodEnd;

  // Getters formatados
  String get totalFuelText => '${totalFuelConsumed.toStringAsFixed(2)}L';
  String get totalDistanceText => '${totalDistance.toStringAsFixed(0)} km';
  String get averageConsumptionText =>
      '${averageConsumption.toStringAsFixed(2)} km/L';
  String get totalCostText => 'R\$ ${totalCost.toStringAsFixed(2)}';
  String get averagePriceText =>
      'R\$ ${averagePricePerLiter.toStringAsFixed(3)}';
  String get costPerKmText => totalDistance > 0
      ? 'R\$ ${(totalCost / totalDistance).toStringAsFixed(3)}/km'
      : r'R$ 0,000/km';
}
