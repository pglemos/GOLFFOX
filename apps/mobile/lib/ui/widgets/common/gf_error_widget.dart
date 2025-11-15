// ========================================
// GolfFox Error Widget
// Widget de exibicao de erros
// ========================================

import 'package:flutter/material.dart';

import '../../../core/services/error_service.dart';
import '../../../core/theme/gf_tokens.dart';

class GfErrorWidget extends StatelessWidget {

  const GfErrorWidget({
    required this.message,
    super.key,
    this.onRetry,
    this.icon,
  });
  /// Fábrica para criar a partir de um erro, usando mensagens amigáveis
  factory GfErrorWidget.fromError({
    required Object error,
    Key? key,
    VoidCallback? onRetry,
    IconData? icon,
  }) => GfErrorWidget(
        key: key,
        message: ErrorService.instance.getUserFriendlyMessage(error),
        onRetry: onRetry,
        icon: icon,
      );

  final String message;
  final VoidCallback? onRetry;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => Center(
      child: Padding(
        padding: const EdgeInsets.all(GfTokens.spacingLg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon ?? Icons.error_outline,
              size: 64,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: GfTokens.spacingMd),
            Text(
              'Ops! Algo deu errado',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: Theme.of(context).colorScheme.error,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: GfTokens.spacingSm),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: GfTokens.spacingLg),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Tentar Novamente'),
              ),
            ],
          ],
        ),
      ),
    );
}
