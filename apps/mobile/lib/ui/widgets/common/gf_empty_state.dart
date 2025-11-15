// ========================================
// GolfFox Empty State Widget
// Widget de estado vazio
// ========================================

import 'package:flutter/material.dart';
import '../../../core/theme/gf_tokens.dart';

class GfEmptyState extends StatelessWidget {

  const GfEmptyState({
    required this.title,
    super.key,
    this.subtitle,
    this.icon,
    this.action,
    this.imagePath,
  });
  final String title;
  final String? subtitle;
  final IconData? icon;
  final Widget? action;
  final String? imagePath;

  @override
  Widget build(BuildContext context) => Center(
      child: Padding(
        padding: const EdgeInsets.all(GfTokens.spacingLg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (imagePath != null)
              Image.asset(
                imagePath!,
                width: 120,
                height: 120,
                fit: BoxFit.contain,
              )
            else
              Icon(
                icon ?? Icons.inbox_outlined,
                size: 80,
                color: Theme.of(context).colorScheme.outline,
              ),
            const SizedBox(height: GfTokens.spacingLg),
            Text(
              title,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: GfTokens.spacingSm),
              Text(
                subtitle!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.outline,
                    ),
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: GfTokens.spacingLg),
              action!,
            ],
          ],
        ),
      ),
    );
}
