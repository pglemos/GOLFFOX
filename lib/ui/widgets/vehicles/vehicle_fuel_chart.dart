// ========================================
// GolfFox Vehicle Fuel Chart v11.0
// Widget para exibir grafico e historico de combustivel
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/gf_tokens.dart';
import '../../../models/fuel_record.dart';
import '../../../services/vehicle_service.dart';

class VehicleFuelChart extends ConsumerStatefulWidget {

  const VehicleFuelChart({
    super.key,
    required this.vehicleId,
  });
  final String vehicleId;

  @override
  ConsumerState<VehicleFuelChart> createState() => _VehicleFuelChartState();
}

class _VehicleFuelChartState extends ConsumerState<VehicleFuelChart> {
  String _selectedPeriod = '30'; // dias

  @override
  Widget build(BuildContext context) {
    final vehicleService = ref.watch(vehicleServiceProvider);

    return FutureBuilder<List<FuelRecord>>(
      future: vehicleService.getVehicleFuelRecords(widget.vehicleId),
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
                  'Erro ao carregar dados de combustivel',
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
                const SizedBox(height: GfTokens.spacingMd),
                ElevatedButton(
                  onPressed: () => setState(() {}),
                  child: const Text('Tentar Novamente'),
                ),
              ],
            ),
          );
        }

        final records = snapshot.data!;
        final filteredRecords = _filterRecordsByPeriod(records);
        final stats = FuelConsumptionStats.fromRecords(
          filteredRecords,
          DateTime.now().subtract(Duration(days: int.parse(_selectedPeriod))),
          DateTime.now(),
        );

        return Column(
          children: [
            // Filtros de periodo
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
                    'Periodo:',
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
                          _buildPeriodChip('7', '7 dias'),
                          const SizedBox(width: GfTokens.spacingSm),
                          _buildPeriodChip('30', '30 dias'),
                          const SizedBox(width: GfTokens.spacingSm),
                          _buildPeriodChip('90', '3 meses'),
                          const SizedBox(width: GfTokens.spacingSm),
                          _buildPeriodChip('365', '1 ano'),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Expanded(
              child: filteredRecords.isEmpty
                  ? _buildEmptyState()
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(GfTokens.spacingMd),
                      child: Column(
                        children: [
                          // Estatisticas
                          _buildStatsCards(stats),
                          const SizedBox(height: GfTokens.spacingMd),

                          // Grafico simples
                          _buildSimpleChart(filteredRecords),
                          const SizedBox(height: GfTokens.spacingMd),

                          // Lista de registros
                          _buildRecordsList(filteredRecords),
                        ],
                      ),
                    ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildPeriodChip(String value, String label) {
    final isSelected = _selectedPeriod == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedPeriod = value;
        });
      },
      backgroundColor:
          isSelected ? GfTokens.colorPrimary.withValues(alpha: 0.1) : null,
      selectedColor: GfTokens.colorPrimary.withValues(alpha: 0.2),
      checkmarkColor: const Color(GfTokens.colorPrimary),
      side: BorderSide(
        color: isSelected
            ? const Color(GfTokens.colorPrimary)
            : const Color(GfTokens.colorBorder),
      ),
    );
  }

  Widget _buildStatsCards(FuelConsumptionStats stats) => Row(
      children: [
        Expanded(
          child: _buildStatCard(
            'Consumo Medio',
            '${stats.averageConsumption.toStringAsFixed(1)} km/L',
            Icons.speed,
            const Color(GfTokens.colorPrimary),
          ),
        ),
        const SizedBox(width: GfTokens.spacingSm),
        Expanded(
          child: _buildStatCard(
            'Gasto Total',
            'R\$ ${stats.totalCost.toStringAsFixed(2)}',
            Icons.attach_money,
            const Color(GfTokens.colorSuccess),
          ),
        ),
        const SizedBox(width: GfTokens.spacingSm),
        Expanded(
          child: _buildStatCard(
            'Abastecimentos',
            '${stats.totalRefuels}',
            Icons.local_gas_station,
            const Color(GfTokens.colorInfo),
          ),
        ),
      ],
    );

  Widget _buildStatCard(
      String title, String value, IconData icon, Color color) => Container(
      padding: const EdgeInsets.all(GfTokens.spacingMd),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(GfTokens.radiusSm),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: GfTokens.spacingSm),
          Text(
            value,
            style: TextStyle(
              fontSize: GfTokens.fontSizeLg,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
          Text(
            title,
            style: const TextStyle(
              fontSize: GfTokens.fontSizeSm,
              color: Color(GfTokens.colorOnSurfaceVariant),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );

  Widget _buildSimpleChart(List<FuelRecord> records) {
    if (records.length < 2) return const SizedBox.shrink();

    // Ordenar por data
    final sortedRecords = List<FuelRecord>.from(records)
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(GfTokens.spacingMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Consumo ao Longo do Tempo',
              style: TextStyle(
                fontSize: GfTokens.fontSizeLg,
                fontWeight: FontWeight.w600,
                color: Color(GfTokens.colorOnSurface),
              ),
            ),
            const SizedBox(height: GfTokens.spacingMd),

            // Grafico simples com barras
            SizedBox(
              height: 200,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: sortedRecords.map((record) {
                  final quantity = record.quantity;
                  final maxQuantity = sortedRecords
                      .map((r) => r.quantity)
                      .reduce((a, b) => a > b ? a : b);

                  final height =
                      maxQuantity > 0 ? (quantity / maxQuantity) * 160.0 : 0.0;

                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 2),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Container(
                            height: height,
                            decoration: const BoxDecoration(
                              color: Color(GfTokens.colorPrimary),
                              borderRadius: BorderRadius.vertical(
                                top: Radius.circular(4),
                              ),
                            ),
                          ),
                          const SizedBox(height: GfTokens.spacingXs),
                          Text(
                            '${record.timestamp.day}/${record.timestamp.month}',
                            style: const TextStyle(
                              fontSize: GfTokens.fontSizeXs,
                              color:
                                  Color(GfTokens.colorOnSurfaceVariant),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecordsList(List<FuelRecord> records) {
    // Ordenar por data (mais recente primeiro)
    final sortedRecords = List<FuelRecord>.from(records)
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(GfTokens.spacingMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Historico de Abastecimentos',
              style: TextStyle(
                fontSize: GfTokens.fontSizeLg,
                fontWeight: FontWeight.w600,
                color: Color(GfTokens.colorOnSurface),
              ),
            ),
            const SizedBox(height: GfTokens.spacingMd),
            ...sortedRecords.take(10).map(_buildRecordItem),
            if (sortedRecords.length > 10)
              Padding(
                padding: const EdgeInsets.only(top: GfTokens.spacingMd),
                child: Center(
                  child: TextButton(
                    onPressed: () {
                      // TODO: Mostrar todos os registros
                    },
                    child: Text('Ver todos (${sortedRecords.length})'),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecordItem(FuelRecord record) => Container(
      margin: const EdgeInsets.only(bottom: GfTokens.spacingMd),
      padding: const EdgeInsets.all(GfTokens.spacingMd),
      decoration: BoxDecoration(
        color: record.type.colorValue.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(GfTokens.radiusSm),
        border: Border.all(
          color: record.type.colorValue.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          // Icone do tipo
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: record.type.colorValue.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(GfTokens.radiusSm),
            ),
            child: Icon(
              record.type == FuelRecordType.refuel
                  ? Icons.local_gas_station
                  : Icons.trending_down,
              color: Color(record.type.colorValue),
              size: 20,
            ),
          ),
          const SizedBox(width: GfTokens.spacingMd),

          // Informacoes
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      record.type.displayName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Color(GfTokens.colorOnSurface),
                      ),
                    ),
                    Text(
                      'R\$ ${record.totalCost.toStringAsFixed(2)}',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: Color(record.type.colorValue),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: GfTokens.spacingXs),
                Row(
                  children: [
                    Text(
                      '${record.quantity.toStringAsFixed(1)}L',
                      style: const TextStyle(
                        fontSize: GfTokens.fontSizeSm,
                        color: Color(GfTokens.colorOnSurfaceVariant),
                      ),
                    ),
                    const SizedBox(width: GfTokens.spacingMd),
                    Text(
                      '${record.odometerReading.toStringAsFixed(0)} km',
                      style: const TextStyle(
                        fontSize: GfTokens.fontSizeSm,
                        color: Color(GfTokens.colorOnSurfaceVariant),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: GfTokens.spacingXs),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _formatDate(record.timestamp),
                      style: const TextStyle(
                        fontSize: GfTokens.fontSizeSm,
                        color: Color(GfTokens.colorOnSurfaceVariant),
                      ),
                    ),
                    if (record.fuelStationName != null)
                      Text(
                        record.fuelStationName!,
                        style: const TextStyle(
                          fontSize: GfTokens.fontSizeSm,
                          color: Color(GfTokens.colorOnSurfaceVariant),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );

  Widget _buildEmptyState() => Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.local_gas_station_outlined,
            size: 64,
            color: Color(GfTokens.colorOnSurfaceVariant),
          ),
          const SizedBox(height: GfTokens.spacingMd),
          const Text(
            'Nenhum registro de combustivel',
            style: TextStyle(
              fontSize: GfTokens.fontSizeLg,
              fontWeight: FontWeight.w600,
              color: Color(GfTokens.colorOnSurface),
            ),
          ),
          const SizedBox(height: GfTokens.spacingSm),
          const Text(
            'Este veiculo ainda nao possui registros de abastecimento.',
            style: TextStyle(
              color: Color(GfTokens.colorOnSurfaceVariant),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: GfTokens.spacingMd),
          ElevatedButton.icon(
            onPressed: () {
              // TODO: Navegar para registrar abastecimento
            },
            icon: const Icon(Icons.add),
            label: const Text('Registrar Abastecimento'),
          ),
        ],
      ),
    );

  List<FuelRecord> _filterRecordsByPeriod(List<FuelRecord> records) {
    final days = int.parse(_selectedPeriod);
    final cutoffDate = DateTime.now().subtract(Duration(days: days));

    return records
        .where((record) => record.timestamp.isAfter(cutoffDate))
        .toList();
  }

  String _formatDate(DateTime date) => '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
}
