import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

class GxDonut extends StatelessWidget {

  const GxDonut({
    required this.slices,
    this.centerSpace = 36,
    this.center,
    super.key,
  });
  final List<GxDonutSlice> slices;
  final double centerSpace;
  final Widget? center;

  @override
  Widget build(BuildContext context) {
    final total = slices.fold<double>(0, (a, b) => a + b.value);
    return Stack(
      alignment: Alignment.center,
      children: [
        PieChart(
          PieChartData(
            sectionsSpace: 2,
            centerSpaceRadius: centerSpace,
            sections: slices
                .map((s) => PieChartSectionData(
                      color: s.color,
                      value: s.value,
                      title: total > 0
                          ? '${((s.value / total) * 100).toStringAsFixed(0)}%'
                          : '',
                      radius: 46,
                      titleStyle: const TextStyle(
                          fontWeight: FontWeight.w700, color: Colors.white),
                    ))
                .toList(),
          ),
        ),
        if (center != null) center!,
      ],
    );
  }
}

class GxDonutSlice {
  const GxDonutSlice({
    required this.value,
    required this.color,
    required this.label,
  });
  final double value;
  final Color color;
  final String label;
}
