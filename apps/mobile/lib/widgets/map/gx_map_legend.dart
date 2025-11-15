import 'package:flutter/material.dart';

class GxMapLegend extends StatelessWidget {
  const GxMapLegend({required this.items, super.key});

  factory GxMapLegend.simple({Color? route, Color? stop, Color? vehicle}) =>
      GxMapLegend(
        items: [
          GxLegendItem('Rota', color: route ?? const Color(0xFF2563EB)),
          GxLegendItem('Parada', color: stop ?? const Color(0xFFF59E0B)),
          GxLegendItem('Veiculo', color: vehicle ?? const Color(0xFF16A34A)),
        ],
      );
  final List<GxLegendItem> items;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: items
              .map((e) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: Row(
                      children: [
                        Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                                color: e.color, shape: BoxShape.circle)),
                        const SizedBox(width: 6),
                        Text(e.label, style: t.textTheme.labelMedium),
                      ],
                    ),
                  ))
              .toList(),
        ),
      ),
    );
  }
}

class GxLegendItem {
  const GxLegendItem(this.label, {required this.color});
  final String label;
  final Color color;
}
