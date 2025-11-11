import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/routing/app_router.dart';
import '../../core/theme/gf_tokens.dart';
import '../../models/driver.dart';
import '../../services/driver_service.dart';
import '../../ui/shell/gf_app_bar.dart';
import '../../ui/widgets/drivers/driver_info_card.dart';
import '../../ui/widgets/drivers/driver_rating_card.dart';
import '../../ui/widgets/drivers/driver_trip_history.dart';
import '../../widgets/gx_button.dart';
import '../../widgets/gx_dialog.dart';
import '../../widgets/gx_toast.dart';

class DriverDetailsPage extends ConsumerStatefulWidget {

  const DriverDetailsPage({
    required this.driverId,
    super.key,
  });
  final String driverId;

  @override
  ConsumerState<DriverDetailsPage> createState() => _DriverDetailsPageState();
}

class _DriverDetailsPageState extends ConsumerState<DriverDetailsPage>
    with TickerProviderStateMixin {
  late TabController _tabController;
  Driver? _driver;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadDriver();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadDriver() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final driverService = ref.read(driverServiceProvider.notifier);
      final driver = await driverService.getDriverById(widget.driverId);

      if (mounted) {
        setState(() {
          _driver = driver;
          _isLoading = false;
        });
      }
    } on Exception catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _toggleOnlineStatus() async {
    if (_driver == null) return;

    try {
      final driverService = ref.read(driverServiceProvider.notifier);
      await driverService.updateDriverOnlineStatus(
        _driver!.id,
        isOnline: !_driver!.isOnline,
      );

      if (!mounted) return;

      setState(() {
        _driver = _driver!.copyWith(isOnline: !_driver!.isOnline);
      });

      GxToast.success(
        context,
        _driver!.isOnline
            ? 'Motorista ficou online'
            : 'Motorista ficou offline',
      );
    } on Exception catch (e) {
      if (!mounted) return;
      GxToast.error(context, 'Erro ao alterar status: $e');
    }
  }

  Future<void> _changeStatus() async {
    if (_driver == null) return;

    final newStatus = await showDialog<DriverStatus>(
      context: context,
      builder: (context) => _StatusChangeDialog(
        currentStatus: _driver!.status,
      ),
    );

    if (!mounted) return;

    if (newStatus != null && newStatus != _driver!.status) {
      try {
        final driverService = ref.read(driverServiceProvider.notifier);
        await driverService.updateDriverStatus(_driver!.id, newStatus);

        if (!mounted) return;

        setState(() {
          _driver = _driver!.copyWith(status: newStatus);
        });

        GxToast.success(
          context,
          'Status alterado para ${newStatus.displayName}',
        );
      } on Exception catch (e) {
        if (!mounted) return;
        GxToast.error(context, 'Erro ao alterar status: $e');
      }
    }
  }

  Future<void> _deleteDriver() async {
    if (_driver == null) return;

    final confirmed = await GxDialog.confirm(
      context,
      title: 'Delete Driver',
      message: 'Are you sure you want to delete ${_driver!.name}?\n\n'
          'This action cannot be undone.',
      confirmText: 'Delete',
      isDestructive: true,
    );

    if (!mounted) return;

    if (confirmed ?? false) {
      try {
        final driverService = ref.read(driverServiceProvider.notifier);
        await driverService.deleteDriver(_driver!.id);

        if (!mounted) return;

        GxToast.success(context, 'Motorista excluido com sucesso');
        AppRouter.instance.pop();
      } on Exception catch (e) {
        if (!mounted) return;
        GxToast.error(context, 'Erro ao excluir motorista: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        appBar: GfAppBar(
          title: 'Carregando...',
        ),
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: const GfAppBar(
          title: 'Erro',
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 64,
                color: Color(GfTokens.colorError),
              ),
              const SizedBox(height: 16),
              const Text(
                'Erro ao carregar motorista',
                style: GfTextStyles.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                style: GfTextStyles.bodyMedium.copyWith(
                  color: const Color(GfTokens.colorOnSurfaceVariant),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              const SizedBox(height: 8),
              GxButton.outlined(
                'Tentar Novamente',
                onPressed: _loadDriver,
              ),
            ],
          ),
        ),
      );
    }

    if (_driver == null) {
      return const Scaffold(
        appBar: GfAppBar(
          title: 'Driver not found',
        ),
        body: Center(
          child: Text('Driver not found'),
        ),
      );
    }

    return Scaffold(
      appBar: GfAppBar(
        title: _driver!.name,
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert),
            onSelected: (value) {
              switch (value) {
                case 'edit':
    AppRouter.instance.push('/drivers/edit/${_driver!.id}');
                  break;
                case 'toggle_online':
                  _toggleOnlineStatus();
                  break;
                case 'change_status':
                  _changeStatus();
                  break;
                case 'delete':
                  _deleteDriver();
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
              PopupMenuItem(
                value: 'toggle_online',
                child: ListTile(
                  leading: Icon(
                    _driver!.isOnline
                        ? Icons.offline_bolt
                        : Icons.online_prediction,
                  ),
                  title: Text(
                    _driver!.isOnline ? 'Ficar Offline' : 'Ficar Online',
                  ),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              const PopupMenuItem(
                value: 'change_status',
                child: ListTile(
                  leading: Icon(Icons.swap_horiz),
                  title: Text('Alterar Status'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(
                value: 'delete',
                child: ListTile(
                  leading: Icon(Icons.delete, color: Colors.red),
                  title: Text('Excluir', style: TextStyle(color: Colors.red)),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Header com informações principais
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Color(GfTokens.colorSurface),
              border: Border(
                bottom: BorderSide(
                  color: Color(GfTokens.colorOutlineVariant),
                ),
              ),
            ),
            child: Row(
              children: [
                // Avatar
                CircleAvatar(
                  radius: 32,
                  backgroundColor:
      const Color(GfTokens.colorPrimary).withValues(alpha: 0.1),
                  backgroundImage: _driver!.profileImageUrl != null
                      ? NetworkImage(_driver!.profileImageUrl!)
                      : null,
                  child: _driver!.profileImageUrl == null
                      ? Text(
                          _driver!.initials,
                          style: GfTextStyles.headlineSmall.copyWith(
                            color: const Color(GfTokens.colorPrimary),
                            fontWeight: FontWeight.bold,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 16),
                // Informações principais
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              _driver!.name,
                              style: GfTextStyles.headlineSmall,
                            ),
                          ),
                          // Status badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: _driver!.status.colorValue
                                  .withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: _driver!.status.colorValue
                                    .withValues(alpha: 0.3),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _driver!.status.iconData,
                                  size: 12,
                                  color: _driver!.status.colorValue,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  _driver!.status.displayName,
                                  style: GfTextStyles.labelSmall.copyWith(
                                    color: _driver!.status.colorValue,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.phone,
                            size: 16,
                            color: Color(GfTokens.colorOnSurfaceVariant),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _driver!.formattedPhone,
                            style: GfTextStyles.bodyMedium.copyWith(
                              color:
                                  const Color(GfTokens.colorOnSurfaceVariant),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Icon(
                            _driver!.isOnline
                                ? Icons.online_prediction
                                : Icons.offline_bolt,
                            size: 16,
                            color: _driver!.isOnline
                                ? const Color(GfTokens.colorSuccess)
                                : const Color(GfTokens.colorOnSurfaceVariant),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _driver!.isOnline ? 'Online' : 'Offline',
                            style: GfTextStyles.bodyMedium.copyWith(
                              color: _driver!.isOnline
                                  ? const Color(GfTokens.colorSuccess)
                                  : const Color(GfTokens.colorOnSurfaceVariant),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Métricas rápidas
                      Row(
                        children: [
                          _buildQuickMetric(
                            'Avaliação',
                            _driver!.stats.averageRating.toStringAsFixed(1),
                            const Color(GfTokens.colorWarning),
                          ),
                          const SizedBox(width: 16),
                          _buildQuickMetric(
                            'Viagens',
                            _driver!.stats.totalTrips.toString(),
                            const Color(GfTokens.colorPrimary),
                          ),
                          const SizedBox(width: 16),
                          _buildQuickMetric(
                            'Distância',
                            '${(_driver!.stats.totalDistance / 1000).toStringAsFixed(0)} km',
                            const Color(GfTokens.colorSecondary),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn().slideY(begin: -0.2),

          // Tab Bar
          TabBar(
            controller: _tabController,
            tabs: const [
              Tab(
                icon: Icon(Icons.info_outline),
                text: 'Informações',
              ),
              Tab(
                icon: Icon(Icons.star_outline),
                text: 'Avaliações',
              ),
              Tab(
                icon: Icon(Icons.history),
                text: 'Histórico',
              ),
            ],
          ),

          // Tab Views
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Aba de Informações
                SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: DriverInfoCard(driver: _driver!),
                ).animate().fadeIn(delay: 100.ms),

                // Aba de Avaliações
                SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: DriverRatingCard(driver: _driver!),
                ).animate().fadeIn(delay: 200.ms),

                // Aba de Histórico
                SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: DriverTripHistory(driverId: _driver!.id),
                ).animate().fadeIn(delay: 300.ms),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickMetric(String label, String value, Color color) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GfTextStyles.labelSmall.copyWith(
            color: const Color(GfTokens.colorOnSurfaceVariant),
          ),
        ),
        Text(
          value,
          style: GfTextStyles.labelLarge.copyWith(
            color: color,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
}

class _StatusChangeDialog extends StatefulWidget {

  const _StatusChangeDialog({
    required this.currentStatus,
  });
  final DriverStatus currentStatus;

  @override
  State<_StatusChangeDialog> createState() => _StatusChangeDialogState();
}

class _StatusChangeDialogState extends State<_StatusChangeDialog> {
  late DriverStatus _selectedStatus;

  @override
  void initState() {
    super.initState();
    _selectedStatus = widget.currentStatus;
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
      title: const Text('Alterar Status'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: DriverStatus.values
            .map(
              (status) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Icon(
                  status.iconData,
                  size: 20,
                  color: status.colorValue,
                ),
                title: Text(status.displayName),
                trailing: Icon(
                  status == _selectedStatus
                      ? Icons.radio_button_checked
                      : Icons.radio_button_unchecked,
                  color:
                      status == _selectedStatus ? status.colorValue : Colors.grey,
                ),
                onTap: () {
                  setState(() {
                    _selectedStatus = status;
                  });
                },
              ),
            )
            .toList(),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        GxButton(
          'Alterar',
          onPressed: _selectedStatus != widget.currentStatus
              ? () => Navigator.of(context).pop(_selectedStatus)
              : null,
        ),
      ],
    );
}
