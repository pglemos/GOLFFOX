// ========================================
// GolfFox Vehicle History v11.0
// Widget para exibir historico de eventos do veiculo
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/gf_tokens.dart';
import '../../../models/vehicle.dart';
import '../../../services/vehicle_service.dart';

enum VehicleEventType {
  created,
  updated,
  statusChanged,
  maintenanceScheduled,
  maintenanceCompleted,
  fuelAdded,
  documentUpdated,
  positionUpdated,
}

extension VehicleEventTypeExtension on VehicleEventType {
  String get displayName {
    switch (this) {
      case VehicleEventType.created:
        return 'Veiculo Criado';
      case VehicleEventType.updated:
        return 'Informacoes Atualizadas';
      case VehicleEventType.statusChanged:
        return 'Status Alterado';
      case VehicleEventType.maintenanceScheduled:
        return 'Manutencao Agendada';
      case VehicleEventType.maintenanceCompleted:
        return 'Manutencao Concluida';
      case VehicleEventType.fuelAdded:
        return 'Combustivel Adicionado';
      case VehicleEventType.documentUpdated:
        return 'Documento Atualizado';
      case VehicleEventType.positionUpdated:
        return 'Posicao Atualizada';
    }
  }

  IconData get icon {
    switch (this) {
      case VehicleEventType.created:
        return Icons.add_circle;
      case VehicleEventType.updated:
        return Icons.edit;
      case VehicleEventType.statusChanged:
        return Icons.swap_horiz;
      case VehicleEventType.maintenanceScheduled:
        return Icons.schedule;
      case VehicleEventType.maintenanceCompleted:
        return Icons.check_circle;
      case VehicleEventType.fuelAdded:
        return Icons.local_gas_station;
      case VehicleEventType.documentUpdated:
        return Icons.description;
      case VehicleEventType.positionUpdated:
        return Icons.location_on;
    }
  }

  Color get color {
    switch (this) {
      case VehicleEventType.created:
        return const Color(GfTokens.success);
      case VehicleEventType.updated:
        return const Color(GfTokens.info);
      case VehicleEventType.statusChanged:
        return const Color(GfTokens.warning);
      case VehicleEventType.maintenanceScheduled:
        return const Color(GfTokens.warning);
      case VehicleEventType.maintenanceCompleted:
        return const Color(GfTokens.success);
      case VehicleEventType.fuelAdded:
        return const Color(GfTokens.colorWarning);
      case VehicleEventType.documentUpdated:
        return const Color(GfTokens.colorInfo);
      case VehicleEventType.positionUpdated:
        return const Color(GfTokens.colorPrimary);
    }
  }
}

class VehicleEvent {

  const VehicleEvent({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    required this.timestamp,
    this.userId,
    this.userName,
    this.metadata,
  });

  factory VehicleEvent.fromJson(Map<String, dynamic> json) => VehicleEvent(
        id: json['id'] as String,
        type: VehicleEventType.values.firstWhere(
          (e) => e.name == json['type'],
          orElse: () => VehicleEventType.updated,
        ),
        title: json['title'] as String,
        description: json['description'] as String,
        timestamp: DateTime.parse(json['timestamp'] as String),
        userId: json['userId'] as String?,
        userName: json['userName'] as String?,
        metadata: json['metadata'] as Map<String, dynamic>?,
      );
  final String id;
  final VehicleEventType type;
  final String title;
  final String description;
  final DateTime timestamp;
  final String? userId;
  final String? userName;
  final Map<String, dynamic>? metadata;

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type.name,
        'title': title,
        'description': description,
        'timestamp': timestamp.toIso8601String(),
        'userId': userId,
        'userName': userName,
        'metadata': metadata,
      };
}

class VehicleHistory extends ConsumerStatefulWidget {

  const VehicleHistory({
    required this.vehicleId,
    super.key,
  });
  final String vehicleId;

  @override
  ConsumerState<VehicleHistory> createState() => _VehicleHistoryState();
}

class _VehicleHistoryState extends ConsumerState<VehicleHistory> {
  VehicleEventType? _selectedEventType;

