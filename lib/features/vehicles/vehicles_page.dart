// ========================================
// GolfFox Vehicles Page v11.0
// Pagina principal de gerenciamento de veiculos
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/gf_tokens.dart';
import '../../ui/widgets/common/gf_app_bar.dart';
import '../../ui/widgets/common/gf_loading_indicator.dart';
import '../../ui/widgets/common/gf_error_widget.dart';
import '../../ui/widgets/common/gf_empty_state.dart';
import '../../ui/widgets/vehicles/vehicle_card.dart';
import '../../ui/widgets/vehicles/vehicle_filters.dart';
import '../../ui/widgets/vehicles/vehicle_stats_card.dart';
import '../../services/vehicle_service.dart';
import '../../models/vehicle.dart';
import 'create_vehicle_page.dart';
import 'vehicle_details_page.dart';

class VehiclesPage extends ConsumerStatefulWidget {
  const VehiclesPage({super.key});

  @override
  ConsumerState<VehiclesPage> createState() => _VehiclesPageState();
}

class _VehiclesPageState extends ConsumerState<VehiclesPage>
    with TickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  VehicleFilters _filters = const VehicleFilters();
  bool _showFilters = false;
  bool _showStats = true;

  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    _animationController.forward();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    setState(() {
      _filters = _filters.copyWith(searchQuery: query);
    });
  }

  void _onFiltersChanged(VehicleFilters filters) {
    setState(() {
      _filters = filters;
    });
  }

  void _clearFilters() {
    setState(() {
      _filters = const VehicleFilters();
      _searchController.clear();
    });
  }

  void _toggleFilters() {
    setState(() {
      _showFilters = !_showFilters;
    });
  }

  void _toggleStats() {
    setState(() {
      _showStats = !_showStats;
    });
  }

  Future<void> _navigateToCreateVehicle() async {
    final result = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const CreateVehiclePage(),
      ),
    );

    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Veiculo criado com sucesso!'),
          backgroundColor: const Color(GfTokens.colorSuccess),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _navigateToVehicleDetails(Vehicle vehicle) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => VehicleDetailsPage(vehicleId: vehicle.id),
      ),
    );
  }

  Future<void> _refreshVehicles() async {
    // Forca atualizacao dos dados
    ref.invalidate(vehiclesStreamProvider);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(GfTokens.colorSurfaceBackground),
      appBar: GfAppBar(
        title: 'Veiculos',
        actions: [
          IconButton(
            icon: Icon(
              _showStats ? Icons.bar_chart : Icons.bar_chart_outlined,
              color: _showStats
                  ? Color(GfTokens.colorPrimary)
                  : Color(GfTokens.colorOnSurface),
            ),
            onPressed: _toggleStats,
            tooltip:
                _showStats ? 'Ocultar estatisticas' : 'Mostrar estatisticas',
          ),
          IconButton(
            icon: Icon(
              _showFilters ? Icons.filter_list : Icons.filter_list_outlined,
              color: _showFilters
                  ? Color(GfTokens.colorPrimary)
                  : Color(GfTokens.colorOnSurface),
            ),
            onPressed: _toggleFilters,
            tooltip: _showFilters ? 'Ocultar filtros' : 'Mostrar filtros',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshVehicles,
            tooltip: 'Atualizar',
          ),
        ],
      ),
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: Column(
          children: [
            // Barra de busca
            Container(
              padding: const EdgeInsets.all(GfTokens.spacingMd),
              decoration: BoxDecoration(
                color: const Color(GfTokens.colorSurface),
                border: Border(
                  bottom: BorderSide(
                    color: const Color(GfTokens.colorBorder),
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      onChanged: _onSearchChanged,
                      decoration: InputDecoration(
                        hintText: 'Buscar veiculos...',
                        prefixIcon: const Icon(Icons.search),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear),
                                onPressed: () {
                                  _searchController.clear();
                                  _onSearchChanged('');
                                },
                              )
                            : null,
                        border: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(GfTokens.radiusMd),
                          borderSide: const BorderSide(
                              color: Color(GfTokens.colorBorder)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(GfTokens.radiusMd),
                          borderSide: const BorderSide(
                              color: Color(GfTokens.colorBorder)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(GfTokens.radiusMd),
                          borderSide: const BorderSide(
                              color: Color(GfTokens.colorPrimary)),
                        ),
                        filled: true,
                        fillColor: const Color(GfTokens.colorSurfaceBackground),
                      ),
                    ),
                  ),
                  if (_filters.hasActiveFilters) ...[
                    const SizedBox(width: GfTokens.spacingSm),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: GfTokens.spacingSm,
                        vertical: GfTokens.spacingXs,
                      ),
                      decoration: BoxDecoration(
                        color:
                            const Color(GfTokens.colorPrimary).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(GfTokens.radiusSm),
                        border: Border.all(
                            color: const Color(GfTokens.colorPrimary)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.filter_list,
                            size: 16,
                            color: const Color(GfTokens.colorPrimary),
                          ),
                          const SizedBox(width: GfTokens.spacingXs),
                          Text(
                            'Filtros ativos',
                            style: TextStyle(
                              color: const Color(GfTokens.colorPrimary),
                              fontSize: GfTokens.fontSizeSm,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(width: GfTokens.spacingXs),
                          GestureDetector(
                            onTap: _clearFilters,
                            child: Icon(
                              Icons.close,
                              size: 16,
                              color: const Color(GfTokens.colorPrimary),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Filtros
            if (_showFilters)
              VehicleFiltersWidget(
                filters: _filters,
                onFiltersChanged: _onFiltersChanged,
              ).animate().slideY(
                    begin: -1,
                    end: 0,
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOut,
                  ),

            // Estatisticas
            if (_showStats)
              const VehicleStatsCard().animate().slideY(
                    begin: -0.5,
                    end: 0,
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOut,
                  ),

            // Lista de veiculos
            Expanded(
              child: FutureBuilder<List<Vehicle>>(
                future: ref
                    .read(vehicleServiceProvider)
                    .getVehicles(filters: _filters),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(
                      child: GfLoadingIndicator(
                        message: 'Carregando veiculos...',
                      ),
                    );
                  }

                  if (snapshot.hasError) {
                    return Center(
                      child: GfErrorWidget(
                        title: 'Erro ao carregar veiculos',
                        message: snapshot.error.toString(),
                        onRetry: _refreshVehicles,
                      ),
                    );
                  }

                  final vehicles = snapshot.data ?? [];

                  if (vehicles.isEmpty) {
                    return Center(
                      child: GfEmptyState(
                        icon: Icons.directions_bus,
                        title: _filters.hasActiveFilters
                            ? 'Nenhum veiculo encontrado'
                            : 'Nenhum veiculo cadastrado',
                        subtitle: _filters.hasActiveFilters
                            ? 'Tente ajustar os filtros de busca'
                            : 'Adicione o primeiro veiculo da sua frota',
                        action: ElevatedButton(
                          onPressed: _filters.hasActiveFilters
                              ? _clearFilters
                              : _navigateToCreateVehicle,
                          child: Text(_filters.hasActiveFilters
                              ? 'Limpar filtros'
                              : 'Adicionar veiculo'),
                        ),
                      ),
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: _refreshVehicles,
                    child: ListView.builder(
                      padding: const EdgeInsets.all(GfTokens.spacingMd),
                      itemCount: vehicles.length,
                      itemBuilder: (context, index) {
                        final vehicle = vehicles[index];
                        return VehicleCard(
                          vehicle: vehicle,
                          onTap: () => _navigateToVehicleDetails(vehicle),
                        )
                            .animate(delay: Duration(milliseconds: index * 50))
                            .slideX(
                              begin: 1,
                              end: 0,
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeOut,
                            )
                            .fadeIn();
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _navigateToCreateVehicle,
        backgroundColor: const Color(GfTokens.colorPrimary),
        foregroundColor: const Color(GfTokens.colorOnPrimary),
        icon: const Icon(Icons.add),
        label: const Text('Novo Veiculo'),
      )
          .animate()
          .scale(
            begin: const Offset(0, 0),
            end: const Offset(1, 1),
            duration: const Duration(milliseconds: 300),
            curve: Curves.elasticOut,
          )
          .fadeIn(delay: const Duration(milliseconds: 500)),
    );
  }
}
