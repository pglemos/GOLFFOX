// lib/models/map_filters.dart
import 'package:flutter/foundation.dart';
import 'vehicle_status.dart';

/// Enum para turnos
enum ShiftType {
  morning, // Manha
  intermediate, // Intermediario
  night, // Noite
}

extension ShiftTypeExtension on ShiftType {
  String get displayName {
    switch (this) {
      case ShiftType.morning:
        return 'Manha';
      case ShiftType.intermediate:
        return 'Intermediario';
      case ShiftType.night:
        return 'Noite';
    }
  }

  String get timeRange {
    switch (this) {
      case ShiftType.morning:
        return '06:00 - 12:00';
      case ShiftType.intermediate:
        return '12:00 - 18:00';
      case ShiftType.night:
        return '18:00 - 06:00';
    }
  }
}

/// Enum para situacao do veiculo
enum VehicleSituation {
  onRoute, // Em rota
  stopped, // Parado
  garage, // Na garagem
  noRoute, // Sem rota
}

extension VehicleSituationExtension on VehicleSituation {
  String get displayName {
    switch (this) {
      case VehicleSituation.onRoute:
        return 'Em Rota';
      case VehicleSituation.stopped:
        return 'Parado';
      case VehicleSituation.garage:
        return 'Garagem';
      case VehicleSituation.noRoute:
        return 'Sem Rota';
    }
  }

  /// Converte situacao para status de veiculo
  List<VehicleStatusType> get correspondingStatuses {
    switch (this) {
      case VehicleSituation.onRoute:
        return [VehicleStatusType.moving];
      case VehicleSituation.stopped:
        return [VehicleStatusType.stoppedShort, VehicleStatusType.stoppedLong];
      case VehicleSituation.garage:
        return [VehicleStatusType.garage];
      case VehicleSituation.noRoute:
        return [VehicleStatusType.offline];
    }
  }
}

@immutable
class MapFilters {

  const MapFilters({
    this.selectedCompany,
    this.selectedRoute,
    this.selectedCarrier,
    this.selectedSituations = const [],
    this.selectedShifts = const [],
    this.selectedStatuses = const [],
  });
  final String? selectedCompany;
  final String? selectedRoute;
  final String? selectedCarrier;
  final List<VehicleSituation> selectedSituations;
  final List<ShiftType> selectedShifts;
  final List<VehicleStatusType> selectedStatuses;

  /// Verifica se ha filtros ativos
  bool get hasActiveFilters => selectedCompany != null ||
        selectedRoute != null ||
        selectedCarrier != null ||
        selectedSituations.isNotEmpty ||
        selectedShifts.isNotEmpty ||
        selectedStatuses.isNotEmpty;

  /// Conta o numero de filtros ativos
  int get activeFiltersCount {
    var count = 0;
    if (selectedCompany != null) count++;
    if (selectedRoute != null) count++;
    if (selectedCarrier != null) count++;
    if (selectedSituations.isNotEmpty) count++;
    if (selectedShifts.isNotEmpty) count++;
    if (selectedStatuses.isNotEmpty) count++;
    return count;
  }

  /// Obtem todos os status correspondentes as situacoes selecionadas
  List<VehicleStatusType> get allSelectedStatuses {
    final allStatuses = <VehicleStatusType>[];

    // Adicionar status explicitamente selecionados
    allStatuses.addAll(selectedStatuses);

    // Adicionar status correspondentes as situacoes
    for (final situation in selectedSituations) {
      allStatuses.addAll(situation.correspondingStatuses);
    }

    return allStatuses.toSet().toList(); // Remove duplicatas
  }

  /// Cria uma copia com novos valores
  MapFilters copyWith({
    String? selectedCompany,
    String? selectedRoute,
    String? selectedCarrier,
    List<VehicleSituation>? selectedSituations,
    List<ShiftType>? selectedShifts,
    List<VehicleStatusType>? selectedStatuses,
  }) => MapFilters(
      selectedCompany: selectedCompany ?? this.selectedCompany,
      selectedRoute: selectedRoute ?? this.selectedRoute,
      selectedCarrier: selectedCarrier ?? this.selectedCarrier,
      selectedSituations: selectedSituations ?? this.selectedSituations,
      selectedShifts: selectedShifts ?? this.selectedShifts,
      selectedStatuses: selectedStatuses ?? this.selectedStatuses,
    );

  /// Limpa todos os filtros
  MapFilters clear() => const MapFilters();

  /// Remove um filtro especifico
  MapFilters removeCompany() => copyWith();
  MapFilters removeRoute() => copyWith();
  MapFilters removeCarrier() => copyWith();
  MapFilters removeSituations() => copyWith(selectedSituations: []);
  MapFilters removeShifts() => copyWith(selectedShifts: []);
  MapFilters removeStatuses() => copyWith(selectedStatuses: []);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MapFilters &&
          runtimeType == other.runtimeType &&
          selectedCompany == other.selectedCompany &&
          selectedRoute == other.selectedRoute &&
          selectedCarrier == other.selectedCarrier &&
          listEquals(selectedSituations, other.selectedSituations) &&
          listEquals(selectedShifts, other.selectedShifts) &&
          listEquals(selectedStatuses, other.selectedStatuses);

  @override
  int get hashCode =>
      selectedCompany.hashCode ^
      selectedRoute.hashCode ^
      selectedCarrier.hashCode ^
      selectedSituations.hashCode ^
      selectedShifts.hashCode ^
      selectedStatuses.hashCode;

  @override
  String toString() => 'MapFilters('
      'company: $selectedCompany, '
      'route: $selectedRoute, '
      'carrier: $selectedCarrier, '
      'situations: $selectedSituations, '
      'shifts: $selectedShifts, '
      'statuses: $selectedStatuses)';
}
