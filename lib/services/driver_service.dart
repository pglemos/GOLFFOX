// ========================================
// GolfFox Driver Service v11.0
// Servico para gerenciar motoristas
// ========================================

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/driver.dart';

class DriverFilters {

  const DriverFilters({
    this.search,
    this.status,
    this.licenseCategory,
    this.hasAlerts,
    this.isOnline,
    this.hasExpiredDocuments,
    this.minRating,
    this.minTrips,
  });
  static const _unset = Object();

  final String? search;
  final DriverStatus? status;
  final LicenseCategory? licenseCategory;
  final bool? hasAlerts;
  final bool? isOnline;
  final bool? hasExpiredDocuments;
  final double? minRating;
  final int? minTrips;

  DriverFilters copyWith({
    Object? search = _unset,
    Object? status = _unset,
    Object? licenseCategory = _unset,
    Object? hasAlerts = _unset,
    Object? isOnline = _unset,
    Object? hasExpiredDocuments = _unset,
    Object? minRating = _unset,
    Object? minTrips = _unset,
  }) => DriverFilters(
      search: search == _unset ? this.search : search as String?,
      status: status == _unset ? this.status : status as DriverStatus?,
      licenseCategory: licenseCategory == _unset
          ? this.licenseCategory
          : licenseCategory as LicenseCategory?,
      hasAlerts: hasAlerts == _unset ? this.hasAlerts : hasAlerts as bool?,
      isOnline: isOnline == _unset ? this.isOnline : isOnline as bool?,
      hasExpiredDocuments: hasExpiredDocuments == _unset
          ? this.hasExpiredDocuments
          : hasExpiredDocuments as bool?,
      minRating: minRating == _unset ? this.minRating : minRating as double?,
      minTrips: minTrips == _unset ? this.minTrips : minTrips as int?,
    );

  bool get hasActiveFilters =>
      search?.isNotEmpty ?? false ||
      status != null ||
      licenseCategory != null ||
      hasAlerts != null ||
      isOnline != null ||
      hasExpiredDocuments != null ||
      minRating != null ||
      minTrips != null;

  int get activeFiltersCount {
    var count = 0;
    if (search?.isNotEmpty ?? false) count++;
    if (status != null) count++;
    if (licenseCategory != null) count++;
    if (hasAlerts != null) count++;
    if (isOnline != null) count++;
    if (hasExpiredDocuments != null) count++;
    if (minRating != null) count++;
    if (minTrips != null) count++;
    return count;
  }
}

class DriversOverviewStats {

  const DriversOverviewStats({
    this.totalDrivers = 0,
    this.activeDrivers = 0,
    this.availableDrivers = 0,
    this.onlineDrivers = 0,
    this.driversWithAlerts = 0,
    this.averageRating = 0.0,
    this.totalTrips = 0,
  });
  final int totalDrivers;
  final int activeDrivers;
  final int availableDrivers;
  final int onlineDrivers;
  final int driversWithAlerts;
  final double averageRating;
  final int totalTrips;
}

class DriverService extends StateNotifier<AsyncValue<List<Driver>>> {
  DriverService() : super(const AsyncValue.loading()) {
    _loadDrivers();
  }

  final List<Driver> _drivers = [];
  DriverFilters _currentFilters = const DriverFilters();

