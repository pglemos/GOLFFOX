import 'package:flutter/material.dart';

class GxTable extends StatelessWidget {
  final List<String> columns;
  final List<List<Widget>> rows;
  final bool dense;

  const GxTable(
      {super.key,
      required this.columns,
      required this.rows,
      this.dense = false});

  @override
  Widget build(BuildContext context) {
    final heading = Theme.of(context).textTheme.labelLarge;
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        columnSpacing: dense ? 16 : 24,
        headingTextStyle: heading?.copyWith(fontWeight: FontWeight.w800),
        columns: [for (final c in columns) DataColumn(label: Text(c))],
        rows: rows
            .map(
              (r) => DataRow(cells: [for (final cell in r) DataCell(cell)]),
            )
            .toList(),
      ),
    );
  }
}
