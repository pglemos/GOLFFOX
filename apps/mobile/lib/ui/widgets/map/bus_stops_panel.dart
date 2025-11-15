// ========================================
// GolfFox Bus Stops Panel v1.0
// Painel para exibir pontos de parada de uma rota
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/gf_tokens.dart';
import '../../../core/theme/unified_theme.dart';
import '../../../core/utils/date_utils.dart';
import '../../../models/bus_stop.dart';

class BusStopsPanel extends StatefulWidget {

  const BusStopsPanel({
    required this.busStops,
    super.key,
    this.routeName,
    this.onClose,
    this.onStopTap,
  });
  final List<BusStop> busStops;
  final String? routeName;
  final VoidCallback? onClose;
  final ValueChanged<BusStop>? onStopTap;

  @override
  State<BusStopsPanel> createState() => _BusStopsPanelState();
}

class _BusStopsPanelState extends State<BusStopsPanel> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final sortedStops = List<BusStop>.from(widget.busStops)
      ..sort((a, b) => (a.sequence ?? 0).compareTo(b.sequence ?? 0));

    return Container(
      margin: const EdgeInsets.all(GfTokens.space4),
      decoration: BoxDecoration(
        color: const Color(GfTokens.surface),
        borderRadius: BorderRadius.circular(GfTokens.radius),
        border: Border.all(color: const Color(GfTokens.stroke)),
        boxShadow: [
          BoxShadow(
    color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(GfTokens.space4),
            decoration: BoxDecoration(
    color: GolfFoxTheme.primaryOrange.withValues(alpha: 0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(GfTokens.radius),
                topRight: Radius.circular(GfTokens.radius),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: GolfFoxTheme.primaryOrange,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.route,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: GfTokens.space3),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.routeName ?? 'Pontos de Parada',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(GfTokens.textTitle),
                        ),
                      ),
                      Text(
                        '${sortedStops.length} paradas',
                        style: const TextStyle(
                          fontSize: 14,
                          color: Color(GfTokens.textMuted),
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () {
                    setState(() {
                      _isExpanded = !_isExpanded;
                    });
                  },
                  icon: Icon(
                    _isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: const Color(GfTokens.textMuted),
                  ),
                ),
                IconButton(
                  onPressed: widget.onClose,
                  icon: const Icon(Icons.close),
                  iconSize: 20,
                  color: const Color(GfTokens.textMuted),
                ),
              ],
            ),
          ),

          // Lista de paradas (expansivel)
          if (_isExpanded)
            Container(
              constraints: const BoxConstraints(maxHeight: 300),
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.all(GfTokens.space4),
                itemCount: sortedStops.length,
                separatorBuilder: (context, index) => const Divider(
                  height: 1,
                  color: Color(GfTokens.stroke),
                ),
                itemBuilder: (context, index) {
                  final stop = sortedStops[index];
                  return _BusStopTile(
                    stop: stop,
                    onTap: () => widget.onStopTap?.call(stop),
                  );
                },
              ),
            ).animate().slideY(begin: -0.3, end: 0).fadeIn(),

          // Resumo das paradas (quando nao expandido)
          if (!_isExpanded)
            Padding(
              padding: const EdgeInsets.all(GfTokens.space4),
              child: Row(
                children: [
                  Expanded(
                    child: _StopsSummary(stops: sortedStops),
                  ),
                ],
              ),
            ),
        ],
      ),
    ).animate().slideY(begin: 0.3, end: 0).fadeIn();
  }
}

class _BusStopTile extends StatelessWidget {

  const _BusStopTile({
    required this.stop,
    this.onTap,
  });
  final BusStop stop;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          vertical: GfTokens.space3,
          horizontal: GfTokens.space2,
        ),
        child: Row(
          children: [
            // Numero da sequencia
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: stop.status.colorValue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: Color(stop.status.colorValue),
                  width: 2,
                ),
              ),
              child: Center(
                child: Text(
                  '${stop.sequence ?? 0}',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(stop.status.colorValue),
                  ),
                ),
              ),
            ),
            const SizedBox(width: GfTokens.space3),

            // Informacoes da parada
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        stop.type.icon,
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(width: GfTokens.space1),
                      Expanded(
                        child: Text(
                          stop.name,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Color(GfTokens.textTitle),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  if (stop.landmark != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      stop.landmark!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(GfTokens.textMuted),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ],
              ),
            ),

            // Status e tempo estimado
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: Color(stop.status.colorValue),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    stop.status.displayName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                if (stop.estimatedArrival != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    GfDateUtils.timeAgo(stop.estimatedArrival!),
                    style: const TextStyle(
                      fontSize: 10,
                      color: Color(GfTokens.textMuted),
                    ),
                  ),
                ],
              ],
            ),

            // Icone de navegacao
            const SizedBox(width: GfTokens.space2),
            const Icon(
              Icons.chevron_right,
              size: 16,
              color: Color(GfTokens.textMuted),
            ),
          ],
        ),
      ),
    );
}

class _StopsSummary extends StatelessWidget {

  const _StopsSummary({required this.stops});
  final List<BusStop> stops;

  @override
  Widget build(BuildContext context) {
    final activeStops =
        stops.where((s) => s.status == BusStopStatus.active).length;
    final inactiveStops =
        stops.where((s) => s.status == BusStopStatus.inactive).length;
    final maintenanceStops =
        stops.where((s) => s.status == BusStopStatus.maintenance).length;

    return Row(
      children: [
        if (activeStops > 0) ...[
          _StatusChip(
            count: activeStops,
            label: 'Ativas',
            color: const Color(0xFF4CAF50),
          ),
          const SizedBox(width: GfTokens.space2),
        ],
        if (inactiveStops > 0) ...[
          _StatusChip(
            count: inactiveStops,
            label: 'Inativas',
            color: const Color(0xFF9E9E9E),
          ),
          const SizedBox(width: GfTokens.space2),
        ],
        if (maintenanceStops > 0) ...[
          _StatusChip(
            count: maintenanceStops,
            label: 'Manutencao',
            color: const Color(0xFFFF9800),
          ),
        ],
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {

  const _StatusChip({
    required this.count,
    required this.label,
    required this.color,
  });
  final int count;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 8,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            '$count $label',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
}
