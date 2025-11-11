// ========================================
// GolfFox Route Filters Widget v11.0
// Filtros para a pagina de rotas
// ========================================

import 'package:flutter/material.dart';

import '../../../core/theme/gf_tokens.dart';
import '../../../models/route.dart';

class RouteFilters extends StatefulWidget {

  const RouteFilters({
    required this.onStatusChanged,
    required this.onVehicleChanged,
    required this.onDriverChanged,
    required this.onClearFilters,
    this.selectedStatus,
    this.selectedVehicle,
    this.selectedDriver,
    super.key,
  });
  final RouteStatus? selectedStatus;
  final String? selectedVehicle;
  final String? selectedDriver;
  final ValueChanged<RouteStatus?> onStatusChanged;
  final ValueChanged<String?> onVehicleChanged;
  final ValueChanged<String?> onDriverChanged;
  final VoidCallback onClearFilters;

  @override
  State<RouteFilters> createState() => _RouteFiltersState();
}

class _RouteFiltersState extends State<RouteFilters> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final hasActiveFilters = widget.selectedStatus != null ||
        widget.selectedVehicle != null ||
        widget.selectedDriver != null;

    return Column(
      children: [
        // Cabecalho dos filtros
        Row(
          children: [
            Icon(
              Icons.filter_list,
              size: 20,
              color: hasActiveFilters
                  ? const Color(GfTokens.primary)
                  : const Color(GfTokens.colorOnSurfaceVariant),
            ),
            const SizedBox(width: 8),
            Text(
              'Filtros',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: hasActiveFilters
                    ? const Color(GfTokens.primary)
                    : const Color(GfTokens.colorOnSurface),
              ),
            ),
            if (hasActiveFilters) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: GfTokens.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _getActiveFiltersCount().toString(),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(GfTokens.primary),
                  ),
                ),
              ),
            ],
            const Spacer(),
            if (hasActiveFilters)
              TextButton.icon(
                onPressed: widget.onClearFilters,
                icon: const Icon(Icons.clear, size: 16),
                label: const Text('Limpar'),
                style: TextButton.styleFrom(
                  foregroundColor: const Color(GfTokens.error),
                ),
              ),
            IconButton(
              onPressed: () => setState(() => _isExpanded = !_isExpanded),
              icon: Icon(
                _isExpanded ? Icons.expand_less : Icons.expand_more,
                color: const Color(GfTokens.colorOnSurfaceVariant),
              ),
            ),
          ],
        ),

        // Filtros ativos (sempre visiveis)
        if (hasActiveFilters) ...[
          const SizedBox(height: GfTokens.space2),
          _buildActiveFilters(),
        ],

        // Filtros expandidos
        if (_isExpanded) ...[
          const SizedBox(height: GfTokens.space3),
          _buildExpandedFilters(),
        ],
      ],
    );
  }

  Widget _buildActiveFilters() => Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        if (widget.selectedStatus != null)
          _buildFilterChip(
            label: widget.selectedStatus!.displayName,
            color: Color(widget.selectedStatus!.colorValue),
            onDeleted: () => widget.onStatusChanged(null),
          ),
        if (widget.selectedVehicle != null)
          _buildFilterChip(
            label: 'Veiculo ${widget.selectedVehicle}',
            color: const Color(GfTokens.primary),
            onDeleted: () => widget.onVehicleChanged(null),
          ),
        if (widget.selectedDriver != null)
          _buildFilterChip(
            label: 'Motorista ${widget.selectedDriver}',
            color: const Color(GfTokens.primary),
            onDeleted: () => widget.onDriverChanged(null),
          ),
      ],
    );

  Widget _buildFilterChip({
    required String label,
    required Color color,
    required VoidCallback onDeleted,
  }) => Chip(
      label: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          color: color,
          fontWeight: FontWeight.w500,
        ),
      ),
      backgroundColor: color.withOpacity(0.1),
      side: BorderSide(color: color.withOpacity(0.3)),
      deleteIcon: Icon(
        Icons.close,
        size: 16,
        color: color,
      ),
      onDeleted: onDeleted,
    );

  Widget _buildExpandedFilters() => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Filtro por Status
        const Text(
          'Status da Rota',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(GfTokens.colorOnSurface),
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: RouteStatus.values.map((status) {
            final isSelected = widget.selectedStatus == status;
            return FilterChip(
              label: Text(status.displayName),
              selected: isSelected,
              onSelected: (selected) {
                widget.onStatusChanged(selected ? status : null);
              },
              backgroundColor: Colors.transparent,
              selectedColor: status.colorValue.withValues(alpha: 0.1),
              checkmarkColor: Color(status.colorValue),
              side: BorderSide(
                color: isSelected
                    ? Color(status.colorValue)
                    : const Color(GfTokens.stroke),
              ),
              labelStyle: TextStyle(
                color: isSelected
                    ? Color(status.colorValue)
                    : const Color(GfTokens.textBody),
                fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
              ),
            );
          }).toList(),
        ),

        const SizedBox(height: GfTokens.space4),

        // Filtro por Veiculo
        const Text(
          'Veiculo',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(GfTokens.colorOnSurface),
          ),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          initialValue: widget.selectedVehicle,
          decoration: InputDecoration(
            hintText: 'Selecionar veiculo',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 8,
            ),
          ),
          items: _getVehicleOptions()
              .map(
                (vehicle) => DropdownMenuItem(
                  value: vehicle,
                  child: Text('Veiculo $vehicle'),
                ),
              )
              .toList(),
          onChanged: widget.onVehicleChanged,
        ),

        const SizedBox(height: GfTokens.space3),

        // Filtro por Motorista
        const Text(
          'Motorista',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(GfTokens.textTitle),
          ),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          initialValue: widget.selectedDriver,
          decoration: InputDecoration(
            hintText: 'Selecionar motorista',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 8,
            ),
          ),
          items: _getDriverOptions()
              .map(
                (driver) => DropdownMenuItem(
                  value: driver,
                  child: Text('Motorista $driver'),
                ),
              )
              .toList(),
          onChanged: widget.onDriverChanged,
        ),
      ],
    );

  int _getActiveFiltersCount() {
    var count = 0;
    if (widget.selectedStatus != null) count++;
    if (widget.selectedVehicle != null) count++;
    if (widget.selectedDriver != null) count++;
    return count;
  }

  List<String> _getVehicleOptions() =>
      ['001', '002', '003', '004', '005'];

  List<String> _getDriverOptions() => [
        'Joao Silva',
        'Maria Santos',
        'Pedro Oliveira',
        'Ana Costa',
        'Carlos Lima'
      ];
}
