// ========================================
// GolfFox Loading Indicator Widget
// Widget de indicador de carregamento
// ========================================

import 'package:flutter/material.dart';
import '../../../core/theme/gf_tokens.dart';

class GfLoadingIndicator extends StatelessWidget {

  const GfLoadingIndicator({
    super.key,
    this.message,
    this.size,
    this.color,
  });
  final String? message;
  final double? size;
  final Color? color;

  @override
  Widget build(BuildContext context) => Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: size ?? 32,
            height: size ?? 32,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              valueColor: AlwaysStoppedAnimation<Color>(
                color ?? Theme.of(context).primaryColor,
              ),
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: GfTokens.spacingMd),
            Text(
              message!,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.color
                        ?.withOpacity(0.7),
                  ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
}