  @override
  Widget build(BuildContext context) => FutureBuilder<Vehicle?>(
      future: ref.read(vehicleServiceProvider).getVehicleById(widget.vehicleId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline,
                  size: 64,
                  color: Color(GfTokens.colorError),
                ),
                const SizedBox(height: GfTokens.spacingMd),
                const Text(
                  'Erro ao carregar historico',
                  style: TextStyle(
                    fontSize: GfTokens.fontSizeLg,
                    fontWeight: FontWeight.w600,
                    color: Color(GfTokens.colorOnSurface),
                  ),
                ),
                const SizedBox(height: GfTokens.spacingSm),
                Text(
                  snapshot.error.toString(),
                  style: const TextStyle(
                    color: Color(GfTokens.colorOnSurfaceVariant),
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }

        final vehicleData = snapshot.data;

        if (vehicleData == null) {
          return const Center(
            child: Text('Veiculo nao encontrado'),
          );
        }

        final events = _generateVehicleEvents(vehicleData);
        final filteredEvents = _selectedEventType != null
            ? events.where((e) => e.type == _selectedEventType).toList()
            : events;

        return Column(
          children: [
            // Filtros
            Container(
              padding: const EdgeInsets.all(GfTokens.spacingMd),
              decoration: const BoxDecoration(
                color: Color(GfTokens.colorSurface),
                border: Border(
                  bottom: BorderSide(color: Color(GfTokens.colorBorder)),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Filtrar por tipo:',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: Color(GfTokens.colorOnSurface),
                    ),
                  ),
                  const SizedBox(height: GfTokens.spacingSm),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildEventTypeChip(null, 'Todos'),
                        const SizedBox(width: GfTokens.spacingSm),
                        ...VehicleEventType.values.map((type) => Padding(
                              padding: const EdgeInsets.only(
                                  right: GfTokens.spacingSm),
                              child:
                                  _buildEventTypeChip(type, type.displayName),
                            )),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Lista de eventos
            Expanded(
              child: filteredEvents.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      padding: const EdgeInsets.all(GfTokens.spacingMd),
                      itemCount: filteredEvents.length,
                      itemBuilder: (context, index) {
                        final event = filteredEvents[index];
                        final isLast = index == filteredEvents.length - 1;

                        return _buildEventItem(event, isLast);
                      },
                    ),
            ),
          ],
        );
      },
    );

