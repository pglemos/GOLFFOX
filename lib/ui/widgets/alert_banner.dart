// ========================================
// GolfFox Alert Banner v11.0 - Clear Theme
// Widget para exibir alertas importantes
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/gf_tokens.dart';

class GfAlertBanner extends StatelessWidget {
  final String message;
  final String actionText;
  final VoidCallback onActionTap;
  final AlertSeverity severity;
  final bool isDismissible;
  final VoidCallback? onDismiss;

  const GfAlertBanner({
    super.key,
    required this.message,
    required this.actionText,
    required this.onActionTap,
    this.severity = AlertSeverity.warning,
    this.isDismissible = false,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final colors = _getColorsForSeverity(severity);

    return Container(
      padding: const EdgeInsets.all(GfTokens.space4),
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: BorderRadius.circular(GfTokens.radius),
        border: Border.all(
          color: colors.border,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          // ========================================
          // ICONE DE SEVERIDADE
          // ========================================
          Container(
            padding: const EdgeInsets.all(GfTokens.space2),
            decoration: BoxDecoration(
              color: colors.icon.withOpacity(0.1),
              borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
            ),
            child: Icon(
              _getIconForSeverity(severity),
              color: colors.icon,
              size: 20,
            ),
          ),

          const SizedBox(width: GfTokens.space3),

          // ========================================
          // MENSAGEM
          // ========================================
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: colors.text,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),

          const SizedBox(width: GfTokens.space3),

          // ========================================
          // BOTAO DE ACAO
          // ========================================
          TextButton(
            onPressed: onActionTap,
            style: TextButton.styleFrom(
              foregroundColor: colors.action,
              padding: const EdgeInsets.symmetric(
                horizontal: GfTokens.space3,
                vertical: GfTokens.space2,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
              ),
            ),
            child: Text(
              actionText,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),

          // ========================================
          // BOTAO DE DISPENSAR (opcional)
          // ========================================
          if (isDismissible) ...[
            const SizedBox(width: GfTokens.space2),
            IconButton(
              onPressed: onDismiss,
              icon: const Icon(Icons.close),
              iconSize: 18,
              color: colors.text,
              padding: const EdgeInsets.all(GfTokens.space1),
              constraints: const BoxConstraints(
                minWidth: 32,
                minHeight: 32,
              ),
            ),
          ],
        ],
      ),
    ).animate().fadeIn(duration: 300.ms).slideY(begin: -0.1, end: 0);
  }

  _AlertColors _getColorsForSeverity(AlertSeverity severity) {
    switch (severity) {
      case AlertSeverity.info:
        return _AlertColors(
          background: const Color(0xFFF0F9FF),
          border: const Color(0xFFBAE6FD),
          icon: const Color(0xFF0284C7),
          text: const Color(0xFF0C4A6E),
          action: const Color(0xFF0284C7),
        );
      case AlertSeverity.success:
        return _AlertColors(
          background: const Color(0xFFF0FDF4),
          border: const Color(0xFFBBF7D0),
          icon: const Color(GfTokens.success),
          text: const Color(0xFF14532D),
          action: const Color(GfTokens.success),
        );
      case AlertSeverity.warning:
        return _AlertColors(
          background: const Color(0xFFFFFBEB),
          border: const Color(0xFFFED7AA),
          icon: const Color(GfTokens.warning),
          text: const Color(0xFF92400E),
          action: const Color(GfTokens.warning),
        );
      case AlertSeverity.error:
        return _AlertColors(
          background: const Color(0xFFFEF2F2),
          border: const Color(0xFFFECACA),
          icon: const Color(GfTokens.danger),
          text: const Color(0xFF991B1B),
          action: const Color(GfTokens.danger),
        );
    }
  }

  IconData _getIconForSeverity(AlertSeverity severity) {
    switch (severity) {
      case AlertSeverity.info:
        return Icons.info_outline;
      case AlertSeverity.success:
        return Icons.check_circle_outline;
      case AlertSeverity.warning:
        return Icons.warning_amber;
      case AlertSeverity.error:
        return Icons.error_outline;
    }
  }
}

// ========================================
// ENUMS E CLASSES AUXILIARES
// ========================================
enum AlertSeverity {
  info,
  success,
  warning,
  error,
}

class _AlertColors {
  final Color background;
  final Color border;
  final Color icon;
  final Color text;
  final Color action;

  const _AlertColors({
    required this.background,
    required this.border,
    required this.icon,
    required this.text,
    required this.action,
  });
}

// ========================================
// VARIACOES PRE-DEFINIDAS
// ========================================
class GfAlertBannerVariants {
  static GfAlertBanner criticalAlerts({
    required int count,
    VoidCallback? onViewAlerts,
    VoidCallback? onDismiss,
  }) {
    return GfAlertBanner(
      message: '$count alerta(s) precisam de atencao imediata!',
      actionText: 'Ver alertas',
      onActionTap: onViewAlerts ?? () {},
      severity: AlertSeverity.error,
      isDismissible: onDismiss != null,
      onDismiss: onDismiss,
    );
  }

  static GfAlertBanner maintenance({
    VoidCallback? onViewDetails,
    VoidCallback? onDismiss,
  }) {
    return GfAlertBanner(
      message: 'Manutencao programada para hoje as 23:00',
      actionText: 'Ver detalhes',
      onActionTap: onViewDetails ?? () {},
      severity: AlertSeverity.warning,
      isDismissible: onDismiss != null,
      onDismiss: onDismiss,
    );
  }

  static GfAlertBanner update({
    VoidCallback? onUpdate,
    VoidCallback? onDismiss,
  }) {
    return GfAlertBanner(
      message: 'Nova versao disponivel com melhorias importantes',
      actionText: 'Atualizar',
      onActionTap: onUpdate ?? () {},
      severity: AlertSeverity.info,
      isDismissible: onDismiss != null,
      onDismiss: onDismiss,
    );
  }

  static GfAlertBanner success({
    VoidCallback? onViewReport,
    VoidCallback? onDismiss,
  }) {
    return GfAlertBanner(
      message: 'Backup dos dados concluido com sucesso',
      actionText: 'Ver relatorio',
      onActionTap: onViewReport ?? () {},
      severity: AlertSeverity.success,
      isDismissible: onDismiss != null,
      onDismiss: onDismiss,
    );
  }
}
