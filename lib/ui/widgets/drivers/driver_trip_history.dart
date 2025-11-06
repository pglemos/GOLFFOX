import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/gf_tokens.dart';
import '../../../models/trip_extended.dart';
import '../../../widgets/gx_card.dart';
import '../../../widgets/gx_empty.dart';
import '../../../widgets/gx_chip.dart';

enum TripHistoryFilter {
  all('Todas'),
  completed('Concluidas'),
  cancelled('Canceladas'),
  inProgress('Em Andamento');

  const TripHistoryFilter(this.displayName);
  final String displayName;
}

class DriverTripHistory extends StatefulWidget {

  const DriverTripHistory({
    super.key,
    required this.driverId,
  });
  final String driverId;

  @override
  State<DriverTripHistory> createState() => _DriverTripHistoryState();
}

class _DriverTripHistoryState extends State<DriverTripHistory> {
  TripHistoryFilter _selectedFilter = TripHistoryFilter.all;
  List<TripExtended> _trips = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTrips();
  }

  Future<void> _loadTrips() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      // Simular carregamento de viagens
      await Future.delayed(const Duration(milliseconds: 800));

      // Dados simulados de viagens
      final trips = _generateMockTrips();

      if (mounted) {
        setState(() {
          _trips = trips;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  List<TripExtended> get _filteredTrips {
    switch (_selectedFilter) {
      case TripHistoryFilter.all:
        return _trips;
      case TripHistoryFilter.completed:
        return _trips
            .where((trip) => trip.status == TripStatus.completed)
            .toList();
      case TripHistoryFilter.cancelled:
        return _trips
            .where((trip) => trip.status == TripStatus.cancelled)
            .toList();
      case TripHistoryFilter.inProgress:
        return _trips
            .where((trip) => trip.status == TripStatus.inProgress)
            .toList();
    }
  }

  @override
  Widget build(BuildContext context) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Filtros
        _buildFilters(),

        const SizedBox(height: 16),

        // Estatisticas rapidas
        _buildQuickStats(),

        const SizedBox(height: 24),

        // Lista de viagens
        _buildTripsList(),
      ],
    );

  Widget _buildFilters() => GxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.filter_list,
                size: 20,
                color: const Color(GfTokens.colorPrimary),
              ),
              const SizedBox(width: 8),
              Text(
                'Filtros',
                style: GfTextStyles.labelLarge.copyWith(
                  color: const Color(GfTokens.colorPrimary),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: TripHistoryFilter.values.map((filter) {
              final isSelected = _selectedFilter == filter;
              final count = _getTripCount(filter);

              return GxChip(
                label: '${filter.displayName} ($count)',
                selected: isSelected,
                onTap: () {
                  setState(() {
                    _selectedFilter = filter;
                  });
                },
              );
            }).toList(),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: -0.1);

  Widget _buildQuickStats() {
    final filteredTrips = _filteredTrips;
    final totalDistance = filteredTrips.fold<double>(
      0,
      (sum, trip) => sum + trip.distance,
    );
    final totalEarnings = filteredTrips.fold<double>(
      0,
      (sum, trip) => sum + trip.fare,
    );
    final averageRating = filteredTrips.isNotEmpty
        ? filteredTrips
                .where((trip) => trip.rating != null)
                .fold<double>(0, (sum, trip) => sum + (trip.rating ?? 0)) /
            filteredTrips.where((trip) => trip.rating != null).length
        : 0.0;

    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            'Viagens',
            filteredTrips.length.toString(),
            Icons.route,
            const Color(GfTokens.colorPrimary),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            'Distancia',
            '${totalDistance.toStringAsFixed(1)} km',
            Icons.straighten,
            const Color(GfTokens.colorSecondary),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            'Ganhos',
            'R\$ ${totalEarnings.toStringAsFixed(2)}',
            Icons.attach_money,
            const Color(GfTokens.colorSuccess),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            'Avaliacao',
            averageRating > 0 ? averageRating.toStringAsFixed(1) : 'N/A',
            Icons.star,
            const Color(GfTokens.colorWarning),
          ),
        ),
      ],
    ).animate().fadeIn(delay: 100.ms).slideY(begin: -0.1);
  }

  Widget _buildStatCard(
      String label, String value, IconData icon, Color color) => GxCard(
      child: Column(
        children: [
          Icon(
            icon,
            size: 24,
            color: color,
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GfTextStyles.labelLarge.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            label,
            style: GfTextStyles.labelSmall.copyWith(
              color: const Color(GfTokens.colorOnSurfaceVariant),
            ),
          ),
        ],
      ),
    );

  Widget _buildTripsList() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_error != null) {
      return GxCard(
        child: Column(
          children: [
            const Icon(
              Icons.error_outline,
              size: 48,
              color: Color(GfTokens.colorError),
            ),
            const SizedBox(height: 16),
            const Text(
              'Erro ao carregar viagens',
              style: GfTextStyles.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: GfTextStyles.labelLarge.copyWith(
                color: const Color(GfTokens.colorOnSurfaceVariant),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: _loadTrips,
              child: const Text('Tentar Novamente'),
            ),
          ],
        ),
      );
    }

    final filteredTrips = _filteredTrips;

    if (filteredTrips.isEmpty) {
      return GxCard(
        child: GxEmpty(
          icon: Icons.route,
          title: 'Nenhuma Viagem',
          message: _selectedFilter == TripHistoryFilter.all
              ? 'Este motorista ainda nao realizou viagens.'
              : 'Nenhuma viagem encontrada para o filtro selecionado.',
        ),
      );
    }

    return GxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.history,
                size: 20,
                color: Color(GfTokens.colorPrimary),
              ),
              const SizedBox(width: 8),
              Text(
                'Historico de Viagens',
                style: GfTextStyles.headlineSmall.copyWith(
                  color: const Color(GfTokens.colorPrimary),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...filteredTrips.map(_buildTripItem),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms).slideY(begin: -0.1);
  }

  Widget _buildTripItem(TripExtended trip) => Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: GxCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cabecalho com status e data
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: trip.status.colorValue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: trip.status.colorValue.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        trip.status.iconData,
                        size: 14,
                        color: trip.status.colorValue,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        trip.status.displayName,
                        style: GfTextStyles.labelSmall.copyWith(
                          color: trip.status.colorValue,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                Text(
                  DateFormat('dd/MM/yyyy HH:mm').format(trip.startTime),
                  style: GfTextStyles.labelSmall.copyWith(
                    color: const Color(GfTokens.colorOnSurfaceVariant),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Origem e destino
            Row(
              children: [
                Column(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: const Color(GfTokens.colorPrimary),
                        shape: BoxShape.circle,
                      ),
                    ),
                    Container(
                      width: 2,
                      height: 24,
                      color: const Color(GfTokens.colorOutlineVariant),
                    ),
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: const Color(GfTokens.colorError),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        trip.origin,
                        style: GfTextStyles.bodyMedium,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 24),
                      Text(
                        trip.destination,
                        style: GfTextStyles.bodyMedium,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Informacoes da viagem
            Row(
              children: [
                Expanded(
                  child: _buildTripInfo(
                    Icons.straighten,
                    '${trip.distance.toStringAsFixed(1)} km',
                  ),
                ),
                Expanded(
                  child: _buildTripInfo(
                    Icons.access_time,
                    _formatDuration(trip.duration),
                  ),
                ),
                Expanded(
                  child: _buildTripInfo(
                    Icons.attach_money,
                    'R\$ ${trip.fare.toStringAsFixed(2)}',
                  ),
                ),
              ],
            ),

            // Avaliacao e notas (se houver)
            if (trip.status == TripStatus.completed) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(
                    Icons.star,
                    size: 16,
                    color: const Color(GfTokens.colorWarning),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    trip.rating?.toStringAsFixed(1) ?? 'N/A',
                    style: GfTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (trip.notes != null) ...[
                    const SizedBox(width: 16),
                    Expanded(
                      child: Text(
                        trip.notes!,
                        style: GfTextStyles.labelSmall.copyWith(
                          color: const Color(GfTokens.colorOnSurfaceVariant),
                          fontStyle: FontStyle.italic,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ],
        ),
      ),
    );

  Widget _buildTripInfo(IconData icon, String value) => Column(
      children: [
        Icon(
          icon,
          size: 16,
          color: const Color(GfTokens.colorPrimary),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: GfTextStyles.bodyMedium.copyWith(
            fontWeight: FontWeight.w600,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );

  int _getTripCount(TripHistoryFilter filter) {
    switch (filter) {
      case TripHistoryFilter.all:
        return _trips.length;
      case TripHistoryFilter.completed:
        return _trips
            .where((trip) => trip.status == TripStatus.completed)
            .length;
      case TripHistoryFilter.cancelled:
        return _trips
            .where((trip) => trip.status == TripStatus.cancelled)
            .length;
      case TripHistoryFilter.inProgress:
        return _trips
            .where((trip) => trip.status == TripStatus.inProgress)
            .length;
    }
  }

  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);

    if (hours > 0) {
      return '${hours}h ${minutes}min';
    } else {
      return '${minutes}min';
    }
  }

  List<TripExtended> _generateMockTrips() {
    final now = DateTime.now();
    return List.generate(15, (index) {
      final startTime = now.subtract(Duration(days: index * 2, hours: index));
      final duration = Duration(minutes: 20 + (index * 5));

      return TripExtended(
        id: 'trip_${index + 1}',
        driverId: widget.driverId,
        passengerId: 'passenger_${index + 1}',
        origin: _getRandomOrigin(index),
        destination: _getRandomDestination(index),
        startTime: startTime,
        endTime: startTime.add(duration),
        distance: 5.0 + (index * 2.5),
        fare: 15.0 + (index * 3.5),
        status: _getRandomStatus(index),
        rating: index % 3 == 0 ? null : 3.5 + (index % 3) * 0.5,
        notes: index % 4 == 0 ? 'Viagem tranquila, passageiro educado.' : null,
        createdAt: startTime,
        updatedAt: startTime.add(duration),
      );
    });
  }

  String _getRandomOrigin(int index) {
    final origins = [
      'Shopping Eldorado',
      'Aeroporto de Congonhas',
      'Estacao da Luz',
      'Av. Paulista, 1000',
      'Rua Augusta, 500',
      'Terminal Rodoviario',
      'Shopping Ibirapuera',
      'Estacao Se',
      'Av. Faria Lima, 2000',
      'Rua Oscar Freire, 100',
    ];
    return origins[index % origins.length];
  }

  String _getRandomDestination(int index) {
    final destinations = [
      'Centro Empresarial',
      'Hospital Albert Einstein',
      'Universidade de Sao Paulo',
      'Shopping Morumbi',
      'Estacao Vila Madalena',
      'Av. Berrini, 1500',
      'Rua Consolacao, 800',
      'Terminal Jabaquara',
      'Shopping Analia Franco',
      'Estacao Brooklin',
    ];
    return destinations[index % destinations.length];
  }

  TripStatus _getRandomStatus(int index) {
    final statuses = [
      TripStatus.completed,
      TripStatus.cancelled,
      TripStatus.inProgress
    ];
    if (index == 0) {
      return TripStatus.inProgress; // Primeira viagem em andamento
    }
    return statuses[index % statuses.length];
  }
}
