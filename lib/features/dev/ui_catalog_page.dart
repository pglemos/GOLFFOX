import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:fl_chart/fl_chart.dart';

import '../../widgets/gx_button.dart';
import '../../widgets/gx_input.dart';
import '../../widgets/gx_card.dart';
import '../../widgets/gx_badge.dart';
import '../../widgets/gx_status_pill.dart';
import '../../widgets/gx_toast.dart';
import '../../widgets/gx_dialog.dart';
import '../../widgets/gx_skeleton.dart';
import '../../widgets/gx_empty.dart';
import '../../widgets/gx_segmented.dart';
import '../../widgets/gx_search_field.dart';
import '../../widgets/gx_kpi_tile.dart';
import '../../widgets/gx_table.dart';
import '../../widgets/map/gx_map.dart';
import '../../widgets/map/gx_map_legend.dart';
import '../../widgets/charts/gx_line_chart.dart';
import '../../widgets/charts/gx_donut.dart';

class UiCatalogPage extends StatelessWidget {
  const UiCatalogPage({super.key});

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('UI Catalog')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              GxCard(child: Text('Card padrao')),
              GxBadge('Badge'),
              GxStatusPill(label: 'Ativo', status: GxStatus.success),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(spacing: 10, children: [
            GxButton('Primario',
                onPressed: () =>
                    showGxToast(context, 'Ok', type: GxToastType.success)),
            const GxButton('Secundario', primary: false),
            const GxButton('Loading', loading: true),
          ]),
          const SizedBox(height: 12),
          const GxInput(label: 'Input', hint: 'Digite algo', icon: Icons.edit),
          const SizedBox(height: 12),
          Row(children: [
            const Expanded(child: GxSearchField(hint: 'Buscar item...')),
            const SizedBox(width: 10),
            GxSegmented(
                values: const ['Dia', 'Semana', 'Mes'],
                selected: 'Dia',
                labelOf: (s) => s,
                onChanged: (_) {}),
          ]),
          const SizedBox(height: 12),
          const Row(children: [
            Expanded(
                child: GxKpiTile(
                    title: 'Entregas',
                    value: '128',
                    delta: 3.4,
                    suffix: 'hoje')),
            SizedBox(width: 10),
            Expanded(
                child: GxKpiTile(title: 'Atrasos', value: '5', delta: -1.1)),
          ]),
          const SizedBox(height: 12),
          const SizedBox(
            height: 160,
            child: GxLineChart(points: [
              FlSpot(0, 1),
              FlSpot(1, 1.5),
              FlSpot(2, 1.2),
              FlSpot(3, 2.2),
              FlSpot(4, 1.8),
            ]),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 180,
            child: GxDonut(
              center: Text('Distribuicao', style: t.textTheme.labelLarge),
              slices: const [
                GxDonutSlice(value: 30, color: Colors.blue, label: 'A'),
                GxDonutSlice(value: 20, color: Colors.orange, label: 'B'),
                GxDonutSlice(value: 50, color: Colors.green, label: 'C'),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 220,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: GxMap(
                center: const LatLng(-23.5505, -46.6333),
                legend: GxMapLegend.simple(),
              ),
            ),
          ),
          const SizedBox(height: 12),
          const GxTable(
            columns: ['ID', 'Status', 'Notas'],
            rows: [
              [
                Text('TR-001'),
                Text('inProgress'),
                Text('Rota Centro')
              ],
              [
                Text('TR-002'),
                Text('scheduled'),
                Text('Rota Sul')
              ],
            ],
          ),
          const SizedBox(height: 12),
          const Row(children: [
            Expanded(child: GxSkeleton(height: 18)),
            SizedBox(width: 10),
            Expanded(child: GxSkeleton(height: 18)),
          ]),
          const SizedBox(height: 12),
          const GxEmpty(
              title: 'Nada por aqui',
              message: 'Experimente ajustar os filtros ou criar um novo item.'),
          const SizedBox(height: 24),
          Align(
            alignment: Alignment.centerLeft,
            child: GxButton('Dialogo',
                onPressed: () => showGxDialog(
                    context: context,
                    title: 'Confirmacao',
                    message: 'Deseja continuar?')),
          ),
        ],
      ),
    );
  }
}
