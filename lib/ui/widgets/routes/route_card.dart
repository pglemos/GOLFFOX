// ========================================
// GolfFox Route Card Widget v11.0
// Card para exibir informacoes de rota
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../../core/theme/gf_tokens.dart';
import '../../../models/route.dart';
import '../gf_hover_scale.dart';

class RouteCard extends StatelessWidget {

  const RouteCard({
    required this.route,
    this.onTap,
    this.onStart,
    this.onCancel,
    this.onEdit,
    super.key,
  });
  final BusRoute route;
  final VoidCallback? onTap;
  final VoidCallback? onStart;
  final VoidCallback? onCancel;
  final VoidCallback? onEdit;

  @override
  Widget build(BuildContext context) => GfHoverScale(
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(GfTokens.radiusMd),
          side: BorderSide(
            color: route.status.colorValue.withValues(alpha: 0.3),
          ),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(GfTokens.radiusMd),
          child: Padding(
            padding: const EdgeInsets.all(GfTokens.space4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Cabecalho com nome e status
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            route.name,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Color(GfTokens.textTitle),
                            ),
                          ),
                          if (route.description != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              route.description!,
                              style: const TextStyle(
                                fontSize: 14,
                                color: Color(GfTokens.textMuted),
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: GfTokens.space3),
                    _buildStatusBadge(),
                  ],
                ),

                const SizedBox(height: GfTokens.space4),

                // Informacoes da rota
                Row(
                  children: [
                    Expanded(
                      child: _buildInfoItem(
                        icon: Icons.location_on,
                        label: 'Paradas',
                        value: '${route.stops.length}',
                      ),
                    ),
                    Expanded(
                      child: _buildInfoItem(
                        icon: Icons.access_time,
                        label: 'Duracao',
                        value: '${route.estimatedDuration}min',
                      ),
                    ),
                    Expanded(
                      child: _buildInfoItem(
                        icon: Icons.straighten,
                        label: 'Distancia',
                        value:
                            '${(route.estimatedDistance ?? 0.0).toStringAsFixed(1)}km',
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: GfTokens.space3),

                // Progresso da rota (se ativa)
                if (route.isActive) ...[
                  _buildProgressSection(),
                  const SizedBox(height: GfTokens.space3),
                ],

                // Informacoes de veiculo e motorista
                Row(
                  children: [
                    if (route.vehicleId != null) ...[
                      const Icon(
                        Icons.directions_bus,
                        size: 16,
                        color: Color(GfTokens.colorOnSurfaceVariant),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Veiculo ${route.vehicleId}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(GfTokens.colorOnSurfaceVariant),
                        ),
                      ),
                      const SizedBox(width: GfTokens.space3),
                    ],
                    if (route.driverId != null) ...[
                      const Icon(
                        Icons.person,
                        size: 16,
                        color: Color(GfTokens.colorOnSurfaceVariant),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Motorista ${route.driverId}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(GfTokens.colorOnSurfaceVariant),
                        ),
                      ),
                    ],
                  ],
                ),

                const SizedBox(height: GfTokens.space3),

                // Horarios
                Row(
                  children: [
                    if (route.startTime != null) ...[
                      const Icon(
                        Icons.schedule,
                        size: 16,
                        color: Color(GfTokens.colorOnSurfaceVariant),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Inicio: ${_formatTime(route.startTime!)}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(GfTokens.colorOnSurfaceVariant),
                        ),
                      ),
                    ],
                  ],
                ),

                // Acoes
                if (_hasActions()) ...[
                  const SizedBox(height: GfTokens.space4),
                  const Divider(height: 1),
                  const SizedBox(height: GfTokens.space3),
                  _buildActions(),
                ],
              ],
            ),
          ),
        ),
      ),
    );

  Widget _buildStatusBadge() => Container(
      padding: const EdgeInsets.symmetric(
        horizontal: GfTokens.space2,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: route.status.colorValue.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(GfTokens.radiusSm),
        border: Border.all(
          color: route.status.colorValue.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: Color(route.status.colorValue),
              shape: BoxShape.circle,
            ),
          )
              .animate(
                onPlay: (controller) => controller.repeat(),
              )
              .scale(
                begin: const Offset(1, 1),
                end: const Offset(1.2, 1.2),
                duration: const Duration(seconds: 1),
              )
              .then()
              .scale(
                begin: const Offset(1.2, 1.2),
                end: const Offset(1, 1),
                duration: const Duration(seconds: 1),
              ),
          const SizedBox(width: 6),
          Text(
            route.status.displayName,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Color(route.status.colorValue),
            ),
          ),
        ],
      ),
    );

  Widget _buildInfoItem({
    required IconData icon,
    required String label,
    required String value,
  }) => Column(
      children: [
        Icon(
          icon,
          size: 20,
          color: const Color(GfTokens.primary),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(GfTokens.colorOnSurface),
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Color(GfTokens.colorOnSurfaceVariant),
          ),
        ),
      ],
    );

  Widget _buildProgressSection() {
    final completedStops =
        route.stops.where((stop) => stop.actualTime != null).length;
    final progress =
        route.stops.isNotEmpty ? completedStops / route.stops.length : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Progresso da Rota',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Color(GfTokens.textTitle),
              ),
            ),
            Text(
              '${(progress * 100).toInt()}%',
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Color(GfTokens.primary),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: progress,
          backgroundColor: const Color(GfTokens.stroke),
          valueColor: AlwaysStoppedAnimation<Color>(
            Color(route.status.colorValue),
          ),
          borderRadius: BorderRadius.circular(4),
        ),
        const SizedBox(height: 4),
        Text(
          '$completedStops de ${route.stops.length} paradas concluidas',
          style: const TextStyle(
            fontSize: 12,
            color: Color(GfTokens.colorOnSurfaceVariant),
          ),
        ),
      ],
    );
  }

  bool _hasActions() => onStart != null || onCancel != null || onEdit != null;

  Widget _buildActions() => Row(
      children: [
        if (onEdit != null) ...[
          Expanded(
            child: OutlinedButton.icon(
              onPressed: onEdit,
              icon: const Icon(Icons.edit, size: 16),
              label: const Text('Editar'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(GfTokens.primary),
                side: const BorderSide(color: Color(GfTokens.primary)),
              ),
            ),
          ),
          const SizedBox(width: GfTokens.space2),
        ],
        if (onStart != null) ...[
          Expanded(
            child: ElevatedButton.icon(
              onPressed: onStart,
              icon: const Icon(Icons.play_arrow, size: 16),
              label: const Text('Iniciar'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(GfTokens.success),
                foregroundColor: Colors.white,
              ),
            ),
          ),
          if (onCancel != null) const SizedBox(width: GfTokens.space2),
        ],
        if (onCancel != null) ...[
          Expanded(
            child: ElevatedButton.icon(
              onPressed: onCancel,
              icon: const Icon(Icons.stop, size: 16),
              label: const Text('Cancelar'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(GfTokens.error),
                foregroundColor: Colors.white,
              ),
            ),
          ),
        ],
      ],
    );

  String _formatTime(DateTime time) => '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
}
