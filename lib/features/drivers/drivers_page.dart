// ========================================
// GolfFox Drivers Page v11.0
// Página principal de listagem de motoristas
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/gf_tokens.dart';
import '../../models/driver.dart';
import '../../services/driver_service.dart';
import '../../ui/widgets/common/gf_app_bar.dart';
import '../../ui/widgets/common/gf_loading_indicator.dart';
import '../../ui/widgets/drivers/driver_card.dart';
import '../../ui/widgets/drivers/driver_filters.dart';
import '../../ui/widgets/drivers/driver_stats_card.dart';
import 'create_driver_page.dart';
import 'driver_details_page.dart';

class DriversPage extends ConsumerStatefulWidget {
  const DriversPage({super.key});

  @override
  ConsumerState<DriversPage> createState() => _DriversPageState();
}

class _DriversPageState extends ConsumerState<DriversPage> {
  final TextEditingController _searchController = TextEditingController();
  bool _showFilters = false;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final service = ref.read(driverServiceProvider.notifier);
    final currentFilters = service.currentFilters;
    service.updateFilters(currentFilters.copyWith(search: _searchController.text));
  }

  @override
  Widget build(BuildContext context) {
    final driversAsync = ref.watch(driverServiceProvider);
    final service = ref.read(driverServiceProvider.notifier);
    final currentFilters = service.currentFilters;

    return Scaffold(
      backgroundColor: GfTokens.colorBackground,
      appBar: GfAppBar(
        title: 'Motoristas',
        actions: [
          // Botão de filtros
          IconButton(
            onPressed: () {
              setState(() {
                _showFilters = !_showFilters;
              });
            },
            icon: Badge(
              isLabelVisible: currentFilters.hasActiveFilters,
              label: Text('${currentFilters.activeFiltersCount}'),
              child: Icon(
                _showFilters ? Icons.filter_list_off : Icons.filter_list,
              ),
            ),
            tooltip: _showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros',
          ),
          
          // Botão de atualizar
          IconButton(
            onPressed: service.refreshDrivers,
            icon: const Icon(Icons.refresh),
            tooltip: 'Atualizar',
          ),
          
          // Botão de adicionar
          IconButton(
            onPressed: _navigateToCreateDriver,
            icon: const Icon(Icons.add),
            tooltip: 'Adicionar Motorista',
          ),
        ],
      ),
      body: Column(
        children: [
          // Barra de busca
          Container(
            padding: const EdgeInsets.all(GfTokens.spacingMd),
            decoration: const BoxDecoration(
              color: GfTokens.colorSurface,
              border: Border(
                bottom: BorderSide(color: GfTokens.colorBorder),
              ),
            ),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Buscar motoristas...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        onPressed: _searchController.clear,
                        icon: const Icon(Icons.clear),
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(GfTokens.radiusSm),
                  borderSide: const BorderSide(color: GfTokens.colorBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(GfTokens.radiusSm),
                  borderSide: const BorderSide(color: GfTokens.colorBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(GfTokens.radiusSm),
                  borderSide: const BorderSide(color: GfTokens.colorPrimary),
                ),
                filled: true,
                fillColor: GfTokens.colorBackground,
              ),
            ),
          ),

          // Filtros (se visíveis)
          if (_showFilters)
            DriverFilters(
              filters: currentFilters,
              onFiltersChanged: (filters) {
                service.updateFilters(filters);
              },
              onClearFilters: () {
                service.clearFilters();
              },
            ).animate().slideY(begin: -1, duration: 300.ms),

          // Estatísticas
          Padding(
            padding: const EdgeInsets.all(GfTokens.spacingMd),
            child: DriverStatsCard(
              stats: service.getDriversStats(),
            ),
          ),

          // Lista de motoristas
          Expanded(
            child: driversAsync.when(
              loading: () => const Center(child: GfLoadingIndicator()),
              error: (error, stack) => _buildErrorState(error, service),
              data: (drivers) => drivers.isEmpty
                  ? _buildEmptyState(currentFilters)
                  : _buildDriversList(drivers),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _navigateToCreateDriver,
        backgroundColor: GfTokens.colorPrimary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildDriversList(List<Driver> drivers) => RefreshIndicator(
      onRefresh: () => ref.read(driverServiceProvider.notifier).refreshDrivers(),
      child: ListView.builder(
        padding: const EdgeInsets.all(GfTokens.spacingMd),
        itemCount: drivers.length,
        itemBuilder: (context, index) {
          final driver = drivers[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: GfTokens.spacingMd),
            child: DriverCard(
              driver: driver,
              onTap: () => _navigateToDriverDetails(driver.id),
              onEdit: () => _navigateToEditDriver(driver),
              onDelete: () => _showDeleteConfirmation(driver),
              onStatusChanged: (status) => _updateDriverStatus(driver.id, status),
            ).animate().fadeIn(delay: Duration(milliseconds: index * 50)),
          );
        },
      ),
    );

  Widget _buildEmptyState(DriverFilters filters) => Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            filters.hasActiveFilters ? Icons.search_off : Icons.person_off,
            size: 64,
            color: GfTokens.colorOnSurfaceVariant,
          ),
          const SizedBox(height: GfTokens.spacingMd),
          Text(
            filters.hasActiveFilters 
                ? 'Nenhum motorista encontrado'
                : 'Nenhum motorista cadastrado',
            style: TextStyle(
              fontSize: GfTokens.fontSizeLg,
              fontWeight: FontWeight.w600,
              color: GfTokens.colorOnSurface,
            ),
          ),
          const SizedBox(height: GfTokens.spacingSm),
          Text(
            filters.hasActiveFilters
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece adicionando o primeiro motorista.',
            style: TextStyle(
              color: GfTokens.colorOnSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: GfTokens.spacingMd),
          if (filters.hasActiveFilters)
            TextButton(
              onPressed: () {
                ref.read(driverServiceProvider.notifier).clearFilters();
                _searchController.clear();
                setState(() {
                  _showFilters = false;
                });
              },
              child: const Text('Limpar Filtros'),
            )
          else
            ElevatedButton.icon(
              onPressed: _navigateToCreateDriver,
              icon: const Icon(Icons.add),
              label: const Text('Adicionar Motorista'),
            ),
        ],
      ),
    );

  Widget _buildErrorState(Object error, DriverService service) => Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: GfTokens.colorError,
          ),
          const SizedBox(height: GfTokens.spacingMd),
          Text(
            'Erro ao carregar motoristas',
            style: TextStyle(
              fontSize: GfTokens.fontSizeLg,
              fontWeight: FontWeight.w600,
              color: GfTokens.colorOnSurface,
            ),
          ),
          const SizedBox(height: GfTokens.spacingSm),
          Text(
            error.toString(),
            style: TextStyle(
              color: GfTokens.colorOnSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: GfTokens.spacingMd),
          ElevatedButton(
            onPressed: () => service.refreshDrivers(),
            child: const Text('Tentar Novamente'),
          ),
        ],
      ),
    );

  void _navigateToCreateDriver() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const CreateDriverPage(),
      ),
    );
  }

  void _navigateToEditDriver(Driver driver) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => CreateDriverPage(driver: driver),
      ),
    );
  }

  void _navigateToDriverDetails(String driverId) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => DriverDetailsPage(driverId: driverId),
      ),
    );
  }

  void _updateDriverStatus(String driverId, DriverStatus status) {
    ref.read(driverServiceProvider.notifier).updateDriverStatus(driverId, status);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Status do motorista atualizado para ${status.displayName}'),
        backgroundColor: GfTokens.colorSuccess,
      ),
    );
  }

  void _showDeleteConfirmation(Driver driver) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Exclusão'),
        content: Text(
          'Tem certeza que deseja excluir o motorista "${driver.name}"?\n\n'
          'Esta ação não pode ser desfeita.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _deleteDriver(driver);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: GfTokens.colorError,
              foregroundColor: Colors.white,
            ),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
  }

  void _deleteDriver(Driver driver) {
    ref.read(driverServiceProvider.notifier).deleteDriver(driver.id);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Motorista "${driver.name}" excluído com sucesso'),
        backgroundColor: GfTokens.colorSuccess,
        action: SnackBarAction(
          label: 'Desfazer',
          onPressed: () {
            // TODO: Implementar desfazer exclusão
            ref.read(driverServiceProvider.notifier).createDriver(driver);
          },
        ),
      ),
    );
  }
}