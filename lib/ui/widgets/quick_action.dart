// ========================================
// GolfFox Quick Action v11.0 - Clear Theme
// Widget para acoes rapidas do dashboard
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/gf_tokens.dart';
import '../../core/motion/gf_motion.dart';

class GfQuickAction extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final Color iconColor;
  final VoidCallback onTap;
  final bool isEnabled;

  const GfQuickAction({
    super.key,
    required this.title,
    required this.description,
    required this.icon,
    required this.iconColor,
    required this.onTap,
    this.isEnabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return GfHoverScale(
      enableShadow: true,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isEnabled ? onTap : null,
          borderRadius: BorderRadius.circular(GfTokens.radius),
          child: AnimatedContainer(
            duration: GfMotion.short,
            curve: GfMotion.easeOut,
            padding: const EdgeInsets.all(GfTokens.space5),
            decoration: BoxDecoration(
              color: const Color(GfTokens.surface),
              borderRadius: BorderRadius.circular(GfTokens.radius),
              border: Border.all(
                color: const Color(GfTokens.stroke),
                width: 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ========================================
                // ICONE
                // ========================================
                Container(
                  padding: const EdgeInsets.all(GfTokens.space3),
                  decoration: BoxDecoration(
                    color: iconColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
                  ),
                  child: Icon(
                    icon,
                    color:
                        isEnabled ? iconColor : const Color(GfTokens.textMuted),
                    size: 24,
                  ),
                ),

                const SizedBox(height: GfTokens.space4),

                // ========================================
                // TITULO
                // ========================================
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: isEnabled
                        ? const Color(GfTokens.textTitle)
                        : const Color(GfTokens.textMuted),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),

                const SizedBox(height: GfTokens.space2),

                // ========================================
                // DESCRICAO
                // ========================================
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                    color: Color(GfTokens.textMuted),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),

                const Spacer(),

                // ========================================
                // INDICADOR DE ACAO
                // ========================================
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Icon(
                      Icons.arrow_forward,
                      color: isEnabled
                          ? iconColor
                          : const Color(GfTokens.textMuted),
                      size: 16,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.1, end: 0);
  }
}

// ========================================
// VARIACOES PRE-DEFINIDAS
// ========================================
class GfQuickActionVariants {
  static GfQuickAction trackVehicles({
    required VoidCallback onTap,
    bool isEnabled = true,
  }) {
    return GfQuickAction(
      title: 'Rastrear Veiculos',
      description: 'Visualizar posicoes em tempo real',
      icon: Icons.gps_fixed,
      iconColor: const Color(GfTokens.brand),
      onTap: onTap,
      isEnabled: isEnabled,
    );
  }

  static GfQuickAction viewAnalytics({
    required VoidCallback onTap,
    bool isEnabled = true,
  }) {
    return GfQuickAction(
      title: 'Ver Analises',
      description: 'Relatorios e metricas detalhadas',
      icon: Icons.analytics,
      iconColor: const Color(GfTokens.accent),
      onTap: onTap,
      isEnabled: isEnabled,
    );
  }

  static GfQuickAction settings({
    required VoidCallback onTap,
    bool isEnabled = true,
  }) {
    return GfQuickAction(
      title: 'Configuracoes',
      description: 'Ajustar parametros do sistema',
      icon: Icons.settings,
      iconColor: const Color(GfTokens.textMuted),
      onTap: onTap,
      isEnabled: isEnabled,
    );
  }

  static GfQuickAction reopenTrip({
    required VoidCallback onTap,
    bool isEnabled = true,
  }) {
    return GfQuickAction(
      title: 'Reabrir Viagem',
      description: 'Reativar viagem encerrada',
      icon: Icons.refresh,
      iconColor: const Color(GfTokens.warning),
      onTap: onTap,
      isEnabled: isEnabled,
    );
  }
}
