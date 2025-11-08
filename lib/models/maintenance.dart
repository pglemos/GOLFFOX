// ========================================
// GolfFox Maintenance Model v11.0
// Modelo de dados para manutencao de veiculos
// ========================================

import '../core/theme/gf_tokens.dart';

enum MaintenanceType {
  preventive,
  corrective,
  emergency,
  inspection,
  cleaning,
}

extension MaintenanceTypeExtension on MaintenanceType {
  String get displayName {
    switch (this) {
      case MaintenanceType.preventive:
        return 'Preventiva';
      case MaintenanceType.corrective:
        return 'Corretiva';
      case MaintenanceType.emergency:
        return 'Emergencial';
      case MaintenanceType.inspection:
        return 'Inspecao';
      case MaintenanceType.cleaning:
        return 'Limpeza';
    }
  }

  int get colorValue {
    switch (this) {
      case MaintenanceType.preventive:
        return GfTokens.success;
      case MaintenanceType.corrective:
        return GfTokens.warning;
      case MaintenanceType.emergency:
        return GfTokens.colorError;
      case MaintenanceType.inspection:
        return GfTokens.info;
      case MaintenanceType.cleaning:
        return GfTokens.primary;
    }
  }
}

enum MaintenanceStatus {
  scheduled,
  inProgress,
  completed,
  cancelled,
  overdue,
}

extension MaintenanceStatusExtension on MaintenanceStatus {
  String get displayName {
    switch (this) {
      case MaintenanceStatus.scheduled:
        return 'Agendada';
      case MaintenanceStatus.inProgress:
        return 'Em Andamento';
      case MaintenanceStatus.completed:
        return 'Concluida';
      case MaintenanceStatus.cancelled:
        return 'Cancelada';
      case MaintenanceStatus.overdue:
        return 'Atrasada';
    }
  }

  int get colorValue {
    switch (this) {
      case MaintenanceStatus.scheduled:
        return GfTokens.info;
      case MaintenanceStatus.inProgress:
        return GfTokens.warning;
      case MaintenanceStatus.completed:
        return GfTokens.success;
      case MaintenanceStatus.cancelled:
        return GfTokens.colorOnSurfaceVariant;
      case MaintenanceStatus.overdue:
        return GfTokens.colorError;
    }
  }
}

enum MaintenancePriority {
  low,
  medium,
  high,
  critical,
}

extension MaintenancePriorityExtension on MaintenancePriority {
  String get displayName {
    switch (this) {
      case MaintenancePriority.low:
        return 'Baixa';
      case MaintenancePriority.medium:
        return 'Media';
      case MaintenancePriority.high:
        return 'Alta';
      case MaintenancePriority.critical:
        return 'Critica';
    }
  }

  int get colorValue {
    switch (this) {
      case MaintenancePriority.low:
        return GfTokens.success;
      case MaintenancePriority.medium:
        return GfTokens.warning;
      case MaintenancePriority.high:
        return GfTokens.colorError;
      case MaintenancePriority.critical:
        return GfTokens.accent;
    }
  }
}

class MaintenanceItem {

  const MaintenanceItem({
    required this.id,
    required this.description,
    required this.quantity,
    required this.isCompleted,
    this.partNumber,
    this.cost,
    this.notes,
  });

  factory MaintenanceItem.fromJson(Map<String, dynamic> json) => MaintenanceItem(
        id: json['id'] as String? ?? '',
        description: json['description'] as String? ?? '',
        partNumber: json['part_number'] as String?,
        cost: (json['cost'] as num?)?.toDouble(),
        quantity: (json['quantity'] as num?)?.toInt() ?? 1,
        isCompleted: json['is_completed'] as bool? ?? false,
        notes: json['notes'] as String?,
      );
  final String id;
  final String description;
  final String? partNumber;
  final double? cost;
  final int quantity;
  final bool isCompleted;
  final String? notes;

  Map<String, dynamic> toJson() => {
      'id': id,
      'description': description,
      'part_number': partNumber,
      'cost': cost,
      'quantity': quantity,
      'is_completed': isCompleted,
      'notes': notes,
    };

  MaintenanceItem copyWith({
    String? id,
    String? description,
    String? partNumber,
    double? cost,
    int? quantity,
    bool? isCompleted,
    String? notes,
  }) => MaintenanceItem(
      id: id ?? this.id,
      description: description ?? this.description,
      partNumber: partNumber ?? this.partNumber,
      cost: cost ?? this.cost,
      quantity: quantity ?? this.quantity,
      isCompleted: isCompleted ?? this.isCompleted,
      notes: notes ?? this.notes,
    );

