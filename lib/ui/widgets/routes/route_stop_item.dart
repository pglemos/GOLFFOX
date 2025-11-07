// ========================================
// GolfFox Route Stop Item Widget v11.0
// Item de parada para criacao de rotas
// ========================================

import 'package:flutter/material.dart';
import '../../../core/theme/gf_tokens.dart';
import '../../../models/route.dart';

class RouteStopItem extends StatelessWidget {

  const RouteStopItem({
    super.key,
    required this.stop,
    required this.index,
    this.onEdit,
    this.onDelete,
  });
  final RouteStop stop;
  final int index;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) => Card(
      margin: const EdgeInsets.only(bottom: GfTokens.space2),
      child: Padding(
        padding: const EdgeInsets.all(GfTokens.space3),
        child: Row(
          children: [
            // Indicador de ordem e tipo
            _buildStopIndicator(),

            const SizedBox(width: GfTokens.space3),

            // Informacoes da parada
            Expanded(
              child: _buildStopInfo(),
            ),

            // Acoes
            _buildActions(context),
          ],
        ),
      ),
    );

  Widget _buildStopIndicator() => Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: Color(stop.type.colorValue),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: stop.type == StopType.pickup
                ? const Icon(
                    Icons.play_arrow,
                    color: Colors.white,
                    size: 16,
                  )
                : stop.type == StopType.dropoff
                    ? const Icon(
                        Icons.stop,
                        color: Colors.white,
                        size: 16,
                      )
                    : Text(
                        '${index + 1}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          stop.type.displayName,
          style: TextStyle(
            fontSize: 10,
            color: Color(stop.type.colorValue),
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );

  Widget _buildStopInfo() => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          stop.name,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: Color(GfTokens.colorOnSurface),
          ),
        ),
        const SizedBox(height: 4),

        // Descricao da parada
        if (stop.description != null && stop.description!.isNotEmpty)
          Row(
            children: [
              const Icon(
                Icons.location_on,
                size: 14,
                color: Color(GfTokens.colorOnSurfaceVariant),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  stop.description!,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(GfTokens.colorOnSurfaceVariant),
                  ),
                ),
              ),
            ],
          ),

        // Horario estimado (se disponivel)
        if (stop.scheduledTime != null) ...[
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(
                Icons.access_time,
                size: 14,
                color: Color(GfTokens.colorOnSurfaceVariant),
              ),
              const SizedBox(width: 4),
              Text(
                'Chegada estimada: ${_formatTime(stop.scheduledTime!)}',
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(GfTokens.colorOnSurfaceVariant),
                ),
              ),
            ],
          ),
        ],

        // Tempo de parada
        if (stop.estimatedDuration != null) ...[
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(
                Icons.timer,
                size: 14,
                color: Color(GfTokens.colorOnSurfaceVariant),
              ),
              const SizedBox(width: 4),
              Text(
                'Parada: ${stop.estimatedDuration!.inMinutes} min',
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(GfTokens.colorOnSurfaceVariant),
                ),
              ),
            ],
          ),
        ],

        // Status da parada (se em execucao)
        if (stop.actualTime != null) ...[
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: const Color(GfTokens.success).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(GfTokens.radiusSm),
              border: Border.all(
                color: const Color(GfTokens.success).withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.check_circle,
                  size: 12,
                  color: Color(GfTokens.success),
                ),
                const SizedBox(width: 4),
                Text(
                  'Concluida as ${_formatTime(stop.actualTime!)}',
                  style: const TextStyle(
                    fontSize: 10,
                    color: Color(GfTokens.success),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );

  Widget _buildActions(BuildContext context) => Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Botao de editar
        if (onEdit != null)
          IconButton(
            onPressed: onEdit,
            icon: const Icon(Icons.edit),
            iconSize: 20,
            color: const Color(GfTokens.primary),
            tooltip: 'Editar parada',
          ),

        // Botao de deletar
        if (onDelete != null)
          IconButton(
            onPressed: () => _showDeleteConfirmation(context),
            icon: const Icon(Icons.delete),
            iconSize: 20,
            color: const Color(GfTokens.colorError),
            tooltip: 'Remover parada',
          ),

        // Handle para reordenacao
        const Icon(
          Icons.drag_handle,
          color: Color(GfTokens.colorOnSurfaceVariant),
          size: 20,
        ),
      ],
    );

  void _showDeleteConfirmation(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remover Parada'),
        content:
            Text('Tem certeza que deseja remover a parada "${stop.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              onDelete?.call();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(GfTokens.colorError),
              foregroundColor: Colors.white,
            ),
            child: const Text('Remover'),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) => '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
}
