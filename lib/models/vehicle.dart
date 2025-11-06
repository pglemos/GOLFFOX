// ========================================
// GolfFox Vehicle Model v11.0
// Modelo de dados para veiculos
// ========================================

import 'package:latlong2/latlong.dart';
import '../core/theme/gf_tokens.dart';

enum VehicleType {
  bus,
  van,
  microbus,
  car,
  truck,
}

extension VehicleTypeExtension on VehicleType {
  String get displayName {
    switch (this) {
      case VehicleType.bus:
        return 'Onibus';
      case VehicleType.van:
        return 'Van';
      case VehicleType.microbus:
        return 'Micro-onibus';
      case VehicleType.car:
        return 'Carro';
      case VehicleType.truck:
        return 'Caminhao';
    }
  }

  int get colorValue {
    switch (this) {
      case VehicleType.bus:
        return GfTokens.primary;
      case VehicleType.van:
        return GfTokens.info;
      case VehicleType.microbus:
        return GfTokens.warning;
      case VehicleType.car:
        return GfTokens.success;
      case VehicleType.truck:
        return GfTokens.colorError;
    }
  }

  String get iconPath {
    switch (this) {
      case VehicleType.bus:
        return 'assets/icons/bus.svg';
      case VehicleType.van:
        return 'assets/icons/van.svg';
      case VehicleType.microbus:
        return 'assets/icons/microbus.svg';
      case VehicleType.car:
        return 'assets/icons/car.svg';
      case VehicleType.truck:
        return 'assets/icons/truck.svg';
    }
  }
}

enum VehicleStatus {
  active,
  inactive,
  maintenance,
  repair,
  retired,
}

extension VehicleStatusExtension on VehicleStatus {
  String get displayName {
    switch (this) {
      case VehicleStatus.active:
        return 'Ativo';
      case VehicleStatus.inactive:
        return 'Inativo';
      case VehicleStatus.maintenance:
        return 'Manutencao';
      case VehicleStatus.repair:
        return 'Reparo';
      case VehicleStatus.retired:
        return 'Aposentado';
    }
  }

  int get colorValue {
    switch (this) {
      case VehicleStatus.active:
        return GfTokens.success;
      case VehicleStatus.inactive:
        return GfTokens.colorOnSurfaceVariant;
      case VehicleStatus.maintenance:
        return GfTokens.warning;
      case VehicleStatus.repair:
        return GfTokens.colorError;
      case VehicleStatus.retired:
        return GfTokens.colorOnSurfaceVariant;
    }
  }
}

enum FuelType {
  gasoline,
  diesel,
  ethanol,
  electric,
  hybrid,
  cng,
}

extension FuelTypeExtension on FuelType {
  String get displayName {
    switch (this) {
      case FuelType.gasoline:
        return 'Gasolina';
      case FuelType.diesel:
        return 'Diesel';
      case FuelType.ethanol:
        return 'Etanol';
      case FuelType.electric:
        return 'Eletrico';
      case FuelType.hybrid:
        return 'Hibrido';
      case FuelType.cng:
        return 'GNV';
    }
  }

  int get colorValue {
    switch (this) {
      case FuelType.gasoline:
        return GfTokens.warning;
      case FuelType.diesel:
        return GfTokens.info;
      case FuelType.ethanol:
        return GfTokens.success;
      case FuelType.electric:
        return GfTokens.primary;
      case FuelType.hybrid:
        return GfTokens.colorSecondary;
      case FuelType.cng:
        return GfTokens.accent;
    }
  }
}

class VehicleSpecifications {

  const VehicleSpecifications({
    required this.capacity,
    required this.engineSize,
    required this.year,
    required this.manufacturer,
    required this.model,
    required this.color,
    required this.fuelTankCapacity,
    required this.weight,
    required this.length,
    required this.width,
    required this.height,
  });

  factory VehicleSpecifications.fromJson(Map<String, dynamic> json) {
    return VehicleSpecifications(
      capacity: json['capacity'] ?? 0,
      engineSize: (json['engine_size'] ?? 0.0).toDouble(),
      year: json['year'] ?? DateTime.now().year,
      manufacturer: json['manufacturer'] ?? '',
      model: json['model'] ?? '',
      color: json['color'] ?? '',
      fuelTankCapacity: (json['fuel_tank_capacity'] ?? 0.0).toDouble(),
      weight: (json['weight'] ?? 0.0).toDouble(),
      length: (json['length'] ?? 0.0).toDouble(),
      width: (json['width'] ?? 0.0).toDouble(),
      height: (json['height'] ?? 0.0).toDouble(),
    );
  }
  final int capacity;
  final double engineSize;
  final int year;
  final String manufacturer;
  final String model;
  final String color;
  final double fuelTankCapacity;
  final double weight;
  final double length;
  final double width;
  final double height;

