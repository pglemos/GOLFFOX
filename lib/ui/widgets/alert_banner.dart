// ========================================
// GolfFox Alert Banner v11.0 - Clear Theme
// Widget para exibir alertas importantes
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/services/error_service.dart';
import '../../core/theme/gf_tokens.dart';

class GfAlertBanner extends StatelessWidget {

  const GfAlertBanner({
    required this.message,
    required this.actionText,
    required this.onActionTap,
    this.severity = AlertSeverity.warning,
    this.isDismissible = false,
    this.onDismiss,
    super.key,
  });
  /// Fábrica para exibir um alerta a partir de um erro padronizado
  factory GfAlertBanner.fromError({
    required Object error,
    required String actionText,
    required VoidCallback onActionTap,
    bool isDismissible = false,
    VoidCallback? onDismiss,
    Key? key,
  }) {
    final msg = ErrorService.instance.getUserFriendlyMessage(error);
    var sev = AlertSeverity.warning;

    if (error is GxError) {
      sev = _mapSeverity(error.severity);
    }

    return GfAlertBanner(
      key: key,
      message: msg,
      actionText: actionText,
      onActionTap: onActionTap,
      severity: sev,
      isDismissible: isDismissible,
      onDismiss: onDismiss,
    );
  }

  final String message;
  final String actionText;
  final VoidCallback onActionTap;
  final AlertSeverity severity;
  final bool isDismissible;
  final VoidCallback? onDismiss;

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
        return const _AlertColors(
          background: Color(0xFFF0F9FF),
          border: Color(0xFFBAE6FD),
          icon: Color(0xFF0284C7),
          text: Color(0xFF0C4A6E),
          action: Color(0xFF0284C7),
        );
      case AlertSeverity.success:
        return const _AlertColors(
          background: Color(0xFFF0FDF4),
          border: Color(0xFFBBF7D0),
          icon: Color(GfTokens.success),
          text: Color(0xFF14532D),
          action: Color(GfTokens.success),
        );
      case AlertSeverity.warning:
        return const _AlertColors(
          background: Color(0xFFFFFBEB),
          border: Color(0xFFFED7AA),
          icon: Color(GfTokens.warning),
          text: Color(0xFF92400E),
          action: Color(GfTokens.warning),
        );
      case AlertSeverity.error:
        return const _AlertColors(
          background: Color(0xFFFEF2F2),
          border: Color(0xFFFECACA),
          icon: Color(GfTokens.danger),
          text: Color(0xFF991B1B),
          action: Color(GfTokens.danger),
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

  static AlertSeverity _mapSeverity(ErrorSeverity severity) {
    switch (severity) {
      case ErrorSeverity.info:
        return AlertSeverity.info;
      case ErrorSeverity.warning:
        return AlertSeverity.warning;
      case ErrorSeverity.error:
        return AlertSeverity.error;
      case ErrorSeverity.critical:
        return AlertSeverity.error;
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

  const _AlertColors({
    required this.background,
    required this.border,
    required this.icon,
    required this.text,
    required this.action,
  });
  final Color background;
  final Color border;
  final Color icon;
  final Color text;
  final Color action;
}

// ========================================
// VARIACOES PRE-DEFINIDAS
// ========================================
class GfAlertBannerVariants {
  static GfAlertBanner criticalAlerts({
    required int count,
    VoidCallback? onViewAlerts,
    VoidCallback? onDismiss,
  }) => GfAlertBanner(
      message: '$count alerta(s) precisam de atencao imediata!',
      actionText: 'Ver alertas',
      onActionTap: onViewAlerts ?? () {},
      severity: AlertSeverity.error,
      isDismissible: onDismiss != null,
      onDismiss: onDismiss,
    );

  static GfAlertBanner maintenance({
    VoidCallback? onViewDetails,
    VoidCallback? onDismiss,
  }) => GfAlertBanner(
      message: 'Manutencao programada para hoje as 23:00',
      actionText: 'Ver detalhes',
      onActionTap: onViewDetails ?? () {},
      isDismissible: onDismiss != null,
      onDismiss: onDismiss,
    );

  static GfAlertBanner update({
    VoidCallback? onUpdate,
    VoidCallback? onDismiss,
  }) => GfAlertBanner(
      message: 'Nova versao disponivel com melhorias importantes',
      actionText: 'Atualizar',
      onActionTap: onUpdate ?? () {},
      severity: AlertSeverity.info,
      isDismissible: onDismiss != null,
      onDismiss: onDismiss,
    );

  static GfAlertBanner success({
    VoidCallback? onViewReport,
    VoidCallback? onDismiss,
  }) => GfAlertBanner(
      message: 'Backup dos dados concluido com sucesso',
      actionText: 'Ver relatorio',
      onActionTap: onViewReport ?? () {},
      severity: AlertSeverity.success,
      isDismissible: onDismiss != null,
      onDismiss: onDismiss,
    );
}
