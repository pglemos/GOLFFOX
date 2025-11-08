// ========================================
// GolfFox Driver Filters Panel v11.0
// Painel interativo para filtrar motoristas
// ========================================

import 'package:flutter/material.dart';

import '../../../core/theme/gf_tokens.dart';
import '../../../models/driver.dart';
import '../../../services/driver_service.dart' as driver_services;

class DriverFiltersPanel extends StatefulWidget {
  const DriverFiltersPanel({
    required this.filters, required this.onFiltersChanged, required this.onClearFilters, super.key,
  });

  final driver_services.DriverFilters filters;
  final ValueChanged<driver_services.DriverFilters> onFiltersChanged;
  final VoidCallback onClearFilters;

  @override
  State<DriverFiltersPanel> createState() => _DriverFiltersPanelState();
}

class _DriverFiltersPanelState extends State<DriverFiltersPanel> {
  bool _isExpanded = true;

  driver_services.DriverFilters get _filters => widget.filters;

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
          _buildHeader(),
          if (_isExpanded) _buildBody(),
        ],
      ),
    );

  Widget _buildHeader() => InkWell(
      onTap: () => setState(() => _isExpanded = !_isExpanded),
      child: Padding(
        padding: const EdgeInsets.all(GfTokens.spacingMd),
        child: Row(
          children: [
            const Icon(
              Icons.filter_list,
              color: Color(GfTokens.colorPrimary),
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
            if (_filters.hasActiveFilters) ...[
              const SizedBox(width: GfTokens.spacingSm),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: GfTokens.spacingSm,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: const Color(GfTokens.colorPrimary),
                  borderRadius: BorderRadius.circular(GfTokens.radiusSm),
                ),
                child: Text(
                  '${_filters.activeFiltersCount}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: GfTokens.fontSizeXs,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
            const Spacer(),
            if (_filters.hasActiveFilters)
              TextButton(
                onPressed: () {
                  widget.onClearFilters();
                },
                child: const Text('Limpar'),
              ),
            Icon(
              _isExpanded ? Icons.expand_less : Icons.expand_more,
              color: const Color(GfTokens.colorOnSurfaceVariant),
            ),
          ],
        ),
      ),
    );

  Widget _buildBody() => Padding(
      padding: const EdgeInsets.fromLTRB(
        GfTokens.spacingMd,
        0,
        GfTokens.spacingMd,
        GfTokens.spacingMd,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStatusSection(),
          const SizedBox(height: GfTokens.spacingMd),
          _buildLicenseSection(),
          const SizedBox(height: GfTokens.spacingMd),
          _buildAlertsAndOnlineSection(),
          const SizedBox(height: GfTokens.spacingMd),
          _buildSlidersSection(),
        ],
      ),
    );

  Widget _buildStatusSection() => _buildFilterSection(
      title: 'Status',
      child: Wrap(
        spacing: GfTokens.spacingSm,
        runSpacing: GfTokens.spacingSm,
        children: DriverStatus.values.map((status) {
          final isSelected = _filters.status == status;
          final statusColor = status.colorValue;

          return FilterChip(
            label: Text(status.displayName),
            avatar: Icon(
              status.iconData,
              size: 16,
              color: isSelected ? Colors.white : statusColor,
            ),
            selected: isSelected,
            onSelected: (selected) => _updateFilters(
              _filters.copyWith(status: selected ? status : null),
            ),
            backgroundColor: statusColor.withValues(alpha: 0.12),
            selectedColor: statusColor,
            checkmarkColor: Colors.white,
            labelStyle: TextStyle(
              color: isSelected ? Colors.white : statusColor,
              fontWeight: FontWeight.w500,
            ),
          );
        }).toList(),
      ),
    );

  Widget _buildLicenseSection() => _buildFilterSection(
      title: 'Categoria da Licenca',
      child: Wrap(
        spacing: GfTokens.spacingSm,
        runSpacing: GfTokens.spacingSm,
        children: LicenseCategory.values.map((category) {
          final isSelected = _filters.licenseCategory == category;
          return FilterChip(
            label: Text(category.displayName),
            selected: isSelected,
            onSelected: (selected) => _updateFilters(
              _filters.copyWith(
                licenseCategory: selected ? category : null,
              ),
            ),
          );
        }).toList(),
      ),
    );

  Widget _buildAlertsAndOnlineSection() => Row(
      children: [
        Expanded(
          child: _buildFilterSection(
            title: 'Alertas',
            child: Column(
              children: [
                CheckboxListTile(
                  title: const Text('Motoristas com alertas'),
                  value: _filters.hasAlerts ?? false,
                  onChanged: (value) {
                    final shouldFilter = value ?? false;
                    _updateFilters(
                      _filters.copyWith(
                        hasAlerts: shouldFilter ? true : null,
                      ),
                    );
                  },
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                ),
                CheckboxListTile(
                  title: const Text('Documentos vencendo'),
                  value: _filters.hasExpiredDocuments ?? false,
                  onChanged: (value) {
                    final shouldFilter = value ?? false;
                    _updateFilters(
                      _filters.copyWith(
                        hasExpiredDocuments: shouldFilter ? true : null,
                      ),
                    );
                  },
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: GfTokens.spacingMd),
        Expanded(
          child: _buildFilterSection(
            title: 'Status Online',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                DropdownButtonFormField<bool?>(
                  initialValue: _filters.isOnline,
                  isExpanded: true,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: GfTokens.spacingSm,
                      vertical: GfTokens.spacingXs,
                    ),
                  ),
                  items: const [
                    DropdownMenuItem<bool?>(
                      child: Text('Todos'),
                    ),
                    DropdownMenuItem<bool?>(
                      value: true,
                      child: Text('Online'),
                    ),
                    DropdownMenuItem<bool?>(
                      value: false,
                      child: Text('Offline'),
                    ),
                  ],
                  onChanged: (value) => _updateFilters(
                    _filters.copyWith(isOnline: value),
                  ),
                ),
                const SizedBox(height: GfTokens.spacingXs),
                const Text(
                  'Selecione para limitar os resultados pelo status atual.',
                  style: TextStyle(
                    fontSize: GfTokens.fontSizeXs,
                    color: Color(GfTokens.colorOnSurfaceVariant),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );

  Widget _buildSlidersSection() => Row(
      children: [
        Expanded(
          child: _buildFilterSection(
            title: 'Avaliacao Minima',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Slider(
                  value: _filters.minRating ?? 0.0,
                  max: 5,
                  divisions: 10,
                  label: (_filters.minRating ?? 0.0).toStringAsFixed(1),
                  onChanged: (value) => _updateFilters(
                    _filters.copyWith(
                      minRating: value > 0 ? value : null,
                    ),
                  ),
                ),
                Text(
                  'Minimo: ${(_filters.minRating ?? 0.0).toStringAsFixed(1)} estrelas',
                  style: const TextStyle(
                    fontSize: GfTokens.fontSizeSm,
                    color: Color(GfTokens.colorOnSurfaceVariant),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: GfTokens.spacingMd),
        Expanded(
          child: _buildFilterSection(
            title: 'Viagens Minimas',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Slider(
                  value: (_filters.minTrips ?? 0).toDouble(),
                  max: 100,
                  divisions: 20,
                  label: (_filters.minTrips ?? 0).toString(),
                  onChanged: (value) => _updateFilters(
                    _filters.copyWith(
                      minTrips: value.toInt() > 0 ? value.toInt() : null,
                    ),
                  ),
                ),
                Text(
                  'Minimo: ${_filters.minTrips ?? 0} viagens',
                  style: const TextStyle(
                    fontSize: GfTokens.fontSizeSm,
                    color: Color(GfTokens.colorOnSurfaceVariant),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
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

  void _updateFilters(driver_services.DriverFilters filters) {
    widget.onFiltersChanged(filters);
  }
}
