// ========================================
// GolfFox Vehicle Maintenance List v11.0
// Widget para exibir lista de manutencoes do veiculo
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/gf_tokens.dart';
import '../../../models/maintenance.dart';
import '../../../services/vehicle_service.dart';

class VehicleMaintenanceList extends ConsumerStatefulWidget {
  const VehicleMaintenanceList({
    required this.vehicleId,
    super.key,
  });
  final String vehicleId;

  @override
  ConsumerState<VehicleMaintenanceList> createState() =>
      _VehicleMaintenanceListState();
}

class _VehicleMaintenanceListState
    extends ConsumerState<VehicleMaintenanceList> {
  String _selectedFilter = 'all';

  @override
  Widget build(BuildContext context) {
    final maintenanceRecords =
        ref.watch(vehicleMaintenanceProvider(widget.vehicleId));

    return maintenanceRecords.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(
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
              'Erro ao carregar manutenções',
              style: TextStyle(
                fontSize: GfTokens.fontSizeLg,
                fontWeight: FontWeight.w600,
                color: Color(GfTokens.colorOnSurface),
              ),
            ),
            const SizedBox(height: GfTokens.spacingSm),
            Text(
              error.toString(),
              style: const TextStyle(
                color: Color(GfTokens.colorOnSurfaceVariant),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: GfTokens.spacingMd),
            ElevatedButton(
              onPressed: () => ref.invalidate(vehicleServiceProvider),
              child: const Text('Tentar novamente'),
            ),
          ],
        ),
      ),
      data: (records) {
        final filteredRecords = _filterRecords(records);

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
              child: Row(
                children: [
                  const Text(
                    'Filtrar por:',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: Color(GfTokens.colorOnSurface),
                    ),
                  ),
                  const SizedBox(width: GfTokens.spacingMd),
                  Expanded(
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildFilterChip('all', 'Todas', records.length),
                          const SizedBox(width: GfTokens.spacingSm),
                          _buildFilterChip(
                            'scheduled',
                            'Agendadas',
                            records
                                .where((r) =>
                                    r.status == MaintenanceStatus.scheduled)
                                .length,
                          ),
                          const SizedBox(width: GfTokens.spacingSm),
                          _buildFilterChip(
                            'in_progress',
                            'Em andamento',
                            records
                                .where((r) =>
                                    r.status == MaintenanceStatus.inProgress)
                                .length,
                          ),
                          const SizedBox(width: GfTokens.spacingSm),
                          _buildFilterChip(
                            'completed',
                            'Concluídas',
                            records
                                .where((r) =>
                                    r.status == MaintenanceStatus.completed)
                                .length,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Lista de manutencoes
            Expanded(
              child: filteredRecords.isEmpty
                  ? _buildEmptyState()
                  : ListView.builder(
                      padding: const EdgeInsets.all(GfTokens.spacingMd),
                      itemCount: filteredRecords.length,
                      itemBuilder: (context, index) {
                        final record = filteredRecords[index];
                        return _buildMaintenanceCard(record, index);
                      },
                    ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildFilterChip(String value, String label, int count) {
    final isSelected = _selectedFilter == value;
    return FilterChip(
      label: Text('$label ($count)'),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedFilter = value;
        });
      },
      backgroundColor: isSelected
          ? const Color(GfTokens.colorPrimary).withValues(alpha: 0.1)
          : null,
      selectedColor: const Color(GfTokens.colorPrimary).withValues(alpha: 0.2),
      checkmarkColor: const Color(GfTokens.colorPrimary),
      side: BorderSide(
        color: isSelected
            ? const Color(GfTokens.colorPrimary)
            : const Color(GfTokens.colorBorder),
      ),
    );
  }

  Widget _buildMaintenanceCard(MaintenanceRecord record, int index) => Card(
        margin: const EdgeInsets.only(bottom: GfTokens.spacingMd),
        child: Padding(
          padding: const EdgeInsets.all(GfTokens.spacingMd),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  // Status badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: GfTokens.spacingSm,
                      vertical: GfTokens.spacingXs,
                    ),
                    decoration: BoxDecoration(
                      color: record.status.colorValue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(GfTokens.radiusSm),
                      border: Border.all(
                        color: record.status.colorValue.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      record.status.displayName,
                      style: TextStyle(
                        color: Color(record.status.colorValue),
                        fontWeight: FontWeight.w600,
                        fontSize: GfTokens.fontSizeXs,
                      ),
                    ),
                  ),
                  const SizedBox(width: GfTokens.spacingSm),

                  // Prioridade
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: GfTokens.spacingSm,
                      vertical: GfTokens.spacingXs,
                    ),
                    decoration: BoxDecoration(
                      color: record.priority.colorValue
                          .withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(GfTokens.radiusSm),
                      border: Border.all(
                        color: record.priority.colorValue
                            .withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      record.priority.displayName,
                      style: TextStyle(
                        color: Color(record.priority.colorValue),
                        fontWeight: FontWeight.w600,
                        fontSize: GfTokens.fontSizeXs,
                      ),
                    ),
                  ),
                  const Spacer(),

                  // Tipo
                  Icon(
                    _getMaintenanceIcon(record.type),
                    color: const Color(GfTokens.colorOnSurfaceVariant),
                    size: 20,
                  ),
                ],
              ),

              const SizedBox(height: GfTokens.spacingMd),

              // Titulo e descricao
              Text(
                record.type.displayName,
                style: const TextStyle(
                  fontSize: GfTokens.fontSizeLg,
                  fontWeight: FontWeight.w600,
                  color: Color(GfTokens.colorOnSurface),
                ),
              ),

              if (record.description.isNotEmpty) ...[
                const SizedBox(height: GfTokens.spacingSm),
                Text(
                  record.description,
                  style: const TextStyle(
                    color: Color(GfTokens.colorOnSurfaceVariant),
                  ),
                ),
              ],

              const SizedBox(height: GfTokens.spacingMd),

              // Informacoes
              Row(
                children: [
                  Expanded(
                    child: _buildInfoItem(
                      'Data agendada',
                      _formatDate(record.scheduledDate),
                      Icons.calendar_today,
                    ),
                  ),
                  if (record.completedDate != null)
                    Expanded(
                      child: _buildInfoItem(
                        'Data de conclusão',
                        _formatDate(record.completedDate!),
                        Icons.check_circle,
                      ),
                    ),
                ],
              ),

              const SizedBox(height: GfTokens.spacingMd),

              // Itens de manutencao
              if (record.items.isNotEmpty) ...[
                Text(
                  'Itens (${record.items.length})',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: Color(GfTokens.colorOnSurface),
                  ),
                ),
                const SizedBox(height: GfTokens.spacingSm),
                ...record.items.take(3).map((item) => Padding(
                      padding:
                          const EdgeInsets.only(bottom: GfTokens.spacingXs),
                      child: Row(
                        children: [
                          Icon(
                            item.isCompleted
                                ? Icons.check_circle
                                : Icons.radio_button_unchecked,
                            size: 16,
                            color: item.isCompleted
                                ? const Color(GfTokens.colorSuccess)
                                : const Color(GfTokens.colorOnSurfaceVariant),
                          ),
                          const SizedBox(width: GfTokens.spacingSm),
                          Expanded(
                            child: Text(
                              item.description,
                              style: TextStyle(
                                fontSize: GfTokens.fontSizeSm,
                                color:
                                    const Color(GfTokens.colorOnSurfaceVariant),
                                decoration: item.isCompleted
                                    ? TextDecoration.lineThrough
                                    : null,
                              ),
                            ),
                          ),
                          if ((item.cost ?? 0) > 0)
                            Text(
                              'R\$ ${(item.cost ?? 0).toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontSize: GfTokens.fontSizeSm,
                                fontWeight: FontWeight.w500,
                                color: Color(GfTokens.colorOnSurface),
                              ),
                            ),
                        ],
                      ),
                    )),
                if (record.items.length > 3)
                  Text(
                    '+ ${record.items.length - 3} itens',
                    style: const TextStyle(
                      fontSize: GfTokens.fontSizeSm,
                      color: Color(GfTokens.colorPrimary),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
              ],

              // Custo total
              if (record.totalCost > 0) ...[
                const SizedBox(height: GfTokens.spacingMd),
                Container(
                  padding: const EdgeInsets.all(GfTokens.spacingSm),
                  decoration: BoxDecoration(
                    color: const Color(GfTokens.colorSuccess)
                        .withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(GfTokens.radiusSm),
                    border: Border.all(
                      color: const Color(GfTokens.colorSuccess)
                          .withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Custo total',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: Color(GfTokens.colorSuccess),
                        ),
                      ),
                      Text(
                        'R\$ ${record.totalCost.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontSize: GfTokens.fontSizeLg,
                          fontWeight: FontWeight.w600,
                          color: Color(GfTokens.colorSuccess),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      )
          .animate(delay: (index * 100).ms)
          .fadeIn(duration: 300.ms)
          .slideX(begin: 0.1, end: 0);

  Widget _buildInfoItem(String label, String value, IconData icon) => Row(
        children: [
          Icon(
            icon,
            size: 16,
            color: const Color(GfTokens.colorOnSurfaceVariant),
          ),
          const SizedBox(width: GfTokens.spacingXs),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontWeight: FontWeight.w500,
                  color: Color(GfTokens.colorOnSurface),
                  fontSize: GfTokens.fontSizeSm,
                ),
              ),
              Text(
                label,
                style: const TextStyle(
                  fontSize: GfTokens.fontSizeXs,
                  color: Color(GfTokens.colorOnSurfaceVariant),
                ),
              ),
            ],
          ),
        ],
      );

  Widget _buildEmptyState() {
    String message;
    String description;

    switch (_selectedFilter) {
      case 'scheduled':
        message = 'Nenhuma manutenção agendada';
        description = 'Não há manutenções agendadas para este veículo.';
        break;
      case 'in_progress':
        message = 'Nenhuma manutenção em andamento';
        description = 'Não há manutenções sendo executadas no momento.';
        break;
      case 'completed':
        message = 'Nenhuma manutenção concluída';
        description = 'Não há histórico de manutenções concluídas.';
        break;
      default:
        message = 'Nenhuma manutenção encontrada';
        description = 'Este veículo ainda não possui registros de manutenção.';
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.build_circle_outlined,
            size: 64,
            color: Color(GfTokens.colorOnSurfaceVariant),
          ),
          const SizedBox(height: GfTokens.spacingMd),
          Text(
            message,
            style: const TextStyle(
              fontSize: GfTokens.fontSizeLg,
              fontWeight: FontWeight.w600,
              color: Color(GfTokens.colorOnSurface),
            ),
          ),
          const SizedBox(height: GfTokens.spacingSm),
          Text(
            description,
            style: const TextStyle(
              color: Color(GfTokens.colorOnSurfaceVariant),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: GfTokens.spacingMd),
          ElevatedButton.icon(
            onPressed: () {
              // TODO(golffox-team): Navegar para criar nova manutencao
            },
            icon: const Icon(Icons.add),
            label: const Text('Agendar manutenção'),
          ),
        ],
      ),
    );
  }

  List<MaintenanceRecord> _filterRecords(List<MaintenanceRecord> records) {
    switch (_selectedFilter) {
      case 'scheduled':
        return records
            .where((r) => r.status == MaintenanceStatus.scheduled)
            .toList();
      case 'in_progress':
        return records
            .where((r) => r.status == MaintenanceStatus.inProgress)
            .toList();
      case 'completed':
        return records
            .where((r) => r.status == MaintenanceStatus.completed)
            .toList();
      default:
        return records;
    }
  }

  IconData _getMaintenanceIcon(MaintenanceType type) {
    switch (type) {
      case MaintenanceType.preventive:
        return Icons.schedule;
      case MaintenanceType.corrective:
        return Icons.build;
      case MaintenanceType.emergency:
        return Icons.warning;
      case MaintenanceType.inspection:
        return Icons.search;
      case MaintenanceType.cleaning:
        return Icons.cleaning_services;
    }
  }

  String _formatDate(DateTime date) =>
      '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
}