  // Dados simulados para desenvolvimento
  void _loadDrivers() {
    try {
      _drivers.clear();
      _drivers.addAll(_generateMockDrivers());
      _applyFilters();
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  List<Driver> _generateMockDrivers() => [
      Driver(
        id: '1',
        name: 'Joao Silva',
        email: 'joao.silva@golffox.com',
        phone: '(11) 99999-1111',
        cpf: '123.456.789-01',
        birthDate: DateTime(1985, 5, 15),
        address: 'Rua das Flores, 123 - Sao Paulo, SP',
        status: DriverStatus.available,
        isOnline: true,
        license: DriverLicense(
          number: '12345678901',
          category: LicenseCategory.d,
          issueDate: DateTime(2020, 1, 15),
          expiryDate: DateTime(2025, 1, 15),
          issuingAuthority: 'DETRAN-SP',
        ),
        certifications: [
          DriverCertification(
            id: '1',
            name: 'Transporte Escolar',
            description: 'Certificacao para transporte de estudantes',
            issueDate: DateTime(2022, 3, 10),
            expiryDate: DateTime(2024, 3, 10),
            issuingOrganization: 'DETRAN-SP',
            certificateNumber: 'TE-2022-001',
          ),
        ],
        ratings: [
          DriverRating(
            id: '1',
            tripId: 'trip_1',
            passengerId: 'pass_1',
            passengerName: 'Maria Santos',
            rating: 4.8,
            comment: 'Excelente motorista, muito pontual!',
            createdAt: DateTime.now().subtract(const Duration(days: 2)),
            tags: ['pontual', 'educado'],
          ),
        ],
        stats: DriverStats(
          totalTrips: 156,
          totalDistance: 12500.0,
          totalDrivingTime: const Duration(hours: 320),
          averageRating: 4.7,
          totalRatings: 142,
          fuelEfficiency: 8.5,
          safetyScore: 95,
          lastTripDate: DateTime.now().subtract(const Duration(hours: 1)),
        ),
        currentVehicleId: 'vehicle_1',
        availableHours: ['06:00-18:00'],
        lastSeenAt: DateTime.now().subtract(const Duration(minutes: 5)),
      ),
      Driver(
        id: '2',
        name: 'Maria Oliveira',
        email: 'maria.oliveira@golffox.com',
        phone: '(11) 99999-2222',
        cpf: '987.654.321-02',
        birthDate: DateTime(1990, 8, 22),
        address: 'Av. Paulista, 456 - Sao Paulo, SP',
        status: DriverStatus.onTrip,
        isOnline: true,
        license: DriverLicense(
          number: '98765432109',
          category: LicenseCategory.d,
          issueDate: DateTime(2019, 6, 20),
          expiryDate: DateTime(2024, 6, 20),
          issuingAuthority: 'DETRAN-SP',
        ),
        certifications: [
          DriverCertification(
            id: '2',
            name: 'Primeiros Socorros',
            description: 'Curso de primeiros socorros para motoristas',
            issueDate: DateTime(2023, 1, 15),
            expiryDate: DateTime(2025, 1, 15),
            issuingOrganization: 'Cruz Vermelha',
            certificateNumber: 'PS-2023-045',
          ),
        ],
        ratings: [
          DriverRating(
            id: '2',
            tripId: 'trip_2',
            passengerId: 'pass_2',
            passengerName: 'Carlos Lima',
            rating: 4.9,
            comment: 'Motorista exemplar!',
            createdAt: DateTime.now().subtract(const Duration(days: 1)),
            tags: ['cuidadoso', 'profissional'],
          ),
        ],
        stats: DriverStats(
          totalTrips: 203,
          totalDistance: 18750.0,
          totalDrivingTime: const Duration(hours: 445),
          averageRating: 4.8,
          totalRatings: 198,
          fuelEfficiency: 9.2,
          safetyScore: 98,
          lastTripDate: DateTime.now().subtract(const Duration(hours: 3)),
        ),
        currentVehicleId: 'vehicle_2',
        availableHours: ['05:30-17:30'],
        lastSeenAt: DateTime.now().subtract(const Duration(minutes: 2)),
      ),
      Driver(
        id: '3',
        name: 'Pedro Santos',
        email: 'pedro.santos@golffox.com',
        phone: '(11) 99999-3333',
        cpf: '456.789.123-03',
        birthDate: DateTime(1982, 12, 3),
        address: 'Rua Augusta, 789 - Sao Paulo, SP',
        status: DriverStatus.suspended,
        isOnline: false,
        license: DriverLicense(
          number: '45678912345',
          category: LicenseCategory.d,
          issueDate: DateTime(2018, 9, 10),
          expiryDate: DateTime(2023, 9, 10), // Vencida
          issuingAuthority: 'DETRAN-SP',
        ),
        certifications: [],
        ratings: [
          DriverRating(
            id: '3',
            tripId: 'trip_3',
            passengerId: 'pass_3',
            passengerName: 'Ana Costa',
            rating: 3.2,
            comment: 'Precisa melhorar a pontualidade.',
            createdAt: DateTime.now().subtract(const Duration(days: 10)),
            tags: ['atrasado'],
          ),
        ],
        stats: DriverStats(
          totalTrips: 89,
          totalDistance: 7200.0,
          totalDrivingTime: const Duration(hours: 180),
          averageRating: 3.5,
          totalRatings: 76,
          fuelEfficiency: 7.8,
          safetyScore: 72,
          lastTripDate: DateTime.now().subtract(const Duration(days: 1)),
        ),
        availableHours: ['07:00-19:00'],
        lastSeenAt: DateTime.now().subtract(const Duration(days: 3)),
      ),
      Driver(
        id: '4',
        name: 'Ana Costa',
        email: 'ana.costa@golffox.com',
        phone: '(11) 99999-4444',
        cpf: '789.123.456-04',
        birthDate: DateTime(1988, 3, 18),
        address: 'Rua da Consolacao, 321 - Sao Paulo, SP',
        status: DriverStatus.onBreak,
        isOnline: true,
        license: DriverLicense(
          number: '78912345678',
          category: LicenseCategory.d,
          issueDate: DateTime(2021, 4, 5),
          expiryDate: DateTime(2026, 4, 5),
          issuingAuthority: 'DETRAN-SP',
        ),
        certifications: [
          DriverCertification(
            id: '3',
            name: 'Direcao Defensiva',
            description: 'Curso de direcao defensiva avancada',
            issueDate: DateTime(2022, 8, 20),
            expiryDate: DateTime(2024, 8, 20),
            issuingOrganization: 'SENAI',
            certificateNumber: 'DD-2022-089',
          ),
        ],
        ratings: [
          DriverRating(
            id: '4',
            tripId: 'trip_4',
            passengerId: 'pass_4',
            passengerName: 'Roberto Silva',
            rating: 4.6,
            comment: 'Boa motorista, dirigiu com seguranca.',
            createdAt: DateTime.now().subtract(const Duration(hours: 6)),
            tags: ['segura', 'educada'],
          ),
        ],
        stats: DriverStats(
          totalTrips: 134,
          totalDistance: 11200.0,
          totalDrivingTime: const Duration(hours: 285),
          averageRating: 4.5,
          totalRatings: 128,
          fuelEfficiency: 8.8,
          safetyScore: 92,
          lastTripDate: DateTime.now().subtract(const Duration(hours: 4)),
        ),
        availableHours: ['06:30-18:30'],
        lastSeenAt: DateTime.now().subtract(const Duration(minutes: 15)),
      ),
      Driver(
        id: '5',
        name: 'Carlos Lima',
        email: 'carlos.lima@golffox.com',
        phone: '(11) 99999-5555',
        cpf: '321.654.987-05',
        birthDate: DateTime(1975, 11, 28),
        address: 'Av. Faria Lima, 654 - Sao Paulo, SP',
        status: DriverStatus.available,
        isOnline: true,
        license: DriverLicense(
          number: '32165498732',
          category: LicenseCategory.d,
          issueDate: DateTime(2020, 7, 12),
          expiryDate: DateTime(2025, 7, 12),
          issuingAuthority: 'DETRAN-SP',
        ),
        certifications: [
          DriverCertification(
            id: '4',
            name: 'Transporte de Passageiros',
            description: 'Certificacao para transporte coletivo',
            issueDate: DateTime(2021, 10, 5),
            expiryDate: DateTime(2023, 10, 5), // Vencida
            issuingOrganization: 'ANTT',
            certificateNumber: 'TP-2021-156',
          ),
        ],
        ratings: [
          DriverRating(
            id: '5',
            tripId: 'trip_5',
            passengerId: 'pass_5',
            passengerName: 'Lucia Ferreira',
            rating: 4.4,
            comment: 'Motorista experiente e confiavel.',
            createdAt: DateTime.now().subtract(const Duration(days: 1)),
            tags: ['experiente', 'confiavel'],
          ),
        ],
        stats: DriverStats(
          totalTrips: 298,
          totalDistance: 25600.0,
          totalDrivingTime: const Duration(hours: 620),
          averageRating: 4.3,
          totalRatings: 285,
          fuelEfficiency: 8.1,
          safetyScore: 88,
          lastTripDate: DateTime.now().subtract(const Duration(hours: 2)),
        ),
        availableHours: ['05:00-17:00'],
        lastSeenAt: DateTime.now().subtract(const Duration(minutes: 1)),
      ),
    ];

  // Metodos publicos
  Future<void> refreshDrivers() async {
    state = const AsyncValue.loading();
    await Future.delayed(const Duration(milliseconds: 500));
    _loadDrivers();
  }

  void updateFilters(DriverFilters filters) {
    _currentFilters = filters;
    _applyFilters();
  }

  void clearFilters() {
    _currentFilters = const DriverFilters();
    _applyFilters();
  }

  void _applyFilters() {
    try {
      var filteredDrivers = List<Driver>.from(_drivers);

      // Filtro por busca
      if (_currentFilters.search?.isNotEmpty ?? false) {
        final search = _currentFilters.search!.toLowerCase();
        filteredDrivers = filteredDrivers.where((driver) => driver.name.toLowerCase().contains(search) ||
              driver.email.toLowerCase().contains(search) ||
              driver.phone?.toLowerCase().contains(search) == true ||
              driver.cpf?.toLowerCase().contains(search) == true).toList();
      }

      // Filtro por status
      if (_currentFilters.status != null) {
        filteredDrivers = filteredDrivers
            .where((driver) => driver.status == _currentFilters.status)
            .toList();
      }

      // Filtro por categoria da CNH
      if (_currentFilters.licenseCategory != null) {
        filteredDrivers = filteredDrivers
            .where((driver) =>
                driver.license.category == _currentFilters.licenseCategory)
            .toList();
      }

      // Filtro por alertas
      if (_currentFilters.hasAlerts != null) {
        filteredDrivers = filteredDrivers
            .where((driver) => driver.hasAlerts == _currentFilters.hasAlerts)
            .toList();
      }

      // Filtro por status online
      if (_currentFilters.isOnline != null) {
        filteredDrivers = filteredDrivers
            .where((driver) => driver.isOnline == _currentFilters.isOnline)
            .toList();
      }

      // Filtro por documentos vencidos
      if (_currentFilters.hasExpiredDocuments != null) {
        filteredDrivers = filteredDrivers.where((driver) {
          final hasExpired =
              driver.hasExpiredLicense || driver.hasExpiredCertifications;
          return hasExpired == _currentFilters.hasExpiredDocuments;
        }).toList();
      }

      // Filtro por avaliacao minima
      if (_currentFilters.minRating != null) {
        filteredDrivers = filteredDrivers
            .where((driver) =>
                driver.stats.averageRating >= _currentFilters.minRating!)
            .toList();
      }

      // Filtro por numero minimo de viagens
      if (_currentFilters.minTrips != null) {
        filteredDrivers = filteredDrivers
            .where((driver) =>
                driver.stats.totalTrips >= _currentFilters.minTrips!)
            .toList();
      }

      state = AsyncValue.data(filteredDrivers);
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  // CRUD Operations
  Future<Driver?> getDriverById(String id) async {
    await Future.delayed(const Duration(milliseconds: 100));
    try {
      return _drivers.firstWhere((driver) => driver.id == id);
    } catch (e) {
      return null;
    }
  }

  Future<void> createDriver(Driver driver) async {
    await Future.delayed(const Duration(milliseconds: 500));
    try {
      final newDriver = driver.copyWith(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      _drivers.add(newDriver);
      _applyFilters();
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> updateDriver(Driver driver) async {
    await Future.delayed(const Duration(milliseconds: 500));
    try {
      final index = _drivers.indexWhere((d) => d.id == driver.id);
      if (index != -1) {
        _drivers[index] = driver.copyWith(updatedAt: DateTime.now());
        _applyFilters();
      }
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> deleteDriver(String id) async {
    await Future.delayed(const Duration(milliseconds: 500));
    try {
      _drivers.removeWhere((driver) => driver.id == id);
      _applyFilters();
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> updateDriverStatus(String id, DriverStatus status) async {
    await Future.delayed(const Duration(milliseconds: 300));
    try {
      final index = _drivers.indexWhere((d) => d.id == id);
      if (index != -1) {
        _drivers[index] = _drivers[index].copyWith(
          status: status,
          updatedAt: DateTime.now(),
        );
        _applyFilters();
      }
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> updateDriverOnlineStatus(String id, bool isOnline) async {
    await Future.delayed(const Duration(milliseconds: 200));
    try {
      final index = _drivers.indexWhere((d) => d.id == id);
      if (index != -1) {
        _drivers[index] = _drivers[index].copyWith(
          isOnline: isOnline,
          lastSeenAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        _applyFilters();
      }
    } catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  // Estatisticas
  DriversOverviewStats getDriversStats() {
    final totalDrivers = _drivers.length;
    final activeDrivers = _drivers.where((d) => d.isActive).length;
    final availableDrivers = _drivers.where((d) => d.isAvailable).length;
    final onlineDrivers = _drivers.where((d) => d.isOnline).length;
    final driversWithAlerts = _drivers.where((d) => d.hasAlerts).length;

    final totalRatings =
        _drivers.fold<double>(0, (sum, d) => sum + d.stats.averageRating);
    final averageRating = totalDrivers > 0 ? totalRatings / totalDrivers : 0.0;

    final totalTrips =
        _drivers.fold<int>(0, (sum, d) => sum + d.stats.totalTrips);

    return DriversOverviewStats(
      totalDrivers: totalDrivers,
      activeDrivers: activeDrivers,
      availableDrivers: availableDrivers,
      onlineDrivers: onlineDrivers,
      driversWithAlerts: driversWithAlerts,
      averageRating: averageRating,
      totalTrips: totalTrips,
    );
  }

  // Buscar motoristas disponiveis
  List<Driver> getAvailableDrivers() => _drivers.where((driver) => driver.isAvailable).toList();

  // Buscar motoristas online
  List<Driver> getOnlineDrivers() => _drivers.where((driver) => driver.isOnline).toList();

  // Buscar motoristas com alertas
  List<Driver> getDriversWithAlerts() => _drivers.where((driver) => driver.hasAlerts).toList();

  // Stream de motoristas
  Stream<List<Driver>> get driversStream async* {
    while (true) {
      await Future.delayed(const Duration(seconds: 30));
      yield _drivers;
    }
  }

  // Filtros atuais
  DriverFilters get currentFilters => _currentFilters;
}

// Provider
final driverServiceProvider =
    StateNotifierProvider<DriverService, AsyncValue<List<Driver>>>(
  (ref) => DriverService(),
);
