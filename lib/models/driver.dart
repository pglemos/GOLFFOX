// ========================================
// GolfFox Driver Model v11.0
// Modelo de dados para motoristas
// ========================================

import 'package:flutter/material.dart';

enum DriverStatus {
  active,
  inactive,
  suspended,
  onTrip,
  available,
  unavailable,
  onBreak,
}

extension DriverStatusExtension on DriverStatus {
  String get displayName {
    switch (this) {
      case DriverStatus.active:
        return 'Ativo';
      case DriverStatus.inactive:
        return 'Inativo';
      case DriverStatus.suspended:
        return 'Suspenso';
      case DriverStatus.onTrip:
        return 'Em Viagem';
      case DriverStatus.available:
        return 'Disponivel';
      case DriverStatus.unavailable:
        return 'Indisponivel';
      case DriverStatus.onBreak:
        return 'Em Pausa';
    }
  }

  Color get colorValue {
    switch (this) {
      case DriverStatus.active:
      case DriverStatus.available:
        return const Color(0xFF10B981); // Green
      case DriverStatus.onTrip:
        return const Color(0xFF3B82F6); // Blue
      case DriverStatus.onBreak:
        return const Color(0xFFF59E0B); // Amber
      case DriverStatus.unavailable:
        return const Color(0xFF6B7280); // Gray
      case DriverStatus.inactive:
        return const Color(0xFF9CA3AF); // Light Gray
      case DriverStatus.suspended:
        return const Color(0xFFEF4444); // Red
    }
  }

  IconData get iconData {
    switch (this) {
      case DriverStatus.active:
      case DriverStatus.available:
        return Icons.check_circle;
      case DriverStatus.onTrip:
        return Icons.directions_car;
      case DriverStatus.onBreak:
        return Icons.pause_circle;
      case DriverStatus.unavailable:
        return Icons.do_not_disturb;
      case DriverStatus.inactive:
        return Icons.circle_outlined;
      case DriverStatus.suspended:
        return Icons.block;
    }
  }
}

enum LicenseCategory {
  a,
  b,
  c,
  d,
  e,
  ab,
  ac,
  ad,
  ae,
}

extension LicenseCategoryExtension on LicenseCategory {
  String get displayName {
    switch (this) {
      case LicenseCategory.a:
        return 'Categoria A';
      case LicenseCategory.b:
        return 'Categoria B';
      case LicenseCategory.c:
        return 'Categoria C';
      case LicenseCategory.d:
        return 'Categoria D';
      case LicenseCategory.e:
        return 'Categoria E';
      case LicenseCategory.ab:
        return 'Categoria AB';
      case LicenseCategory.ac:
        return 'Categoria AC';
      case LicenseCategory.ad:
        return 'Categoria AD';
      case LicenseCategory.ae:
        return 'Categoria AE';
    }
  }

  String get description {
    switch (this) {
      case LicenseCategory.a:
        return 'Motocicletas, motonetas e triciclos';
      case LicenseCategory.b:
        return 'Automoveis e caminhonetes ate 3.500kg';
      case LicenseCategory.c:
        return 'Veiculos de carga ate 6.000kg';
      case LicenseCategory.d:
        return 'Onibus e micro-onibus';
      case LicenseCategory.e:
        return 'Veiculos com reboque acima de 6.000kg';
      case LicenseCategory.ab:
        return 'Categorias A e B';
      case LicenseCategory.ac:
        return 'Categorias A e C';
      case LicenseCategory.ad:
        return 'Categorias A e D';
      case LicenseCategory.ae:
        return 'Categorias A e E';
    }
  }
}

class DriverLicense {
  final String number;
  final LicenseCategory category;
  final DateTime issueDate;
  final DateTime expiryDate;
  final String issuingAuthority;
  final bool isValid;

  const DriverLicense({
    required this.number,
    required this.category,
    required this.issueDate,
    required this.expiryDate,
    required this.issuingAuthority,
    this.isValid = true,
  });

