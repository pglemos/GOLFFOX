
import 'package:auto_size_text/auto_size_text.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

class KpiCard extends StatelessWidget {
  final String title;
  final String value;
  final List<double> series;
  final String? subtitle;
  final Color? accent;
  const KpiCard({
    super.key,
    required this.title,
    required this.value,
    required this.series,
    this.subtitle,
    this.accent,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: Theme.of(context).textTheme.labelLarge),
                      const SizedBox(height: 12),
                      AutoSizeText(value, maxLines: 1, style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w700)),
                      if (subtitle != null) ...[
                        const SizedBox(height: 6),
                        Text(subtitle!, style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(
              height: 42,
              child: _buildSparkline(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSparkline(BuildContext context) {
    final baseColor = accent ?? Theme.of(context).colorScheme.primary;
    final spots = <FlSpot>[];

    for (var i = 0; i < series.length; i++) {
      final value = series[i];
      if (value.isFinite) {
        spots.add(FlSpot(i.toDouble(), value));
      }
    }

    if (spots.isEmpty) {
      return Align(
        alignment: Alignment.centerLeft,
        child: Container(
          height: 4,
          decoration: BoxDecoration(
            color: baseColor.withValues(alpha: 0.25),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      );
    }

    if (spots.length == 1) {
      final onlySpot = spots.first;
      spots.add(FlSpot(onlySpot.x + 1, onlySpot.y));
    }

    final gradient = LinearGradient(
      colors: [
        baseColor.withValues(alpha: 0.25),
        Colors.transparent,
      ],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    );

    return LineChart(
      LineChartData(
        gridData: const FlGridData(show: false),
        titlesData: const FlTitlesData(show: false),
        borderData: FlBorderData(show: false),
        lineTouchData: const LineTouchData(enabled: false),
        lineBarsData: [
          LineChartBarData(
            isCurved: true,
            spots: spots,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              gradient: gradient,
            ),
            color: baseColor,
            barWidth: 3,
          ),
        ],
      ),
    );
  }
}