  Map<String, dynamic> toJson() => {
      'capacity': capacity,
      'engine_size': engineSize,
      'year': year,
      'manufacturer': manufacturer,
      'model': model,
      'color': color,
      'fuel_tank_capacity': fuelTankCapacity,
      'weight': weight,
      'length': length,
      'width': width,
      'height': height,
    };

  VehicleSpecifications copyWith({
    int? capacity,
    double? engineSize,
    int? year,
    String? manufacturer,
    String? model,
    String? color,
    double? fuelTankCapacity,
    double? weight,
    double? length,
    double? width,
    double? height,
  }) => VehicleSpecifications(
      capacity: capacity ?? this.capacity,
      engineSize: engineSize ?? this.engineSize,
      year: year ?? this.year,
      manufacturer: manufacturer ?? this.manufacturer,
      model: model ?? this.model,
      color: color ?? this.color,
      fuelTankCapacity: fuelTankCapacity ?? this.fuelTankCapacity,
      weight: weight ?? this.weight,
      length: length ?? this.length,
      width: width ?? this.width,
      height: height ?? this.height,
    );
}

class VehicleDocuments {

  const VehicleDocuments({
    this.licensePlate,
    this.chassisNumber,
    this.renavam,
    this.licenseExpiryDate,
    this.inspectionExpiryDate,
    this.insuranceExpiryDate,
    this.insuranceCompany,
    this.insurancePolicyNumber,
  });

  factory VehicleDocuments.fromJson(Map<String, dynamic> json) {
    return VehicleDocuments(
      licensePlate: json['license_plate'],
      chassisNumber: json['chassis_number'],
      renavam: json['renavam'],
      licenseExpiryDate: json['license_expiry_date'] != null
          ? DateTime.parse(json['license_expiry_date'])
          : null,
      inspectionExpiryDate: json['inspection_expiry_date'] != null
          ? DateTime.parse(json['inspection_expiry_date'])
          : null,
      insuranceExpiryDate: json['insurance_expiry_date'] != null
          ? DateTime.parse(json['insurance_expiry_date'])
          : null,
      insuranceCompany: json['insurance_company'],
      insurancePolicyNumber: json['insurance_policy_number'],
    );
  }
  final String? licensePlate;
  final String? chassisNumber;
  final String? renavam;
  final DateTime? licenseExpiryDate;
  final DateTime? inspectionExpiryDate;
  final DateTime? insuranceExpiryDate;
  final String? insuranceCompany;
  final String? insurancePolicyNumber;

  Map<String, dynamic> toJson() => {
      'license_plate': licensePlate,
      'chassis_number': chassisNumber,
      'renavam': renavam,
      'license_expiry_date': licenseExpiryDate?.toIso8601String(),
      'inspection_expiry_date': inspectionExpiryDate?.toIso8601String(),
      'insurance_expiry_date': insuranceExpiryDate?.toIso8601String(),
      'insurance_company': insuranceCompany,
      'insurance_policy_number': insurancePolicyNumber,
    };

  VehicleDocuments copyWith({
    String? licensePlate,
    String? chassisNumber,
    String? renavam,
    DateTime? licenseExpiryDate,
    DateTime? inspectionExpiryDate,
    DateTime? insuranceExpiryDate,
    String? insuranceCompany,
    String? insurancePolicyNumber,
  }) => VehicleDocuments(
      licensePlate: licensePlate ?? this.licensePlate,
      chassisNumber: chassisNumber ?? this.chassisNumber,
      renavam: renavam ?? this.renavam,
      licenseExpiryDate: licenseExpiryDate ?? this.licenseExpiryDate,
      inspectionExpiryDate: inspectionExpiryDate ?? this.inspectionExpiryDate,
      insuranceExpiryDate: insuranceExpiryDate ?? this.insuranceExpiryDate,
      insuranceCompany: insuranceCompany ?? this.insuranceCompany,
      insurancePolicyNumber:
          insurancePolicyNumber ?? this.insurancePolicyNumber,
    );

