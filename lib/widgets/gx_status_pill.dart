import 'package:flutter/material.dart';

enum GxStatus { success, warning, info, error, neutral }

class GxStatusPill extends StatelessWidget {
  final String label;
  final GxStatus status;
  const GxStatusPill(
      {super.key, required this.label, this.status = GxStatus.neutral});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final (bg, fg) = switch (status) {
      GxStatus.success => (cs.primaryContainer, cs.onPrimaryContainer),
      GxStatus.warning => (cs.tertiaryContainer, cs.onTertiaryContainer),
      GxStatus.error => (cs.errorContainer, cs.onErrorContainer),
      GxStatus.info => (cs.secondaryContainer, cs.onSecondaryContainer),
      _ => (cs.surfaceContainerHighest, cs.onSurfaceVariant),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration:
          BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child:
          Text(label, style: TextStyle(color: fg, fontWeight: FontWeight.w700)),
    );
  }
}