  Widget _buildEventTypeChip(VehicleEventType? type, String label) {
    final isSelected = _selectedEventType == type;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedEventType = selected ? type : null;
        });
      },
      backgroundColor: isSelected
          ? (type?.color ?? const Color(GfTokens.colorPrimary)).withValues(alpha: 0.1)
          : null,
      selectedColor:
          (type?.color ?? const Color(GfTokens.colorPrimary)).withValues(alpha: 0.2),
      checkmarkColor: type?.color ?? const Color(GfTokens.colorPrimary),
      side: BorderSide(
        color: isSelected
            ? (type?.color ?? const Color(GfTokens.colorPrimary))
            : const Color(GfTokens.colorBorder),
      ),
    );
  }

  Widget _buildEventItem(VehicleEvent event, bool isLast) => Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Timeline
        Column(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: event.type.color.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(GfTokens.radiusSm),
                border: Border.all(
                  color: event.type.color,
                  width: 2,
                ),
              ),
              child: Icon(
                event.type.icon,
                color: event.type.color,
                size: 20,
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 60,
                color: const Color(GfTokens.colorBorder),
                margin:
                    const EdgeInsets.symmetric(vertical: GfTokens.spacingSm),
              ),
          ],
        ),
        const SizedBox(width: GfTokens.spacingMd),

        // Conteudo
        Expanded(
          child: Container(
            margin: const EdgeInsets.only(bottom: GfTokens.spacingMd),
            padding: const EdgeInsets.all(GfTokens.spacingMd),
            decoration: BoxDecoration(
              color: const Color(GfTokens.colorSurface),
              borderRadius: BorderRadius.circular(GfTokens.radiusSm),
              border: Border.all(color: const Color(GfTokens.colorBorder)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        event.title,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          color: Color(GfTokens.colorOnSurface),
                        ),
                      ),
                    ),
                    Text(
                      _formatTimestamp(event.timestamp),
                      style: const TextStyle(
                        fontSize: GfTokens.fontSizeSm,
                        color: Color(GfTokens.colorOnSurfaceVariant),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: GfTokens.spacingXs),
                Text(
                  event.description,
                  style: const TextStyle(
                    color: Color(GfTokens.colorOnSurfaceVariant),
                  ),
                ),
                if (event.userName != null) ...[
                  const SizedBox(height: GfTokens.spacingSm),
                  Row(
                    children: [
                      const Icon(
                        Icons.person,
                        size: 16,
                        color: Color(GfTokens.colorOnSurfaceVariant),
                      ),
                      const SizedBox(width: GfTokens.spacingXs),
                      Text(
                        'Por ${event.userName}',
                        style: const TextStyle(
                          fontSize: GfTokens.fontSizeSm,
                          color: Color(GfTokens.colorOnSurfaceVariant),
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ),
                ],
                if (event.metadata != null && event.metadata!.isNotEmpty) ...[
                  const SizedBox(height: GfTokens.spacingSm),
                  _buildMetadata(event.metadata!),
                ],
              ],
            ),
          )
              .animate()
              .fadeIn(delay: const Duration(milliseconds: 100))
              .slideX(begin: 0.3),
        ),
      ],
    );

  Widget _buildMetadata(Map<String, dynamic> metadata) => Container(
      padding: const EdgeInsets.all(GfTokens.spacingSm),
      decoration: BoxDecoration(
        color: const Color(GfTokens.colorSurfaceVariant).withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(GfTokens.radiusXs),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: metadata.entries
            .map(
              (entry) => Padding(
                padding: const EdgeInsets.only(bottom: GfTokens.spacingXs),
                child: Row(
                  children: [
                    Text(
                      '${entry.key}: ',
                      style: const TextStyle(
                        fontSize: GfTokens.fontSizeSm,
                        fontWeight: FontWeight.w500,
                        color: Color(GfTokens.colorOnSurfaceVariant),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        entry.value.toString(),
                        style: const TextStyle(
                          fontSize: GfTokens.fontSizeSm,
                          color: Color(GfTokens.colorOnSurfaceVariant),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );

  Widget _buildEmptyState() => Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.history,
            size: 64,
            color: Color(GfTokens.colorOnSurfaceVariant),
          ),
          const SizedBox(height: GfTokens.spacingMd),
          const Text(
            'Nenhum evento encontrado',
            style: TextStyle(
              fontSize: GfTokens.fontSizeLg,
              fontWeight: FontWeight.w600,
              color: Color(GfTokens.colorOnSurface),
            ),
          ),
          const SizedBox(height: GfTokens.spacingSm),
          Text(
            _selectedEventType != null
                ? 'Nao ha eventos do tipo "${_selectedEventType!.displayName}".'
                : 'Este veiculo ainda nao possui historico de eventos.',
            style: const TextStyle(
              color: Color(GfTokens.colorOnSurfaceVariant),
            ),
            textAlign: TextAlign.center,
          ),
          if (_selectedEventType != null) ...[
            const SizedBox(height: GfTokens.spacingMd),
            TextButton(
              onPressed: () {
                setState(() {
                  _selectedEventType = null;
                });
              },
              child: const Text('Limpar Filtro'),
            ),
          ],
        ],
      ),
    );

  List<VehicleEvent> _generateVehicleEvents(Vehicle vehicle) {
    final events = <VehicleEvent>[
      VehicleEvent(
        id: '${vehicle.id}_created',
        type: VehicleEventType.created,
        title: 'Veiculo Criado',
        description: 'Veiculo ${vehicle.name} foi adicionado ao sistema.',
        timestamp: vehicle.createdAt,
        userName: 'Sistema',
        metadata: {
          'Placa': vehicle.documents.licensePlate ?? 'Sem placa',
          'Tipo': vehicle.type.displayName,
          'Status': vehicle.status.displayName,
        },
      ),
      if (vehicle.updatedAt
          .isAfter(vehicle.createdAt.add(const Duration(minutes: 1))))
        VehicleEvent(
          id: '${vehicle.id}_updated',
          type: VehicleEventType.updated,
          title: 'Informacoes Atualizadas',
          description: 'As informacoes do veiculo foram atualizadas.',
          timestamp: vehicle.updatedAt,
          userName: 'Sistema',
        ),
      if (vehicle.status == VehicleStatus.maintenance)
        VehicleEvent(
          id: '${vehicle.id}_maintenance',
          type: VehicleEventType.statusChanged,
          title: 'Status Alterado para Manutencao',
          description: 'O veiculo foi colocado em manutencao.',
          timestamp: DateTime.now().subtract(const Duration(hours: 2)),
          userName: 'Joao Silva',
          metadata: {
            'Status Anterior': 'Disponivel',
            'Status Atual': 'Em Manutencao',
          },
        ),
      if ((vehicle.currentFuelLevel ?? 0) < 30)
        VehicleEvent(
          id: '${vehicle.id}_fuel_low',
          type: VehicleEventType.fuelAdded,
          title: 'Nivel de Combustivel Baixo',
          description: 'O nivel de combustivel esta abaixo de 30%.',
          timestamp: DateTime.now().subtract(const Duration(hours: 6)),
          userName: 'Sistema',
          metadata: {
            'Nivel Atual':
                '${(vehicle.currentFuelLevel ?? 0).toStringAsFixed(1)}%',
            'Capacidade': '${vehicle.specifications.fuelTankCapacity}L',
          },
        ),
      if (vehicle.documents.hasExpiringDocuments)
        VehicleEvent(
          id: '${vehicle.id}_docs_expiring',
          type: VehicleEventType.documentUpdated,
          title: 'Documentos Vencendo',
          description:
              'Alguns documentos do veiculo estao proximos do vencimento.',
          timestamp: DateTime.now().subtract(const Duration(days: 1)),
          userName: 'Sistema',
          metadata: {
            'Documentos': 'Documentos proximos do vencimento',
          },
        ),
    ]..sort((a, b) => b.timestamp.compareTo(a.timestamp));

    return events;
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return 'Agora';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}min atras';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h atras';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d atras';
    } else {
      return '${timestamp.day.toString().padLeft(2, '0')}/${timestamp.month.toString().padLeft(2, '0')}/${timestamp.year}';
    }
  }
}
