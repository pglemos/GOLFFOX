// ========================================
// GolfFox Routes Page v11.0
// Pagina de gerenciamento de rotas
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/i18n/i18n.dart';
import '../../core/services/snackbar_service.dart';
import '../../core/theme/gf_tokens.dart';
import '../../models/route.dart';
import '../../services/route_service.dart';
import '../../ui/widgets/gf_app_bar.dart';
import '../../ui/widgets/routes/route_card.dart';
import '../../ui/widgets/routes/route_filters.dart';
import 'create_route_page.dart';
import 'route_details_page.dart';

class RoutesPage extends ConsumerStatefulWidget {
  const RoutesPage({super.key});

  @override
  ConsumerState<RoutesPage> createState() => _RoutesPageState();
}

class _RoutesPageState extends ConsumerState<RoutesPage> {
  RouteStatus? _selectedStatus;
  String? _selectedVehicle;
  String? _selectedDriver;
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final routesAsync = ref.watch(routesStreamProvider);

    return Scaffold(
      appBar: GfAppBar(
        title: I18n.t(context, 'routes.title'),
        actions: [
          IconButton(
            onPressed: _showCreateRouteDialog,
            icon: const Icon(Icons.add),
            tooltip: I18n.t(context, 'routes.action.new'),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filtros e busca
          Container(
            padding: const EdgeInsets.all(GfTokens.space4),
            decoration: const BoxDecoration(
              color: Color(GfTokens.surface),
              border: Border(
                bottom: BorderSide(color: Color(GfTokens.stroke)),
              ),
            ),
            child: Column(
              children: [
                // Barra de busca
                TextField(
                  onChanged: (value) => setState(() => _searchQuery = value),
                  decoration: InputDecoration(
                    hintText: I18n.t(context, 'routes.search.hint'),
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            onPressed: () => setState(() => _searchQuery = ''),
                            icon: const Icon(Icons.clear),
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
                      borderSide:
                          const BorderSide(color: Color(GfTokens.stroke)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
                      borderSide:
                          const BorderSide(color: Color(GfTokens.stroke)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
                      borderSide:
                          const BorderSide(color: Color(GfTokens.primary)),
                    ),
                  ),
                ),

                const SizedBox(height: GfTokens.space3),

                // Filtros
                RouteFilters(
                  selectedStatus: _selectedStatus,
                  selectedVehicle: _selectedVehicle,
                  selectedDriver: _selectedDriver,
                  onStatusChanged: (status) =>
                      setState(() => _selectedStatus = status),
                  onVehicleChanged: (vehicle) =>
                      setState(() => _selectedVehicle = vehicle),
                  onDriverChanged: (driver) =>
                      setState(() => _selectedDriver = driver),
                  onClearFilters: () => setState(() {
                    _selectedStatus = null;
                    _selectedVehicle = null;
                    _selectedDriver = null;
                  }),
                ),
              ],
            ),
          ),

          // Lista de rotas
          Expanded(
            child: routesAsync.when(
              data: _buildRoutesList,
              loading: _buildLoadingState,
              error: (error, stack) => _buildErrorState(error),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _navigateToCreateRoute,
        backgroundColor: const Color(GfTokens.primary),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: Text(I18n.t(context, 'routes.action.new')),
      ),
    );
  }

  Widget _buildRoutesList(List<BusRoute> routes) {
    final filteredRoutes = _filterRoutes(routes);

    if (filteredRoutes.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(routesStreamProvider);
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(GfTokens.space4),
        itemCount: filteredRoutes.length,
        itemBuilder: (context, index) {
          final route = filteredRoutes[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: GfTokens.space3),
            child: RouteCard(
              route: route,
              onTap: () => _navigateToRouteDetails(route),
              onStart: route.status == RouteStatus.planned
                  ? () => _startRoute(route)
                  : null,
              onCancel: route.isActive ? () => _cancelRoute(route) : null,
              onEdit: route.status == RouteStatus.planned
                  ? () => _editRoute(route)
                  : null,
            ),
          )
              .animate()
              .slideX(
                begin: 0.2,
                end: 0,
                delay: Duration(milliseconds: index * 100),
              )
              .fadeIn();
        },
      ),
    );
  }

  Widget _buildLoadingState() => const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(
            color: Color(GfTokens.primary),
          ),
          SizedBox(height: GfTokens.space4),
          Text(
            'Carregando rotas...',
            style: TextStyle(
              fontSize: 16,
              color: Color(GfTokens.textMuted),
            ),
          ),
        ],
      ),
    );

  Widget _buildErrorState(Object error) => Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            size: 64,
            color: Color(GfTokens.error),
          ),
          const SizedBox(height: GfTokens.space4),
          const Text(
            'Erro ao carregar rotas',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(GfTokens.textTitle),
            ),
          ),
          const SizedBox(height: GfTokens.space2),
          Text(
            error.toString(),
            style: const TextStyle(
              fontSize: 14,
              color: Color(GfTokens.textMuted),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: GfTokens.space4),
          ElevatedButton.icon(
            onPressed: () => ref.invalidate(routesStreamProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Tentar Novamente'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(GfTokens.primary),
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );

  Widget _buildEmptyState() => Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.route,
            size: 64,
            color: Color(GfTokens.textMuted),
          ),
          const SizedBox(height: GfTokens.space4),
          const Text(
            'Nenhuma rota encontrada',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(GfTokens.textTitle),
            ),
          ),
          const SizedBox(height: GfTokens.space2),
          const Text(
            'Crie sua primeira rota ou ajuste os filtros',
            style: TextStyle(
              fontSize: 14,
              color: Color(GfTokens.textMuted),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: GfTokens.space4),
          ElevatedButton.icon(
            onPressed: _navigateToCreateRoute,
            icon: const Icon(Icons.add),
            label: const Text('Criar Rota'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(GfTokens.primary),
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );

  List<BusRoute> _filterRoutes(List<BusRoute> routes) => routes.where((route) {
      // Filtro por status
      if (_selectedStatus != null && route.status != _selectedStatus) {
        return false;
      }

      // Filtro por veiculo
      if (_selectedVehicle != null && route.vehicleId != _selectedVehicle) {
        return false;
      }

      // Filtro por motorista
      if (_selectedDriver != null && route.driverId != _selectedDriver) {
        return false;
      }

      // Filtro por busca
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        return route.name.toLowerCase().contains(query) ||
            (route.description?.toLowerCase().contains(query) ?? false);
      }

      return true;
    }).toList();

  void _showCreateRouteDialog() {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Criar Nova Rota'),
        content: const Text('Como voce gostaria de criar a rota?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              _navigateToCreateRoute(isAutoGenerated: true);
            },
            child: const Text('Gerar Automaticamente'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              _navigateToCreateRoute();
            },
            child: const Text('Criar Manualmente'),
          ),
        ],
      ),
    );
  }

  void _navigateToCreateRoute({bool isAutoGenerated = false}) {
    Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (context) => CreateRoutePage(
          isAutoGenerated: isAutoGenerated,
        ),
      ),
    );
  }

  void _navigateToRouteDetails(BusRoute route) {
    Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (context) => RouteDetailsPage(route: route),
      ),
    );
  }

  Future<void> _startRoute(BusRoute route) async {
    try {
      await ref.read(routeServiceProvider).startRoute(route.id);

      if (!mounted) return;

      SnackBarService.success(
        context,
        'routes.start.success',
        params: {'name': route.name},
      );
    } on Exception catch (e) {
      if (!mounted) return;

      SnackBarService.error(
        context,
        e,
        fallbackKey: 'routes.start.error',
        params: {'message': e.toString()},
      );
    }
  }

  void _cancelRoute(BusRoute route) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(I18n.t(context, 'routes.cancel.title')),
        content:
            Text(I18n.t(context, 'routes.cancel.prompt', params: {'name': route.name})),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: Text(I18n.t(context, 'common.no')),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(dialogContext).pop();

              try {
                await ref.read(routeServiceProvider).cancelRoute(
                      route.id,
                      'Cancelada pelo usuario',
                    );

                if (!mounted) return;

                SnackBarService.warn(
                  context,
                  'routes.cancel.success',
                  params: {'name': route.name},
                );
              } on Exception catch (e) {
                if (!mounted) return;

                SnackBarService.error(
                  context,
                  e,
                  fallbackKey: 'routes.cancel.error',
                  params: {'message': e.toString()},
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(GfTokens.error),
              foregroundColor: Colors.white,
            ),
            child: Text(I18n.t(context, 'routes.cancel.confirm')),
          ),
        ],
      ),
    );
  }

  void _editRoute(BusRoute route) {
    Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (context) => CreateRoutePage(
          route: route,
        ),
      ),
    );
  }
}
