// ========================================
// GolfFox Vehicle Details Page v11.0
// Pagina de detalhes do veiculo
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/gf_tokens.dart';
import '../../ui/widgets/common/gf_app_bar.dart';
import '../../ui/widgets/common/gf_loading_indicator.dart';
import '../../ui/widgets/vehicles/vehicle_info_card.dart';
import '../../ui/widgets/vehicles/vehicle_maintenance_list.dart';
import '../../ui/widgets/vehicles/vehicle_fuel_chart.dart';
import '../../models/vehicle.dart';
import '../../services/vehicle_service.dart';
import 'create_vehicle_page.dart';

class VehicleDetailsPage extends ConsumerStatefulWidget {

  const VehicleDetailsPage({
    super.key,
    required this.vehicleId,
  });
  final String vehicleId;

  @override
  ConsumerState<VehicleDetailsPage> createState() => _VehicleDetailsPageState();
}

class _VehicleDetailsPageState extends ConsumerState<VehicleDetailsPage>
    with TickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _editVehicle(Vehicle vehicle) async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (context) => CreateVehiclePage(vehicle: vehicle),
      ),
    );

    if (result ?? false) {
      ref.invalidate(vehicleServiceProvider);
    }
  }

  Future<void> _deleteVehicle(Vehicle vehicle) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Vehicle'),
        content: Text(
          'Are you sure you want to delete the vehicle "${vehicle.name}"? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: const Color(GfTokens.colorError),
            ),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );

    if (confirmed ?? false) {
      setState(() {
        _isLoading = true;
      });

      try {
        await ref.read(vehicleServiceProvider).deleteVehicle(vehicle.id);
        if (mounted) {
          Navigator.of(context).pop();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error deleting vehicle: $e'),
              backgroundColor: const Color(GfTokens.colorError),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } finally {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      }
    }
  }

  Future<void> _changeStatus(Vehicle vehicle, VehicleStatus newStatus) async {
    setState(() {
      _isLoading = true;
    });

    try {
      final updatedVehicle = vehicle.copyWith(
        status: newStatus,
        updatedAt: DateTime.now(),
      );
      await ref.read(vehicleServiceProvider).updateVehicle(updatedVehicle);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Status alterado para ${newStatus.displayName}'),
            backgroundColor: const Color(GfTokens.colorSuccess),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao alterar status: $e'),
            backgroundColor: const Color(GfTokens.colorError),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final vehicleAsync = ref.watch(vehicleProvider(widget.vehicleId));

    return vehicleAsync.when(
      loading: () => const Scaffold(
        backgroundColor: Color(GfTokens.colorSurfaceBackground),
        appBar: GfAppBar(title: 'Carregando...'),
        body: Center(child: GfLoadingIndicator()),
      ),
      error: (error, stack) => Scaffold(
        backgroundColor: const Color(GfTokens.colorSurfaceBackground),
        appBar: const GfAppBar(title: 'Erro'),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 64,
                color: Color(GfTokens.colorError),
              ),
              const SizedBox(height: GfTokens.spacingMd),
              const Text(
                'Error loading vehicle',
                style: TextStyle(
                  fontSize: GfTokens.fontSizeLg,
                  fontWeight: FontWeight.w600,
                  color: Color(GfTokens.colorOnSurface),
                ),
              ),
              const SizedBox(height: GfTokens.spacingSm),
              Text(
                error.toString(),
                style: const TextStyle(
                  color: Color(GfTokens.colorOnSurfaceVariant),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: GfTokens.spacingMd),
              ElevatedButton(
                onPressed: () => ref.invalidate(vehicleServiceProvider),
                child: const Text('Tentar Novamente'),
              ),
            ],
          ),
        ),
      ),
      data: (Vehicle? vehicle) {
        if (vehicle == null) {
          return const Scaffold(
            backgroundColor: Color(GfTokens.colorSurfaceBackground),
            appBar: GfAppBar(title: 'Vehicle not found'),
            body: Center(
              child: Text('Vehicle not found'),
            ),
          );
        }

        final double fuelLevel =
            (vehicle.currentFuelLevel ?? 0).clamp(0, 100).toDouble();

        return Scaffold(
          backgroundColor: const Color(GfTokens.colorSurfaceBackground),
          appBar: GfAppBar(
            title: vehicle.name,
            actions: [
              if (_isLoading)
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                )
              else
                PopupMenuButton<String>(
                  onSelected: (value) {
                    switch (value) {
                      case 'edit':
                        _editVehicle(vehicle);
                        break;
                      case 'activate':
                        _changeStatus(vehicle, VehicleStatus.active);
                        break;
                      case 'deactivate':
                        _changeStatus(vehicle, VehicleStatus.inactive);
                        break;
                      case 'maintenance':
                        _changeStatus(vehicle, VehicleStatus.maintenance);
                        break;
                      case 'delete':
                        _deleteVehicle(vehicle);
                        break;
                    }
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'edit',
                      child: ListTile(
                        leading: Icon(Icons.edit),
                        title: Text('Editar'),
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                    if (vehicle.status != VehicleStatus.active)
                      const PopupMenuItem(
                        value: 'activate',
                        child: ListTile(
                          leading: Icon(Icons.check_circle),
                          title: Text('Ativar'),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    if (vehicle.status != VehicleStatus.inactive)
                      const PopupMenuItem(
                        value: 'deactivate',
                        child: ListTile(
                          leading: Icon(Icons.pause_circle),
                          title: Text('Desativar'),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    if (vehicle.status != VehicleStatus.maintenance)
                      const PopupMenuItem(
                        value: 'maintenance',
                        child: ListTile(
                          leading: Icon(Icons.build),
                          title: Text('Manutencao'),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    const PopupMenuDivider(),
                    const PopupMenuItem(
                      value: 'delete',
                      child: ListTile(
                        leading: Icon(Icons.delete, color: Colors.red),
                        title: Text('Excluir',
                            style: TextStyle(color: Colors.red)),
                        contentPadding: EdgeInsets.zero,
                      ),
                    ),
                  ],
                ),
            ],
          ),
          body: Column(
            children: [
              // Header com status e informacoes principais
              Container(
                padding: const EdgeInsets.all(GfTokens.spacingMd),
                decoration: const BoxDecoration(
                  color: Color(GfTokens.colorSurface),
                  border: Border(
                    bottom:
                        BorderSide(color: Color(GfTokens.colorBorder)),
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        // Status badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: GfTokens.spacingSm,
                            vertical: GfTokens.spacingXs,
                          ),
                          decoration: BoxDecoration(
                            color: vehicle.status.colorValue
                                .withValues(alpha: 0.1),
                            borderRadius:
                                BorderRadius.circular(GfTokens.radiusSm),
                            border: Border.all(
                              color: vehicle.status.colorValue
                                  .withValues(alpha: 0.3),
                            ),
                          ),
                          child: Text(
                            vehicle.status.displayName,
                            style: TextStyle(
                              color: Color(vehicle.status.colorValue),
                              fontWeight: FontWeight.w600,
                              fontSize: GfTokens.fontSizeSm,
                            ),
                          ),
                        ),
                        const Spacer(),
                        // Tipo e combustivel
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              vehicle.type.displayName,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                color: Color(GfTokens.colorOnSurface),
                              ),
                            ),
                            Text(
                              vehicle.fuelType.displayName,
                              style: const TextStyle(
                                fontSize: GfTokens.fontSizeSm,
                                color:
                                    Color(GfTokens.colorOnSurfaceVariant),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: GfTokens.spacingMd),

                    // Metricas principais
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricCard(
                            'Combustivel',
                            '${fuelLevel.toStringAsFixed(0)}%',
                            Icons.local_gas_station,
                            fuelLevel < 20
                                ? const Color(GfTokens.colorWarning)
                                : const Color(GfTokens.colorSuccess),
                          ),
                        ),
                        const SizedBox(width: GfTokens.spacingSm),
                        Expanded(
                          child: _buildMetricCard(
                            'Odometro',
                            '${vehicle.odometer.toStringAsFixed(0)} km',
                            Icons.speed,
                            const Color(GfTokens.colorPrimary),
                          ),
                        ),
                        const SizedBox(width: GfTokens.spacingSm),
                        Expanded(
                          child: _buildMetricCard(
                            'Capacidade',
                            '${vehicle.specifications.capacity} pass.',
                            Icons.people,
                            const Color(GfTokens.colorInfo),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Tabs
              TabBar(
                controller: _tabController,
                tabs: const [
                  Tab(text: 'Visao Geral'),
                  Tab(text: 'Manutencao'),
                  Tab(text: 'Combustivel'),
                  Tab(text: 'Historico'),
                ],
              ),

              // Tab content
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildOverviewTab(vehicle),
                    _buildMaintenanceTab(vehicle),
                    _buildFuelTab(vehicle),
                    _buildHistoryTab(vehicle),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMetricCard(
      String title, String value, IconData icon, Color color) => Container(
      padding: const EdgeInsets.all(GfTokens.spacingSm),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(GfTokens.radiusSm),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: GfTokens.spacingXs),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: const Color(GfTokens.colorOnSurface),
              fontSize: GfTokens.fontSizeSm,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              fontSize: GfTokens.fontSizeXs,
              color: const Color(GfTokens.colorOnSurfaceVariant),
            ),
          ),
        ],
      ),
    );

  Widget _buildOverviewTab(Vehicle vehicle) => SingleChildScrollView(
      padding: const EdgeInsets.all(GfTokens.spacingMd),
      child: Column(
        children: [
          VehicleInfoCard(vehicle: vehicle),
          const SizedBox(height: GfTokens.spacingMd),

          // Documentos
          Card(
            child: Padding(
              padding: const EdgeInsets.all(GfTokens.spacingMd),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Documentos',
                    style: TextStyle(
                      fontSize: GfTokens.fontSizeLg,
                      fontWeight: FontWeight.w600,
                      color: const Color(GfTokens.colorOnSurface),
                    ),
                  ),
                  const SizedBox(height: GfTokens.spacingMd),
                  _buildDocumentRow(
                      'Placa', vehicle.documents.licensePlate ?? 'N/A'),
                  _buildDocumentRow(
                      'Chassi', vehicle.documents.chassisNumber ?? 'N/A'),
                  _buildDocumentRow(
                      'RENAVAM', vehicle.documents.renavam ?? 'N/A'),
                  if (vehicle.documents.licenseExpiryDate != null)
                    _buildDocumentRow(
                      'Venc. Licenca',
                      vehicle.documents.licenseExpiryFormatted,
                      isExpiring: vehicle.documents.isLicenseExpiring,
                      isExpired: vehicle.documents.isLicenseExpired,
                    ),
                  if (vehicle.documents.inspectionExpiryDate != null)
                    _buildDocumentRow(
                      'Venc. Vistoria',
                      vehicle.documents.inspectionExpiryFormatted,
                      isExpiring: vehicle.documents.isInspectionExpiring,
                      isExpired: vehicle.documents.isInspectionExpired,
                    ),
                  if (vehicle.documents.insuranceExpiryDate != null)
                    _buildDocumentRow(
                      'Venc. Seguro',
                      vehicle.documents.insuranceExpiryFormatted,
                      isExpiring: vehicle.documents.isInsuranceExpiring,
                      isExpired: vehicle.documents.isInsuranceExpired,
                    ),
                ],
              ),
            ),
          ),

          const SizedBox(height: GfTokens.spacingMd),

          // Especificacoes
          Card(
            child: Padding(
              padding: const EdgeInsets.all(GfTokens.spacingMd),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Especificacoes',
                    style: TextStyle(
                      fontSize: GfTokens.fontSizeLg,
                      fontWeight: FontWeight.w600,
                      color: const Color(GfTokens.colorOnSurface),
                    ),
                  ),
                  const SizedBox(height: GfTokens.spacingMd),
                  _buildSpecRow(
                      'Fabricante', vehicle.specifications.manufacturer),
                  _buildSpecRow('Modelo', vehicle.specifications.model),
                  _buildSpecRow('Ano', vehicle.specifications.year.toString()),
                  _buildSpecRow('Cor', vehicle.specifications.color),
                  _buildSpecRow(
                      'Motor', '${vehicle.specifications.engineSize}L'),
                  _buildSpecRow(
                      'Tanque', '${vehicle.specifications.fuelTankCapacity}L'),
                  _buildSpecRow('Peso', '${vehicle.specifications.weight}kg'),
                  _buildSpecRow(
                    'Dimensoes',
                    '${vehicle.specifications.length}m  ${vehicle.specifications.width}m  ${vehicle.specifications.height}m',
                  ),
                ],
              ),
            ),
          ),

          if (vehicle.features.isNotEmpty) ...[
            const SizedBox(height: GfTokens.spacingMd),

            // Recursos
            Card(
              child: Padding(
                padding: const EdgeInsets.all(GfTokens.spacingMd),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Recursos',
                      style: TextStyle(
                        fontSize: GfTokens.fontSizeLg,
                        fontWeight: FontWeight.w600,
                        color: const Color(GfTokens.colorOnSurface),
                      ),
                    ),
                    const SizedBox(height: GfTokens.spacingMd),
                    Wrap(
                      spacing: GfTokens.spacingSm,
                      runSpacing: GfTokens.spacingSm,
                      children: vehicle.features.map((feature) {
                        return Chip(
                          label: Text(feature),
                          backgroundColor: const Color(GfTokens.colorPrimary)
                              .withValues(alpha: 0.1),
                          side: BorderSide(
                            color: const Color(GfTokens.colorPrimary)
                                .withValues(alpha: 0.3),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );

  Widget _buildMaintenanceTab(Vehicle vehicle) => VehicleMaintenanceList(vehicleId: vehicle.id);

  Widget _buildFuelTab(Vehicle vehicle) => VehicleFuelChart(vehicleId: vehicle.id);

  Widget _buildHistoryTab(Vehicle vehicle) => SingleChildScrollView(
      padding: const EdgeInsets.all(GfTokens.spacingMd),
      child: Column(
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(GfTokens.spacingMd),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Historico do Veiculo',
                    style: TextStyle(
                      fontSize: GfTokens.fontSizeLg,
                      fontWeight: FontWeight.w600,
                      color: const Color(GfTokens.colorOnSurface),
                    ),
                  ),
                  const SizedBox(height: GfTokens.spacingMd),
                  _buildHistoryItem(
                    'Veiculo criado',
                    vehicle.createdAt,
                    Icons.add_circle,
                    const Color(GfTokens.colorSuccess),
                  ),
                  if (vehicle.updatedAt != vehicle.createdAt)
                    _buildHistoryItem(
                      'Ultima atualizacao',
                      vehicle.updatedAt,
                      Icons.edit,
                      const Color(GfTokens.colorInfo),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );

  Widget _buildDocumentRow(
    String label,
    String value, {
    bool isExpiring = false,
    bool isExpired = false,
  }) {
    Color? textColor;
    if (isExpired) {
      textColor = const Color(GfTokens.colorError);
    } else if (isExpiring) {
      textColor = const Color(GfTokens.colorWarning);
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: GfTokens.spacingSm),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Color(GfTokens.colorOnSurfaceVariant),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w500,
              color: textColor ?? const Color(GfTokens.colorOnSurface),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecRow(String label, String value) => Padding(
      padding: const EdgeInsets.only(bottom: GfTokens.spacingSm),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: const Color(GfTokens.colorOnSurfaceVariant),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w500,
              color: const Color(GfTokens.colorOnSurface),
            ),
          ),
        ],
      ),
    );

  Widget _buildHistoryItem(
    String title,
    DateTime date,
    IconData icon,
    Color color,
  ) => Padding(
      padding: const EdgeInsets.only(bottom: GfTokens.spacingMd),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(GfTokens.radiusSm),
              border: Border.all(color: color.withValues(alpha: 0.3)),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: GfTokens.spacingMd),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: const Color(GfTokens.colorOnSurface),
                  ),
                ),
                Text(
                  '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} as ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}',
                  style: TextStyle(
                    fontSize: GfTokens.fontSizeSm,
                    color: const Color(GfTokens.colorOnSurfaceVariant),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
}
