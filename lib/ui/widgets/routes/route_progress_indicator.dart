// ========================================
// GolfFox Route Progress Indicator v11.0
// Indicador de progresso da rota
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/gf_tokens.dart';
import '../../../models/route.dart';

class RouteProgressIndicator extends StatelessWidget {
  const RouteProgressIndicator({
    required this.route,
    super.key,
  });
  final BusRoute route;

  @override
  Widget build(BuildContext context) {
    final completedStops =
        route.stops.where((stop) => stop.actualTime != null).length;
    final progress =
        route.stops.isNotEmpty ? completedStops / route.stops.length : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Cabecalho do progresso
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Progresso da Rota',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Color(GfTokens.colorOnSurface),
              ),
            ),
            Text(
              '${(progress * 100).toInt()}%',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(GfTokens.primary),
              ),
            ),
          ],
        ),

        const SizedBox(height: GfTokens.space2),

        // Barra de progresso principal
        Container(
          height: 8,
          decoration: BoxDecoration(
            color: const Color(GfTokens.stroke),
            borderRadius: BorderRadius.circular(4),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.transparent,
              valueColor: AlwaysStoppedAnimation<Color>(
                Color(route.status.colorValue),
              ),
            ),
          ),
        ).animate().slideX(
              begin: -1,
              end: 0,
              duration: const Duration(milliseconds: 800),
            ),

        const SizedBox(height: GfTokens.space2),

        // Informacoes detalhadas
        Row(
          children: [
            _buildProgressInfo(
              icon: Icons.check_circle,
              label: 'Concluidas',
              value: '$completedStops',
              color: const Color(GfTokens.success),
            ),
            const SizedBox(width: GfTokens.space4),
            _buildProgressInfo(
              icon: Icons.pending,
              label: 'Pendentes',
              value: '${route.stops.length - completedStops}',
              color: const Color(GfTokens.warning),
            ),
            const SizedBox(width: GfTokens.space4),
            _buildProgressInfo(
              icon: Icons.location_on,
              label: 'Total',
              value: '${route.stops.length}',
              color: const Color(GfTokens.primary),
            ),
          ],
        ),

        const SizedBox(height: GfTokens.space3),

        // Proxima parada
        if (route.isActive) _buildNextStop(),

        // ETA e tempo estimado
        if (route.isActive) ...[
          const SizedBox(height: GfTokens.space3),
          _buildTimeInfo(),
        ],
      ],
    );
  }

  Widget _buildProgressInfo({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) =>
      Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: color,
          ),
          const SizedBox(width: 4),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 10,
                  color: Color(GfTokens.colorOnSurfaceVariant),
                ),
              ),
            ],
          ),
        ],
      );

  Widget _buildNextStop() {
    final nextStop = route.stops.firstWhere(
      (stop) => stop.actualTime == null,
      orElse: () => route.stops.last,
    );

    if (nextStop.actualTime != null) {
      return Container(
        padding: const EdgeInsets.all(GfTokens.space3),
        decoration: BoxDecoration(
          color: GfTokens.success.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(GfTokens.radiusSm),
          border: Border.all(
            color: GfTokens.success.withValues(alpha: 0.3),
          ),
        ),
        child: const Row(
          children: [
            Icon(
              Icons.check_circle,
              color: Color(GfTokens.success),
              size: 20,
            ),
            SizedBox(width: GfTokens.space2),
            Expanded(
              child: Text(
                'Todas as paradas foram concluidas!',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Color(GfTokens.success),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(GfTokens.space3),
      decoration: BoxDecoration(
        color: GfTokens.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(GfTokens.radiusSm),
        border: Border.all(
          color: GfTokens.primary.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 20,
            height: 20,
            decoration: const BoxDecoration(
              color: Color(GfTokens.primary),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.navigation,
              color: Colors.white,
              size: 12,
            ),
          )
              .animate(
                onPlay: (controller) => controller.repeat(),
              )
              .rotate(
                duration: const Duration(seconds: 2),
              ),
          const SizedBox(width: GfTokens.space2),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Proxima Parada',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(GfTokens.colorOnSurfaceVariant),
                  ),
                ),
                Text(
                  nextStop.name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Color(GfTokens.primary),
                  ),
                ),
              ],
            ),
          ),
          if (nextStop.scheduledTime != null)
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Text(
                  'ETA',
                  style: TextStyle(
                    fontSize: 10,
                    color: Color(GfTokens.colorOnSurfaceVariant),
                  ),
                ),
                Text(
                  _formatTime(nextStop.scheduledTime!),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(GfTokens.primary),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildTimeInfo() {
    final now = DateTime.now();
    final elapsed = route.startTime != null
        ? now.difference(route.startTime!).inMinutes
        : 0;

    final remaining = route.estimatedDuration != null
        ? route.estimatedDuration!.inMinutes - elapsed
        : 0;

    return Row(
      children: [
        Expanded(
          child: _buildTimeCard(
            icon: Icons.timer,
            label: 'Tempo Decorrido',
            value: '${elapsed}min',
            color: const Color(GfTokens.info),
          ),
        ),
        const SizedBox(width: GfTokens.space3),
        Expanded(
          child: _buildTimeCard(
            icon: Icons.schedule,
            label: 'Tempo Restante',
            value: remaining > 0 ? '${remaining}min' : 'Atrasado',
            color: remaining > 0
                ? const Color(GfTokens.success)
                : const Color(GfTokens.colorError),
          ),
        ),
      ],
    );
  }

  Widget _buildTimeCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) =>
      Container(
        padding: const EdgeInsets.all(GfTokens.space3),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(GfTokens.radiusSm),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: GfTokens.space2),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 10,
                      color: Color(GfTokens.colorOnSurfaceVariant),
                    ),
                  ),
                  Text(
                    value,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );

  String _formatTime(DateTime time) =>
      '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
}