  factory DriverLicense.fromJson(Map<String, dynamic> json) {
    return DriverLicense(
      number: json['number'] as String,
      category: LicenseCategory.values.firstWhere(
        (e) => e.name == json['category'],
        orElse: () => LicenseCategory.b,
      ),
      issueDate: DateTime.parse(json['issueDate'] as String),
      expiryDate: DateTime.parse(json['expiryDate'] as String),
      issuingAuthority: json['issuingAuthority'] as String,
      isValid: json['isValid'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'number': number,
      'category': category.name,
      'issueDate': issueDate.toIso8601String(),
      'expiryDate': expiryDate.toIso8601String(),
      'issuingAuthority': issuingAuthority,
      'isValid': isValid,
    };
  }

  DriverLicense copyWith({
    String? number,
    LicenseCategory? category,
    DateTime? issueDate,
    DateTime? expiryDate,
    String? issuingAuthority,
    bool? isValid,
  }) {
    return DriverLicense(
      number: number ?? this.number,
      category: category ?? this.category,
      issueDate: issueDate ?? this.issueDate,
      expiryDate: expiryDate ?? this.expiryDate,
      issuingAuthority: issuingAuthority ?? this.issuingAuthority,
      isValid: isValid ?? this.isValid,
    );
  }

  bool get isExpired => DateTime.now().isAfter(expiryDate);
  bool get isExpiringSoon =>
      DateTime.now().add(const Duration(days: 30)).isAfter(expiryDate);

  int get daysUntilExpiry => expiryDate.difference(DateTime.now()).inDays;
}

class DriverCertification {
  final String id;
  final String name;
  final String description;
  final DateTime issueDate;
  final DateTime? expiryDate;
  final String issuingOrganization;
  final String? certificateNumber;
  final bool isActive;

  const DriverCertification({
    required this.id,
    required this.name,
    required this.description,
    required this.issueDate,
    this.expiryDate,
    required this.issuingOrganization,
    this.certificateNumber,
    this.isActive = true,
  });

  factory DriverCertification.fromJson(Map<String, dynamic> json) {
    return DriverCertification(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      issueDate: DateTime.parse(json['issueDate'] as String),
      expiryDate: json['expiryDate'] != null
          ? DateTime.parse(json['expiryDate'] as String)
          : null,
      issuingOrganization: json['issuingOrganization'] as String,
      certificateNumber: json['certificateNumber'] as String?,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'issueDate': issueDate.toIso8601String(),
      'expiryDate': expiryDate?.toIso8601String(),
      'issuingOrganization': issuingOrganization,
      'certificateNumber': certificateNumber,
      'isActive': isActive,
    };
  }

  bool get isExpired =>
      expiryDate != null && DateTime.now().isAfter(expiryDate!);
  bool get isExpiringSoon =>
      expiryDate != null &&
      DateTime.now().add(const Duration(days: 30)).isAfter(expiryDate!);
}

class DriverRating {
  final String id;
  final String tripId;
  final String passengerId;
  final String? passengerName;
  final double rating;
  final String? comment;
  final DateTime createdAt;
  final List<String> tags;

  const DriverRating({
    required this.id,
    required this.tripId,
    required this.passengerId,
    this.passengerName,
    required this.rating,
    this.comment,
    required this.createdAt,
    this.tags = const [],
  });

