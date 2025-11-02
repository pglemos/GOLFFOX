import 'package:flutter/material.dart';

class GxBadge extends StatelessWidget {
  final String label;
  final Color? color;
  final Color? foregroundColor;
  final IconData? icon;

  const GxBadge(this.label,
      {super.key, this.color, this.foregroundColor, this.icon});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final bg = color ?? cs.secondaryContainer;
    final fg = foregroundColor ?? cs.onSecondaryContainer;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: fg),
            const SizedBox(width: 6),
          ],
          Text(label, style: TextStyle(color: fg, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
