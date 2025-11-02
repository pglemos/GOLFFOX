import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

class GxLineChart extends StatelessWidget {
  final List<FlSpot> points;
  final Color? color;
  final double strokeWidth;
  final bool showDots;

  const GxLineChart(
      {super.key,
      required this.points,
      this.color,
      this.strokeWidth = 3,
      this.showDots = false});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final c = color ?? cs.primary;
    return LineChart(
      LineChartData(
        gridData: const FlGridData(show: false),
        titlesData: const FlTitlesData(show: false),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          LineChartBarData(
            spots: points,
            isCurved: true,
            color: c,
            barWidth: strokeWidth,
            dotData: FlDotData(show: showDots),
            belowBarData:
                BarAreaData(show: true, color: c.withValues(alpha: 0.12)),
          )
        ],
      ),
    );
  }
}