  factory DriverRating.fromJson(Map<String, dynamic> json) {
    return DriverRating(
      id: json['id'] as String,
      tripId: json['tripId'] as String,
      passengerId: json['passengerId'] as String,
      passengerName: json['passengerName'] as String?,
      rating: (json['rating'] as num).toDouble(),
      comment: json['comment'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      tags: List<String>.from(json['tags'] as List? ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tripId': tripId,
      'passengerId': passengerId,
      'passengerName': passengerName,
      'rating': rating,
      'comment': comment,
      'createdAt': createdAt.toIso8601String(),
      'tags': tags,
    };
  }
}

class DriverStats {
  final int totalTrips;
  final double totalDistance;
  final Duration totalDrivingTime;
  final double averageRating;
  final int totalRatings;
  final double fuelEfficiency;
  final int safetyScore;
  final DateTime lastTripDate;

  const DriverStats({
    this.totalTrips = 0,
    this.totalDistance = 0.0,
    this.totalDrivingTime = Duration.zero,
    this.averageRating = 0.0,
    this.totalRatings = 0,
    this.fuelEfficiency = 0.0,
    this.safetyScore = 100,
    required this.lastTripDate,
  });

  factory DriverStats.fromJson(Map<String, dynamic> json) {
    return DriverStats(
      totalTrips: json['totalTrips'] as int? ?? 0,
      totalDistance: (json['totalDistance'] as num?)?.toDouble() ?? 0.0,
      totalDrivingTime: Duration(
        milliseconds: json['totalDrivingTimeMs'] as int? ?? 0,
      ),
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0.0,
      totalRatings: json['totalRatings'] as int? ?? 0,
      fuelEfficiency: (json['fuelEfficiency'] as num?)?.toDouble() ?? 0.0,
      safetyScore: json['safetyScore'] as int? ?? 100,
      lastTripDate: json['lastTripDate'] != null
          ? DateTime.parse(json['lastTripDate'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalTrips': totalTrips,
      'totalDistance': totalDistance,
      'totalDrivingTimeMs': totalDrivingTime.inMilliseconds,
      'averageRating': averageRating,
      'totalRatings': totalRatings,
      'fuelEfficiency': fuelEfficiency,
      'safetyScore': safetyScore,
      'lastTripDate': lastTripDate.toIso8601String(),
    };
  }

  String get formattedDistance {
    if (totalDistance < 1000) {
      return '${totalDistance.toStringAsFixed(0)} m';
    }
    return '${(totalDistance / 1000).toStringAsFixed(1)} km';
  }

  String get formattedDrivingTime {
    final hours = totalDrivingTime.inHours;
    final minutes = totalDrivingTime.inMinutes % 60;

    if (hours > 0) {
      return '${hours}h ${minutes}min';
    }
    return '${minutes}min';
  }

  String get ratingDisplay => totalRatings > 0
      ? '${averageRating.toStringAsFixed(1)} (${totalRatings})'
      : 'Sem avaliacoes';
}

class Driver {
  final String id;
  final String name;
  final String email;
  final String? phone;
  final String? cpf;
  final DateTime? birthDate;
  final String? address;
  final String? profileImageUrl;
  final String? emergencyContact;
  final String? emergencyPhone;
  final DriverStatus status;
  final DriverLicense license;
  final List<DriverCertification> certifications;
  final List<DriverRating> ratings;
  final DriverStats stats;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? currentVehicleId;
  final Map<String, dynamic> preferences;
  final List<String> availableHours;
  final bool isOnline;
  final DateTime? lastSeenAt;

  const Driver({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.cpf,
    this.birthDate,
    this.address,
    this.profileImageUrl,
    this.emergencyContact,
    this.emergencyPhone,
    this.status = DriverStatus.inactive,
    required this.license,
    this.certifications = const [],
    this.ratings = const [],
    DriverStats? stats,
    DateTime? createdAt,
    DateTime? updatedAt,
    this.currentVehicleId,
    this.preferences = const {},
    this.availableHours = const [],
    this.isOnline = false,
    this.lastSeenAt,
  })  : createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now(),
        stats = stats ??
            DriverStats(
              totalTrips: 0,
              totalDistance: 0.0,
              totalDrivingTime: Duration.zero,
              averageRating: 0.0,
              totalRatings: 0,
              fuelEfficiency: 0.0,
              safetyScore: 0.0,
              lastTripDate: DateTime.now(),
            );

  factory Driver.fromJson(Map<String, dynamic> json) {
    return Driver(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      cpf: json['cpf'] as String?,
      birthDate: json['birthDate'] != null
          ? DateTime.parse(json['birthDate'] as String)
          : null,
      address: json['address'] as String?,
      profileImageUrl: json['profileImageUrl'] as String?,
      status: DriverStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => DriverStatus.inactive,
      ),
      license: DriverLicense.fromJson(json['license'] as Map<String, dynamic>),
      certifications: (json['certifications'] as List?)
              ?.map((cert) =>
                  DriverCertification.fromJson(cert as Map<String, dynamic>))
              .toList() ??
          [],
      ratings: (json['ratings'] as List?)
              ?.map((rating) =>
                  DriverRating.fromJson(rating as Map<String, dynamic>))
              .toList() ??
          [],
      stats: json['stats'] != null
          ? DriverStats.fromJson(json['stats'] as Map<String, dynamic>)
          : DriverStats(lastTripDate: DateTime.now()),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      currentVehicleId: json['currentVehicleId'] as String?,
      preferences: Map<String, dynamic>.from(json['preferences'] as Map? ?? {}),
      availableHours: List<String>.from(json['availableHours'] as List? ?? []),
      isOnline: json['isOnline'] as bool? ?? false,
      lastSeenAt: json['lastSeenAt'] != null
          ? DateTime.parse(json['lastSeenAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'cpf': cpf,
      'birthDate': birthDate?.toIso8601String(),
      'address': address,
      'profileImageUrl': profileImageUrl,
      'status': status.name,
      'license': license.toJson(),
      'certifications': certifications.map((cert) => cert.toJson()).toList(),
      'ratings': ratings.map((rating) => rating.toJson()).toList(),
      'stats': stats.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'currentVehicleId': currentVehicleId,
      'preferences': preferences,
      'availableHours': availableHours,
      'isOnline': isOnline,
      'lastSeenAt': lastSeenAt?.toIso8601String(),
    };
  }

  Driver copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    String? cpf,
    DateTime? birthDate,
    String? address,
    String? profileImageUrl,
    DriverStatus? status,
    DriverLicense? license,
    List<DriverCertification>? certifications,
    List<DriverRating>? ratings,
    DriverStats? stats,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? currentVehicleId,
    Map<String, dynamic>? preferences,
    List<String>? availableHours,
    bool? isOnline,
    DateTime? lastSeenAt,
  }) {
    return Driver(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      cpf: cpf ?? this.cpf,
      birthDate: birthDate ?? this.birthDate,
      address: address ?? this.address,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      status: status ?? this.status,
      license: license ?? this.license,
      certifications: certifications ?? this.certifications,
      ratings: ratings ?? this.ratings,
      stats: stats ?? this.stats,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      currentVehicleId: currentVehicleId ?? this.currentVehicleId,
      preferences: preferences ?? this.preferences,
      availableHours: availableHours ?? this.availableHours,
      isOnline: isOnline ?? this.isOnline,
      lastSeenAt: lastSeenAt ?? this.lastSeenAt,
    );
  }

  // Getters uteis
  bool get isAvailable => status == DriverStatus.available && isOnline;
  bool get isActive =>
      status == DriverStatus.active || status == DriverStatus.available;
  bool get hasExpiredLicense => license.isExpired;
  bool get hasExpiringSoonLicense => license.isExpiringSoon;
  bool get hasExpiredCertifications =>
      certifications.any((cert) => cert.isExpired);
  bool get hasExpiringSoonCertifications =>
      certifications.any((cert) => cert.isExpiringSoon);

  int get age {
    if (birthDate == null) return 0;
    final now = DateTime.now();
    int age = now.year - birthDate!.year;
    if (now.month < birthDate!.month ||
        (now.month == birthDate!.month && now.day < birthDate!.day)) {
      age--;
    }
    return age;
  }

  String get formattedPhone {
    if (phone == null || phone!.isEmpty) return '';
    final cleaned = phone!.replaceAll(RegExp(r'[^\d]'), '');
    if (cleaned.length == 11) {
      return '(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}';
    } else if (cleaned.length == 10) {
      return '(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}';
    }
    return phone!;
  }

  String get initials {
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '';
  }

  List<String> get alerts {
    final alerts = <String>[];

    if (hasExpiredLicense) {
      alerts.add('CNH vencida');
    } else if (hasExpiringSoonLicense) {
      alerts.add('CNH vencendo em ${license.daysUntilExpiry} dias');
    }

    if (hasExpiredCertifications) {
      alerts.add('Certificacoes vencidas');
    } else if (hasExpiringSoonCertifications) {
      alerts.add('Certificacoes vencendo');
    }

    if (status == DriverStatus.suspended) {
      alerts.add('Motorista suspenso');
    }

    return alerts;
  }

  bool get hasAlerts => alerts.isNotEmpty;
}