  double get totalCost => (cost ?? 0.0) * quantity;
}

class MaintenanceRecord {

  const MaintenanceRecord({
    required this.id,
    required this.vehicleId,
    required this.title,
    required this.description,
    required this.type,
    required this.status,
    required this.priority,
    required this.scheduledDate,
    required this.odometerReading,
    required this.items,
    required this.attachments,
    required this.createdAt,
    required this.updatedAt,
    required this.companyId,
    this.startDate,
    this.completedDate,
    this.estimatedCost,
    this.actualCost,
    this.serviceProviderId,
    this.serviceProviderName,
    this.technicianId,
    this.technicianName,
    this.notes,
    this.completionNotes,
    this.nextMaintenanceDate,
    this.nextMaintenanceOdometer,
  });

  factory MaintenanceRecord.fromJson(Map<String, dynamic> json) => MaintenanceRecord(
        id: json['id'] as String? ?? '',
        vehicleId: json['vehicle_id'] as String? ?? '',
        title: json['title'] as String? ?? '',
        description: json['description'] as String? ?? '',
        type: MaintenanceType.values.firstWhere(
          (e) => e.name == (json['type'] as String?),
          orElse: () => MaintenanceType.preventive,
        ),
        status: MaintenanceStatus.values.firstWhere(
          (e) => e.name == (json['status'] as String?),
          orElse: () => MaintenanceStatus.scheduled,
        ),
        priority: MaintenancePriority.values.firstWhere(
          (e) => e.name == (json['priority'] as String?),
          orElse: () => MaintenancePriority.medium,
        ),
        scheduledDate: DateTime.parse(
          json['scheduled_date'] as String? ??
              DateTime.now().toIso8601String(),
        ),
        startDate: (json['start_date'] as String?) != null
            ? DateTime.parse(json['start_date'] as String)
            : null,
        completedDate: (json['completed_date'] as String?) != null
            ? DateTime.parse(json['completed_date'] as String)
            : null,
        odometerReading:
            (json['odometer_reading'] as num?)?.toDouble() ?? 0.0,
        estimatedCost: (json['estimated_cost'] as num?)?.toDouble(),
        actualCost: (json['actual_cost'] as num?)?.toDouble(),
        serviceProviderId: json['service_provider_id'] as String?,
        serviceProviderName: json['service_provider_name'] as String?,
        technicianId: json['technician_id'] as String?,
        technicianName: json['technician_name'] as String?,
        items: (json['items'] as List<dynamic>?)
                ?.map(
                  (item) => MaintenanceItem.fromJson(
                    Map<String, dynamic>.from(
                      item as Map,
                    ),
                  ),
                )
                .toList() ??
            const [],
        attachments: (json['attachments'] as List?)
                ?.map((attachment) => attachment.toString())
                .toList() ??
            const [],
        notes: json['notes'] as String?,
        completionNotes: json['completion_notes'] as String?,
        nextMaintenanceDate:
            (json['next_maintenance_date'] as String?) != null
                ? DateTime.parse(json['next_maintenance_date'] as String)
                : null,
        nextMaintenanceOdometer:
            (json['next_maintenance_odometer'] as num?)?.toDouble(),
        createdAt: DateTime.parse(
          json['created_at'] as String? ??
              DateTime.now().toIso8601String(),
        ),
        updatedAt: DateTime.parse(
          json['updated_at'] as String? ??
              DateTime.now().toIso8601String(),
        ),
        companyId: json['company_id'] as String? ?? '',
      );
  final String id;
  final String vehicleId;
  final String title;
  final String description;
  final MaintenanceType type;
  final MaintenanceStatus status;
  final MaintenancePriority priority;
  final DateTime scheduledDate;
  final DateTime? startDate;
  final DateTime? completedDate;
  final double odometerReading;
  final double? estimatedCost;
  final double? actualCost;
  final String? serviceProviderId;
  final String? serviceProviderName;
  final String? technicianId;
  final String? technicianName;
  final List<MaintenanceItem> items;
  final List<String> attachments;
  final String? notes;
  final String? completionNotes;
  final DateTime? nextMaintenanceDate;
  final double? nextMaintenanceOdometer;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String companyId;

