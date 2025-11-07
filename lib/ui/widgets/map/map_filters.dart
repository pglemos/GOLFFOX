// ========================================
// GolfFox Map Filters Widget v12.0
// Filtros para o mapa de veiculos em tempo real
// ========================================

import 'package:flutter/material.dart';
import '../../../core/theme/unified_theme.dart';

class MapFilters extends StatefulWidget {

  const MapFilters({
    super.key,
    required this.selectedStatuses,
    this.selectedRoute,
    required this.availableCompanies,
    required this.availableRoutes,
    required this.availableCarriers,
    required this.onFiltersChanged,
  });
  final List<String> selectedStatuses;
  final String? selectedRoute;
  final List<String> availableCompanies;
  final List<String> availableRoutes;
  final List<String> availableCarriers;
  final void Function(List<String> statuses, String? route) onFiltersChanged;

  @override
  State<MapFilters> createState() => _MapFiltersState();
}

class _MapFiltersState extends State<MapFilters> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) => Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header do filtro
          InkWell(
            onTap: () => setState(() => _isExpanded = !_isExpanded),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            child: Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(
                    Icons.filter_list,
                    color: GolfFoxTheme.primaryOrange,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Filtros',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  if (_hasActiveFilters())
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: GolfFoxTheme.primaryOrange,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _getActiveFiltersCount().toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  const SizedBox(width: 8),
                  Icon(
                    _isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: Colors.grey[600],
                  ),
                ],
              ),
            ),
          ),

          // Conteudo dos filtros
          if (_isExpanded)
            Container(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Filtro de Status
                  _buildFilterSection(
                    title: 'Status dos Veiculos',
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        'active',
                        'inactive',
                        'maintenance',
                        'emergency',
                        'offline'
                      ].map((status) {
                        final isSelected =
                            widget.selectedStatuses.contains(status);
                        return FilterChip(
                          label: Text(
                            _getStatusLabel(status),
                            style: TextStyle(
                              fontSize: 12,
                              color:
                                  isSelected ? Colors.white : Colors.grey[700],
                            ),
                          ),
                          selected: isSelected,
                          onSelected: (selected) {
                            final newStatuses =
                                List<String>.from(widget.selectedStatuses);
                            if (selected) {
                              newStatuses.add(status);
                            } else {
                              newStatuses.remove(status);
                            }
                            widget.onFiltersChanged(
                                newStatuses, widget.selectedRoute);
                          },
                          backgroundColor: Colors.grey[100],
                          selectedColor: _getStatusColor(status),
                          checkmarkColor: Colors.white,
                        );
                      }).toList(),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Filtro de Rotas
                  _buildFilterSection(
                    title: 'Rotas',
                    child: DropdownButtonFormField<String>(
                      value: widget.selectedRoute,
                      decoration: const InputDecoration(
                        hintText: 'Selecione uma rota',
                        border: OutlineInputBorder(),
                        contentPadding:
                            EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      items: [
                        const DropdownMenuItem<String>(
                          value: null,
                          child: Text('Todas as rotas'),
                        ),
                        ...widget.availableRoutes.map((route) {
                          return DropdownMenuItem<String>(
                            value: route,
                            child: Text(route),
                          );
                        }),
                      ],
                      onChanged: (value) {
                        widget.onFiltersChanged(widget.selectedStatuses, value);
                      },
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Botao limpar filtros
                  if (_hasActiveFilters())
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () => widget.onFiltersChanged([], null),
                        icon: const Icon(Icons.clear_all, size: 16),
                        label: const Text('Limpar Filtros'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.grey[600],
                          side: BorderSide(color: Colors.grey[300]!),
                        ),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );

  Widget _buildFilterSection({
    required String title,
    required Widget child,
  }) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );

  bool _hasActiveFilters() => widget.selectedStatuses.isNotEmpty || widget.selectedRoute != null;

  int _getActiveFiltersCount() {
    var count = 0;
    if (widget.selectedStatuses.isNotEmpty) count++;
    if (widget.selectedRoute != null) count++;
    return count;
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'maintenance':
        return 'Manutencao';
      case 'emergency':
        return 'Emergencia';
      case 'offline':
        return 'Offline';
      default:
        return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'active':
        return const Color(0xFF10B981); // Green
      case 'inactive':
        return const Color(0xFF6B7280); // Gray
      case 'maintenance':
        return const Color(0xFFF59E0B); // Orange
      case 'emergency':
        return const Color(0xFFEF4444); // Red
      case 'offline':
        return const Color(0xFF374151); // Dark gray
      default:
        return Colors.grey;
    }
  }
}
