// ========================================
// GolfFox Route Stop Timeline v11.0
// Timeline das paradas da rota
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/gf_tokens.dart';
import '../../../models/route.dart';

class RouteStopTimeline extends StatelessWidget {
  final List<RouteStop> stops;
  final bool isActive;

  const RouteStopTimeline({
    super.key,
    required this.stops,
    this.isActive = false,
  });

  @override
  Widget build(BuildContext context) {
    if (stops.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.location_off,
              size: 64,
              color: Color(GfTokens.colorOnSurfaceVariant),
            ),
            SizedBox(height: GfTokens.space3),
            Text(
              'Nenhuma parada definida',
              style: TextStyle(
                fontSize: 16,
                color: Color(GfTokens.colorOnSurfaceVariant),
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: stops.length,
      itemBuilder: (context, index) {
        final stop = stops[index];
        final isFirst = index == 0;
        final isLast = index == stops.length - 1;
        final isCompleted = stop.actualTime != null;
        final isCurrent = isActive &&
            !isCompleted &&
            (index == 0 || stops[index - 1].actualTime != null);

        return _buildTimelineItem(
          stop: stop,
          isFirst: isFirst,
          isLast: isLast,
          isCompleted: isCompleted,
          isCurrent: isCurrent,
          index: index,
        );
      },
    );
  }

  Widget _buildTimelineItem({
    required RouteStop stop,
    required bool isFirst,
    required bool isLast,
    required bool isCompleted,
    required bool isCurrent,
    required int index,
  }) {
    final stopColor = _getStopColor(stop, isCompleted, isCurrent);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline visual
          SizedBox(
            width: 40,
            child: Column(
              children: [
                // Linha superior
                if (!isFirst)
                  Container(
                    width: 2,
                    height: 20,
                    color: isCompleted || (isCurrent && index > 0)
                        ? stopColor
                        : const Color(GfTokens.stroke),
                  ),

                // Marcador da parada
                Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    color: stopColor,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white,
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: stopColor.withValues(alpha: 0.3),
                        blurRadius: 8,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Icon(
                    _getStopIcon(stop, isCompleted, isCurrent),
                    size: 12,
                    color: Colors.white,
                  ),
                )
                    .animate(
                      target: isCurrent ? 1 : 0,
                    )
                    .scale(
                      begin: const Offset(1, 1),
                      end: const Offset(1.2, 1.2),
                      duration: const Duration(milliseconds: 1000),
                    )
                    .then()
                    .scale(
                      begin: const Offset(1.2, 1.2),
                      end: const Offset(1, 1),
                      duration: const Duration(milliseconds: 1000),
                    ),

                // Linha inferior
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: isCompleted
                          ? stopColor
                          : const Color(GfTokens.stroke),
                    ),
                  ),
              ],
            ),
          ),

          const SizedBox(width: GfTokens.space3),

          // Conteudo da parada
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(bottom: GfTokens.space4),
              padding: const EdgeInsets.all(GfTokens.space3),
              decoration: BoxDecoration(
                color: isCurrent
                    ? stopColor.withValues(alpha: 0.1)
                    : const Color(GfTokens.colorSurface),
                borderRadius: BorderRadius.circular(8.0),
                border: Border.all(
                  color: isCurrent
                      ? stopColor.withValues(alpha: 0.3)
                      : const Color(GfTokens.stroke),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Cabecalho da parada
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              stop.name,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: isCurrent
                                    ? stopColor
                                    : const Color(GfTokens.colorOnSurface),
                              ),
                            ),
                            if (stop.description != null &&
                                stop.description!.isNotEmpty)
                              Text(
                                stop.description!,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(GfTokens.colorOnSurfaceVariant),
                                ),
                              ),
                          ],
                        ),
                      ),

                      // Badge do tipo de parada
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Color(stop.type.colorValue)
                              .withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          stop.type.displayName,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                            color: Color(stop.type.colorValue),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: GfTokens.space2),

                  // Informacoes de tempo
                  Row(
                    children: [
                      if (stop.scheduledTime != null)
                        Expanded(
                          child: _buildTimeInfo(
                            label: 'Programado',
                            time: stop.scheduledTime!,
                            icon: Icons.schedule,
                          ),
                        ),
                      if (stop.scheduledTime != null)
                        Expanded(
                          child: _buildTimeInfo(
                            label: 'Estimado',
                            time: stop.scheduledTime!,
                            icon: Icons.access_time,
                            color: const Color(GfTokens.warning),
                          ),
                        ),
                      if (stop.actualTime != null)
                        Expanded(
                          child: _buildTimeInfo(
                            label: 'Real',
                            time: stop.actualTime!,
                            icon: Icons.check_circle,
                            color: const Color(GfTokens.success),
                          ),
                        ),
                    ],
                  ),

                  // Duracao da parada
                  if (stop.estimatedDuration != null &&
                      stop.estimatedDuration!.inMinutes > 0) ...[
                    const SizedBox(height: GfTokens.space2),
                    Row(
                      children: [
                        const Icon(
                          Icons.timer,
                          size: 16,
                          color: Color(GfTokens.colorOnSurfaceVariant),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Duracao: ${stop.estimatedDuration?.inMinutes ?? 0} min',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(GfTokens.colorOnSurfaceVariant),
                          ),
                        ),
                      ],
                    ),
                  ],

                  // Status da parada
                  if (isCompleted) ...[
                    const SizedBox(height: GfTokens.space2),
                    Row(
                      children: [
                        const Icon(
                          Icons.check_circle,
                          size: 16,
                          color: Color(GfTokens.success),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Concluida ${_formatTime(stop.actualTime!)}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(GfTokens.success),
                          ),
                        ),
                      ],
                    ),
                  ] else if (isCurrent) ...[
                    const SizedBox(height: GfTokens.space2),
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(GfTokens.primary),
                            shape: BoxShape.circle,
                          ),
                        )
                            .animate(
                              onPlay: (controller) => controller.repeat(),
                            )
                            .fadeIn(
                              duration: const Duration(milliseconds: 500),
                            )
                            .then()
                            .fadeOut(
                              duration: const Duration(milliseconds: 500),
                            ),
                        const SizedBox(width: 8),
                        const Text(
                          'Proxima parada',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: Color(GfTokens.primary),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeInfo({
    required String label,
    required DateTime time,
    required IconData icon,
    Color? color,
  }) {
    final timeColor = color ?? const Color(GfTokens.colorOnSurface);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 14,
          color: timeColor,
        ),
        const SizedBox(width: 4),
        Column(
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
              _formatTime(time),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: timeColor,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Color _getStopColor(RouteStop stop, bool isCompleted, bool isCurrent) {
    if (isCompleted) {
      return const Color(GfTokens.success);
    } else if (isCurrent) {
      return const Color(GfTokens.primary);
    } else {
      return const Color(GfTokens.colorOnSurfaceVariant);
    }
  }

  IconData _getStopIcon(RouteStop stop, bool isCompleted, bool isCurrent) {
    if (isCompleted) {
      return Icons.check;
    } else if (isCurrent) {
      return Icons.navigation;
    } else {
      switch (stop.type) {
        case StopType.pickup:
          return Icons.person_add;
        case StopType.dropoff:
          return Icons.person_remove;
        case StopType.waypoint:
          return Icons.location_on;
        case StopType.depot:
          return Icons.garage;
      }
    }
  }

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }
}
