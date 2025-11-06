import 'package:flutter/material.dart';
import 'gx_status_pill.dart';

class GxTripTile extends StatelessWidget {

  const GxTripTile({
    super.key,
    required this.title,
    required this.subtitle,
    required this.meta,
    this.status = GxStatus.neutral,
    this.onTap,
  });
  final String title;
  final String subtitle;
  final String meta;
  final GxStatus status;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(Icons.route, color: t.colorScheme.primary),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: t.textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(subtitle,
                        style: t.textTheme.bodyMedium
                            ?.copyWith(color: t.colorScheme.onSurfaceVariant)),
                    const SizedBox(height: 8),
                    Text(meta,
                        style: t.textTheme.labelMedium
                            ?.copyWith(color: t.colorScheme.onSurfaceVariant)),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              GxStatusPill(label: _labelFor(status), status: status),
            ],
          ),
        ),
      ),
    );
  }

  String _labelFor(GxStatus s) => switch (s) {
        GxStatus.success => 'Ativa',
        GxStatus.warning => 'Atencao',
        GxStatus.error => 'Erro',
        GxStatus.info => 'Info',
        _ => '-',
      };
}
