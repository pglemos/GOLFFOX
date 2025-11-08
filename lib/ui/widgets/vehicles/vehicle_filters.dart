// ========================================
// GolfFox Vehicle Filters Widget v11.0
// Widget para filtrar veiculos
// ========================================

import 'package:flutter/material.dart';
import '../../../core/theme/gf_tokens.dart';
import '../../../models/vehicle.dart';
import '../../../services/vehicle_service.dart';

class VehicleFiltersWidget extends StatefulWidget {

  const VehicleFiltersWidget({
    required this.filters,
    required this.onFiltersChanged,
    super.key,
  });
  final VehicleFilters filters;
  final ValueChanged<VehicleFilters> onFiltersChanged;

  @override
  State<VehicleFiltersWidget> createState() => _VehicleFiltersWidgetState();
}

class _VehicleFiltersWidgetState extends State<VehicleFiltersWidget>
    with TickerProviderStateMixin {
  late VehicleFilters _currentFilters;
  bool _isExpanded = true;

  late AnimationController _expandController;
  late Animation<double> _expandAnimation;

  @override
  void initState() {
    super.initState();
    _currentFilters = widget.filters;

    _expandController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _expandAnimation = CurvedAnimation(
      parent: _expandController,
      curve: Curves.easeInOut,
    );

    if (_isExpanded) {
      _expandController.forward();
    }
  }

  @override
  void dispose() {
    _expandController.dispose();
    super.dispose();
  }

  void _toggleExpanded() {
    setState(() {
      _isExpanded = !_isExpanded;
      if (_isExpanded) {
        _expandController.forward();
      } else {
        _expandController.reverse();
      }
    });
  }

  void _updateFilters(VehicleFilters newFilters) {
    setState(() {
      _currentFilters = newFilters;
    });
    widget.onFiltersChanged(newFilters);
  }

  void _clearAllFilters() {
    _updateFilters(const VehicleFilters());
  }

  @override
  Widget build(BuildContext context) => DecoratedBox(
      decoration: const BoxDecoration(
        color: Color(GfTokens.colorSurface),
        border: Border(
          bottom: BorderSide(
            color: Color(GfTokens.colorBorder),
          ),
        ),
      ),
      child: Column(
        children: [
          // Cabecalho dos filtros
          InkWell(
            onTap: _toggleExpanded,
            child: Container(
              padding: const EdgeInsets.all(GfTokens.spacingMd),
              child: Row(
                children: [
                  const Icon(
                    Icons.filter_list,
                    color: Color(GfTokens.colorPrimary),
                    size: 20,
                  ),
                  const SizedBox(width: GfTokens.spacingSm),
                  const Text(
                    'Filtros',
                    style: TextStyle(
                      fontSize: GfTokens.fontSizeMd,
                      fontWeight: FontWeight.w600,
                      color: Color(GfTokens.colorOnSurface),
                    ),
                  ),
                  const Spacer(),
                  if (_currentFilters.hasActiveFilters) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: GfTokens.spacingSm,
                        vertical: GfTokens.spacingXs,
                      ),
                      decoration: BoxDecoration(
                        color:
                            const Color(GfTokens.colorPrimary).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(GfTokens.radiusSm),
                      ),
                      child: Text(
                        _getActiveFiltersCount().toString(),
                        style: const TextStyle(
                          fontSize: GfTokens.fontSizeXs,
                          fontWeight: FontWeight.w600,
                          color: Color(GfTokens.colorPrimary),
                        ),
                      ),
                    ),
                    const SizedBox(width: GfTokens.spacingSm),
                    TextButton(
                      onPressed: _clearAllFilters,
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: GfTokens.spacingSm,
                        ),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'Limpar',
                        style: TextStyle(
                          fontSize: GfTokens.fontSizeSm,
                          color: Color(GfTokens.colorPrimary),
                        ),
                      ),
                    ),
                    const SizedBox(width: GfTokens.spacingSm),
                  ],
                  AnimatedRotation(
                    turns: _isExpanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 300),
                    child: const Icon(
                      Icons.keyboard_arrow_down,
                      color: Color(GfTokens.colorOnSurfaceVariant),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Conteudo dos filtros
          SizeTransition(
            sizeFactor: _expandAnimation,
            child: Container(
              padding: const EdgeInsets.fromLTRB(
                GfTokens.spacingMd,
                0,
                GfTokens.spacingMd,
                GfTokens.spacingMd,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Status
                  _buildFilterSection(
                    title: 'Status',
                    child: _buildStatusFilters(),
                  ),

                  const SizedBox(height: GfTokens.spacingMd),

                  // Tipo de veiculo
                  _buildFilterSection(
                    title: 'Tipo de Veiculo',
                    child: _buildTypeFilters(),
                  ),

                  const SizedBox(height: GfTokens.spacingMd),

                  // Combustivel
                  _buildFilterSection(
                    title: 'Combustivel',
                    child: _buildFuelFilters(),
                  ),

                  const SizedBox(height: GfTokens.spacingMd),

                  // Alertas
                  _buildFilterSection(
                    title: 'Alertas',
                    child: _buildAlertFilters(),
                  ),
                ],
              ),
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
            fontSize: GfTokens.fontSizeSm,
            fontWeight: FontWeight.w600,
            color: Color(GfTokens.colorOnSurface),
          ),
        ),
        const SizedBox(height: GfTokens.spacingSm),
        child,
      ],
    );

  Widget _buildStatusFilters() => Wrap(
      spacing: GfTokens.spacingSm,
      runSpacing: GfTokens.spacingSm,
      children: VehicleStatus.values.map((status) {
        final isSelected = _currentFilters.statuses?.contains(status) ?? false;
        return FilterChip(
          label: Text(status.displayName),
          selected: isSelected,
          onSelected: (selected) {
            final currentStatuses =
                List<VehicleStatus>.from(_currentFilters.statuses ?? []);
            if (selected) {
              currentStatuses.add(status);
            } else {
              currentStatuses.remove(status);
            }
            _updateFilters(_currentFilters.copyWith(
              statuses: currentStatuses.isEmpty ? null : currentStatuses,
            ));
          },
          selectedColor: Color(status.colorValue).withValues(alpha: 0.2),
          checkmarkColor: Color(status.colorValue),
          labelStyle: TextStyle(
            color: isSelected
                ? Color(status.colorValue)
                : const Color(GfTokens.colorOnSurface),
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        );
      }).toList(),
    );

  Widget _buildTypeFilters() => Wrap(
      spacing: GfTokens.spacingSm,
      runSpacing: GfTokens.spacingSm,
      children: VehicleType.values.map((type) {
        final isSelected = _currentFilters.types?.contains(type) ?? false;
        return FilterChip(
          label: Text(type.displayName),
          selected: isSelected,
          onSelected: (selected) {
            final currentTypes =
                List<VehicleType>.from(_currentFilters.types ?? []);
            if (selected) {
              currentTypes.add(type);
            } else {
              currentTypes.remove(type);
            }
            _updateFilters(_currentFilters.copyWith(
              types: currentTypes.isEmpty ? null : currentTypes,
            ));
          },
          selectedColor: const Color(GfTokens.colorPrimary).withValues(alpha: 0.2),
          checkmarkColor: const Color(GfTokens.colorPrimary),
          labelStyle: TextStyle(
            color: isSelected
                ? const Color(GfTokens.colorPrimary)
                : const Color(GfTokens.colorOnSurface),
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        );
      }).toList(),
    );

  Widget _buildFuelFilters() => Wrap(
      spacing: GfTokens.spacingSm,
      runSpacing: GfTokens.spacingSm,
      children: FuelType.values.map((fuelType) {
        final isSelected =
            _currentFilters.fuelTypes?.contains(fuelType) ?? false;
        return FilterChip(
          label: Text(fuelType.displayName),
          selected: isSelected,
          onSelected: (selected) {
            final currentFuelTypes =
                List<FuelType>.from(_currentFilters.fuelTypes ?? []);
            if (selected) {
              currentFuelTypes.add(fuelType);
            } else {
              currentFuelTypes.remove(fuelType);
            }
            _updateFilters(_currentFilters.copyWith(
              fuelTypes: currentFuelTypes.isEmpty ? null : currentFuelTypes,
            ));
          },
          selectedColor: const Color(GfTokens.colorSecondary).withValues(alpha: 0.2),
          checkmarkColor: const Color(GfTokens.colorSecondary),
          labelStyle: TextStyle(
            color: isSelected
                ? const Color(GfTokens.colorSecondary)
                : const Color(GfTokens.colorOnSurface),
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        );
      }).toList(),
    );

  Widget _buildAlertFilters() => Column(
      children: [
        CheckboxListTile(
          title: const Text('Precisa de manutencao'),
          subtitle: const Text('Veiculos que precisam de manutencao'),
          value: _currentFilters.needsMaintenance ?? false,
          onChanged: (value) {
            _updateFilters(_currentFilters.copyWith(
              needsMaintenance: value,
            ));
          },
          activeColor: const Color(GfTokens.colorError),
          dense: true,
          contentPadding: EdgeInsets.zero,
        ),
        CheckboxListTile(
          title: const Text('Combustivel baixo'),
          subtitle: const Text('Veiculos com combustivel baixo'),
          value: _currentFilters.hasLowFuel ?? false,
          onChanged: (value) {
            _updateFilters(_currentFilters.copyWith(
              hasLowFuel: value,
            ));
          },
          activeColor: const Color(GfTokens.colorWarning),
          dense: true,
          contentPadding: EdgeInsets.zero,
        ),
        CheckboxListTile(
          title: const Text('Documentos vencendo'),
          subtitle:
              const Text('Veiculos com documentos proximos ao vencimento'),
          value: _currentFilters.hasExpiringDocuments ?? false,
          onChanged: (value) {
            _updateFilters(_currentFilters.copyWith(
              hasExpiringDocuments: value,
            ));
          },
          activeColor: const Color(GfTokens.colorWarning),
          dense: true,
          contentPadding: EdgeInsets.zero,
        ),
      ],
    );

  int _getActiveFiltersCount() {
    var count = 0;
    if (_currentFilters.statuses?.isNotEmpty ?? false) count++;
    if (_currentFilters.types?.isNotEmpty ?? false) count++;
    if (_currentFilters.fuelTypes?.isNotEmpty ?? false) count++;
    if (_currentFilters.needsMaintenance ?? false) count++;
    if (_currentFilters.hasLowFuel ?? false) count++;
    if (_currentFilters.hasExpiringDocuments ?? false) count++;
    return count;
  }
}
