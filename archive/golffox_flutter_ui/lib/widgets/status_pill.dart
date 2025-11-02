
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class StatusPill extends StatelessWidget {
  final String label;
  final StatusTone tone;
  const StatusPill({super.key, required this.label, required this.tone});

  @override
  Widget build(BuildContext context) {
    final color = statusColor(tone);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