  // Getters para verificar vencimentos
  bool get isLicenseExpired =>
      licenseExpiryDate?.isBefore(DateTime.now()) ?? false;
  bool get isInspectionExpired =>
      inspectionExpiryDate?.isBefore(DateTime.now()) ?? false;
  bool get isInsuranceExpired =>
      insuranceExpiryDate?.isBefore(DateTime.now()) ?? false;

  // Getters para verificar se está expirando (próximo de vencer)
  bool get isLicenseExpiring {
    if (licenseExpiryDate == null) return false;
    final now = DateTime.now();
    const warningPeriod = Duration(days: 30);
    return licenseExpiryDate!.isAfter(now) &&
        licenseExpiryDate!.isBefore(now.add(warningPeriod));
  }

  bool get isInspectionExpiring {
    if (inspectionExpiryDate == null) return false;
    final now = DateTime.now();
    const warningPeriod = Duration(days: 30);
    return inspectionExpiryDate!.isAfter(now) &&
        inspectionExpiryDate!.isBefore(now.add(warningPeriod));
  }

  bool get isInsuranceExpiring {
    if (insuranceExpiryDate == null) return false;
    final now = DateTime.now();
    const warningPeriod = Duration(days: 30);
    return insuranceExpiryDate!.isAfter(now) &&
        insuranceExpiryDate!.isBefore(now.add(warningPeriod));
  }

  // Getters para formatação de datas
  String get licenseExpiryFormatted => licenseExpiryDate != null
      ? '${licenseExpiryDate!.day.toString().padLeft(2, '0')}/${licenseExpiryDate!.month.toString().padLeft(2, '0')}/${licenseExpiryDate!.year}'
      : 'N/A';

  String get inspectionExpiryFormatted => inspectionExpiryDate != null
      ? '${inspectionExpiryDate!.day.toString().padLeft(2, '0')}/${inspectionExpiryDate!.month.toString().padLeft(2, '0')}/${inspectionExpiryDate!.year}'
      : 'N/A';

  String get insuranceExpiryFormatted => insuranceExpiryDate != null
      ? '${insuranceExpiryDate!.day.toString().padLeft(2, '0')}/${insuranceExpiryDate!.month.toString().padLeft(2, '0')}/${insuranceExpiryDate!.year}'
      : 'N/A';

  bool get hasExpiringDocuments {
    final now = DateTime.now();
    const warningPeriod = Duration(days: 30);

    return (licenseExpiryDate?.isBefore(now.add(warningPeriod)) ?? false) ||
        (inspectionExpiryDate?.isBefore(now.add(warningPeriod)) ?? false) ||
        (insuranceExpiryDate?.isBefore(now.add(warningPeriod)) ?? false);
  }
}

class Vehicle {

  const Vehicle({
    required this.id,
    required this.name,
    required this.type,
    required this.status,
    required this.fuelType,
    required this.specifications,
    required this.documents,
    this.currentDriverId,
    this.currentRouteId,
    this.currentPosition,
    this.currentFuelLevel,
    required this.odometer,
    this.lastMaintenanceDate,
    this.nextMaintenanceDate,
    this.maintenanceOdometer,
    required this.features,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    required this.companyId,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      type: VehicleType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => VehicleType.bus,
      ),
      status: VehicleStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => VehicleStatus.inactive,
      ),
      fuelType: FuelType.values.firstWhere(
        (e) => e.name == json['fuel_type'],
        orElse: () => FuelType.diesel,
      ),
      specifications:
          VehicleSpecifications.fromJson(json['specifications'] ?? {}),
      documents: VehicleDocuments.fromJson(json['documents'] ?? {}),
      currentDriverId: json['current_driver_id'],
      currentRouteId: json['current_route_id'],
      currentPosition: json['current_position'] != null
          ? LatLng(
              json['current_position']['lat'].toDouble(),
              json['current_position']['lng'].toDouble(),
            )
          : null,
      currentFuelLevel: json['current_fuel_level']?.toDouble(),
      odometer: (json['odometer'] ?? 0.0).toDouble(),
      lastMaintenanceDate: json['last_maintenance_date'] != null
          ? DateTime.parse(json['last_maintenance_date'])
          : null,
      nextMaintenanceDate: json['next_maintenance_date'] != null
          ? DateTime.parse(json['next_maintenance_date'])
          : null,
      maintenanceOdometer: json['maintenance_odometer']?.toDouble(),
      features: List<String>.from(json['features'] ?? []),
      notes: json['notes'],
      createdAt: DateTime.parse(
          json['created_at'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(
          json['updated_at'] ?? DateTime.now().toIso8601String()),
      companyId: json['company_id'] ?? '',
    );
  }
  final String id;
  final String name;
  final VehicleType type;
  final VehicleStatus status;
  final FuelType fuelType;
  final VehicleSpecifications specifications;
  final VehicleDocuments documents;
  final String? currentDriverId;
  final String? currentRouteId;
  final LatLng? currentPosition;
  final double? currentFuelLevel;
  final double odometer;
  final DateTime? lastMaintenanceDate;
  final DateTime? nextMaintenanceDate;
  final double? maintenanceOdometer;
  final List<String> features;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String companyId;