  Map<String, dynamic> toJson() => {
      'id': id,
      'vehicle_id': vehicleId,
      'title': title,
      'description': description,
      'type': type.name,
      'status': status.name,
      'priority': priority.name,
      'scheduled_date': scheduledDate.toIso8601String(),
      'start_date': startDate?.toIso8601String(),
      'completed_date': completedDate?.toIso8601String(),
      'odometer_reading': odometerReading,
      'estimated_cost': estimatedCost,
      'actual_cost': actualCost,
      'service_provider_id': serviceProviderId,
      'service_provider_name': serviceProviderName,
      'technician_id': technicianId,
      'technician_name': technicianName,
      'items': items.map((item) => item.toJson()).toList(),
      'attachments': attachments,
      'notes': notes,
      'completion_notes': completionNotes,
      'next_maintenance_date': nextMaintenanceDate?.toIso8601String(),
      'next_maintenance_odometer': nextMaintenanceOdometer,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
      'company_id': companyId,
    };

  MaintenanceRecord copyWith({
    String? id,
    String? vehicleId,
    String? title,
    String? description,
    MaintenanceType? type,
    MaintenanceStatus? status,
    MaintenancePriority? priority,
    DateTime? scheduledDate,
    DateTime? startDate,
    DateTime? completedDate,
    double? odometerReading,
    double? estimatedCost,
    double? actualCost,
    String? serviceProviderId,
    String? serviceProviderName,
    String? technicianId,
    String? technicianName,
    List<MaintenanceItem>? items,
    List<String>? attachments,
    String? notes,
    String? completionNotes,
    DateTime? nextMaintenanceDate,
    double? nextMaintenanceOdometer,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? companyId,
  }) => MaintenanceRecord(
      id: id ?? this.id,
      vehicleId: vehicleId ?? this.vehicleId,
      title: title ?? this.title,
      description: description ?? this.description,
      type: type ?? this.type,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      scheduledDate: scheduledDate ?? this.scheduledDate,
      startDate: startDate ?? this.startDate,
      completedDate: completedDate ?? this.completedDate,
      odometerReading: odometerReading ?? this.odometerReading,
      estimatedCost: estimatedCost ?? this.estimatedCost,
      actualCost: actualCost ?? this.actualCost,
      serviceProviderId: serviceProviderId ?? this.serviceProviderId,
      serviceProviderName: serviceProviderName ?? this.serviceProviderName,
      technicianId: technicianId ?? this.technicianId,
      technicianName: technicianName ?? this.technicianName,
      items: items ?? this.items,
      attachments: attachments ?? this.attachments,
      notes: notes ?? this.notes,
      completionNotes: completionNotes ?? this.completionNotes,
      nextMaintenanceDate: nextMaintenanceDate ?? this.nextMaintenanceDate,
      nextMaintenanceOdometer:
          nextMaintenanceOdometer ?? this.nextMaintenanceOdometer,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      companyId: companyId ?? this.companyId,
    );

  // Getters uteis
  bool get isCompleted => status == MaintenanceStatus.completed;
  bool get isInProgress => status == MaintenanceStatus.inProgress;
  bool get isScheduled => status == MaintenanceStatus.scheduled;
  bool get isOverdue =>
      status == MaintenanceStatus.overdue ||
      (status == MaintenanceStatus.scheduled &&
          scheduledDate.isBefore(DateTime.now()));

  Duration? get duration {
    if (startDate != null && completedDate != null) {
      return completedDate!.difference(startDate!);
    }
    return null;
  }

  double get totalEstimatedCost =>
      (estimatedCost ?? 0.0) +
      items.fold(0.0, (sum, item) => sum + item.totalCost);

  double get totalActualCost =>
      (actualCost ?? 0.0) +
      items.fold(0.0, (sum, item) => sum + item.totalCost);

  int get completedItemsCount => items.where((item) => item.isCompleted).length;

  double get progressPercentage =>
      items.isEmpty ? 0.0 : completedItemsCount / items.length;

  double get totalCost {
    final itemsCost = items.fold<double>(
        0, (sum, item) => sum + (item.cost ?? 0.0) * item.quantity);
    final mainCost = actualCost ?? estimatedCost ?? 0.0;
    return itemsCost + mainCost;
  }

  String get statusText => status.displayName;
  String get typeText => type.displayName;
  String get priorityText => priority.displayName;

  String get durationText {
    final dur = duration;
    if (dur == null) return 'N/A';

    if (dur.inDays > 0) {
      return '${dur.inDays}d ${dur.inHours % 24}h';
    } else if (dur.inHours > 0) {
      return '${dur.inHours}h ${dur.inMinutes % 60}m';
    } else {
      return '${dur.inMinutes}m';
    }
  }
}
