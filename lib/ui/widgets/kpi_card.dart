// ========================================
// GolfFox KPI Card v11.0 - Clear Theme
// Widget para exibir metricas do dashboard
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/gf_tokens.dart';
import '../../core/motion/gf_motion.dart';

class GfKpiCard extends StatelessWidget {

  const GfKpiCard({
    super.key,
    required this.title,
    required this.value,
    this.subtitle,
    required this.icon,
    required this.iconColor,
    this.backgroundColor,
    this.onTap,
    this.isLoading = false,
  });
  final String title;
  final String value;
  final String? subtitle;
  final IconData icon;
  final Color iconColor;
  final Color? backgroundColor;
  final VoidCallback? onTap;
  final bool isLoading;

  @override
  Widget build(BuildContext context) => GfHoverScale(
      enableShadow: true,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(GfTokens.radius),
          child: AnimatedContainer(
            duration: GfMotion.short,
            curve: GfMotion.easeOut,
            padding: const EdgeInsets.all(GfTokens.space6),
            decoration: BoxDecoration(
              color: backgroundColor ?? const Color(GfTokens.surface),
              borderRadius: BorderRadius.circular(GfTokens.radius),
              border: Border.all(
                color: const Color(GfTokens.stroke),
                width: 1,
              ),
            ),
            child: isLoading ? _buildLoadingState() : _buildContent(),
          ),
        ),
      ),
    ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.1, end: 0);

  Widget _buildContent() => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ========================================
        // HEADER COM ICONE E TITULO
        // ========================================
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(GfTokens.space2),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
              ),
              child: Icon(
                icon,
                color: iconColor,
                size: 20,
              ),
            ),
            const SizedBox(width: GfTokens.space3),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Color(GfTokens.textMuted),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),

        const SizedBox(height: GfTokens.space4),

        // ========================================
        // VALOR PRINCIPAL
        // ========================================
        Text(
          value,
          style: const TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w700,
            color: Color(GfTokens.textTitle),
            height: 1.0,
          ),
        ),

        // ========================================
        // SUBTITULO (opcional)
        // ========================================
        if (subtitle != null) ...[
          const SizedBox(height: GfTokens.space2),
          Text(
            subtitle!,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w400,
              color: Color(GfTokens.textMuted),
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ],
    );

  Widget _buildLoadingState() => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header skeleton
        Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: const Color(GfTokens.surfaceMuted),
                borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
              ),
            ),
            const SizedBox(width: GfTokens.space3),
            Expanded(
              child: Container(
                height: 16,
                decoration: BoxDecoration(
                  color: const Color(GfTokens.surfaceMuted),
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: GfTokens.space4),

        // Value skeleton
        Container(
          height: 32,
          width: 80,
          decoration: BoxDecoration(
            color: const Color(GfTokens.surfaceMuted),
            borderRadius: BorderRadius.circular(8),
          ),
        ),

        const SizedBox(height: GfTokens.space2),

        // Subtitle skeleton
        Container(
          height: 12,
          width: 120,
          decoration: BoxDecoration(
            color: const Color(GfTokens.surfaceMuted),
            borderRadius: BorderRadius.circular(6),
          ),
        ),
      ],
    )
        .animate(onPlay: (controller) => controller.repeat())
        .shimmer(duration: 1500.ms);
}

// ========================================
// VARIACOES PRE-DEFINIDAS
// ========================================
class GfKpiCardVariants {
  static GfKpiCard inTransit({
    required String value,
    String? subtitle,
    VoidCallback? onTap,
    bool isLoading = false,
  }) => GfKpiCard(
      title: 'Em Transito',
      value: value,
      subtitle: subtitle ?? 'colaboradores ativos',
      icon: Icons.directions_bus,
      iconColor: const Color(GfTokens.kpiInTransit),
      onTap: onTap,
      isLoading: isLoading,
    );

  static GfKpiCard activeVehicles({
    required String value,
    String? subtitle,
    VoidCallback? onTap,
    bool isLoading = false,
  }) => GfKpiCard(
      title: 'Veiculos Ativos',
      value: value,
      subtitle: subtitle ?? 'da frota total',
      icon: Icons.directions_car,
      iconColor: const Color(GfTokens.kpiActiveVehicles),
      onTap: onTap,
      isLoading: isLoading,
    );

  static GfKpiCard routesToday({
    required String value,
    String? subtitle,
    VoidCallback? onTap,
    bool isLoading = false,
  }) => GfKpiCard(
      title: 'Rotas do Dia',
      value: value,
      subtitle: subtitle ?? 'rotas programadas',
      icon: Icons.route,
      iconColor: const Color(GfTokens.kpiRoutesToday),
      onTap: onTap,
      isLoading: isLoading,
    );

  static GfKpiCard criticalAlerts({
    required String value,
    String? subtitle,
    VoidCallback? onTap,
    bool isLoading = false,
  }) => GfKpiCard(
      title: 'Alertas Criticos',
      value: value,
      subtitle: subtitle ?? 'requerem atencao',
      icon: Icons.warning,
      iconColor: const Color(GfTokens.kpiCriticalAlerts),
      onTap: onTap,
      isLoading: isLoading,
    );
}