  Map<String, dynamic> toJson() => {
      'id': id,
      'name': name,
      'type': type.name,
      'status': status.name,
      'fuel_type': fuelType.name,
      'specifications': specifications.toJson(),
      'documents': documents.toJson(),
      'current_driver_id': currentDriverId,
      'current_route_id': currentRouteId,
      'current_position': currentPosition != null
          ? {
              'lat': currentPosition!.latitude,
              'lng': currentPosition!.longitude,
            }
          : null,
      'current_fuel_level': currentFuelLevel,
      'odometer': odometer,
      'last_maintenance_date': lastMaintenanceDate?.toIso8601String(),
      'next_maintenance_date': nextMaintenanceDate?.toIso8601String(),
      'maintenance_odometer': maintenanceOdometer,
      'features': features,
      'notes': notes,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'company_id': companyId,
    };

  Vehicle copyWith({
    String? id,
    String? name,
    VehicleType? type,
    VehicleStatus? status,
    FuelType? fuelType,
    VehicleSpecifications? specifications,
    VehicleDocuments? documents,
    String? currentDriverId,
    String? currentRouteId,
    LatLng? currentPosition,
    double? currentFuelLevel,
    double? odometer,
    DateTime? lastMaintenanceDate,
    DateTime? nextMaintenanceDate,
    double? maintenanceOdometer,
    List<String>? features,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? companyId,
  }) => Vehicle(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      status: status ?? this.status,
      fuelType: fuelType ?? this.fuelType,
      specifications: specifications ?? this.specifications,
      documents: documents ?? this.documents,
      currentDriverId: currentDriverId ?? this.currentDriverId,
      currentRouteId: currentRouteId ?? this.currentRouteId,
      currentPosition: currentPosition ?? this.currentPosition,
      currentFuelLevel: currentFuelLevel ?? this.currentFuelLevel,
      odometer: odometer ?? this.odometer,
      lastMaintenanceDate: lastMaintenanceDate ?? this.lastMaintenanceDate,
      nextMaintenanceDate: nextMaintenanceDate ?? this.nextMaintenanceDate,
      maintenanceOdometer: maintenanceOdometer ?? this.maintenanceOdometer,
      features: features ?? this.features,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      companyId: companyId ?? this.companyId,
    );

  // Getters uteis
  bool get isActive => status == VehicleStatus.active;
  bool get isAvailable =>
      status == VehicleStatus.active && currentRouteId == null;
  bool get isInUse => currentRouteId != null;
  bool get needsMaintenance =>
      nextMaintenanceDate?.isBefore(DateTime.now()) ?? false;
  bool get hasLowFuel => currentFuelLevel != null && currentFuelLevel! < 0.2;
  bool get hasExpiringDocuments => documents.hasExpiringDocuments;

  String get displayName => '$name (${documents.licensePlate ?? 'Sem placa'})';
  String get statusText => status.displayName;
  String get typeText => type.displayName;
  String get fuelText => fuelType.displayName;

  double get fuelPercentage => currentFuelLevel ?? 0.0;

  String get capacityText => '${specifications.capacity} passageiros';
  String get yearText => specifications.year.toString();
  String get manufacturerText =>
      '${specifications.manufacturer} ${specifications.model}';
  String get formattedOdometer => '${odometer.toStringAsFixed(0)} km';
}
