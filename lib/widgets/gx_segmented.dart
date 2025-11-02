import 'package:flutter/material.dart';

class GxSegmented<T> extends StatelessWidget {
  final List<T> values;
  final T selected;
  final String Function(T) labelOf;
  final ValueChanged<T> onChanged;

  const GxSegmented(
      {super.key,
      required this.values,
      required this.selected,
      required this.labelOf,
      required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SegmentedButton<T>(
      segments: values
          .map((v) => ButtonSegment<T>(value: v, label: Text(labelOf(v))))
          .toList(),
      selected: {selected},
      onSelectionChanged: (s) => onChanged(s.first),
    );
  }
}
