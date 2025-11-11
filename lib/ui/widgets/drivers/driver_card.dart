// ========================================
// GolfFox Driver Card Widget v11.0
// Widget para exibir informacoes resumidas de motoristas
// ========================================

import 'package:flutter/material.dart';
import '../../../core/theme/gf_tokens.dart';
import '../../../models/driver.dart';

class DriverCard extends StatelessWidget {

  const DriverCard({
    required this.driver,
    super.key,
    this.onTap,
    this.onEdit,
    this.onDelete,
    this.onStatusChanged,
  });
  final Driver driver;
  final VoidCallback? onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final ValueChanged<DriverStatus>? onStatusChanged;

  @override
  Widget build(BuildContext context) => Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(GfTokens.radiusMd),
        side: const BorderSide(
          color: Color(GfTokens.colorBorder),
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(GfTokens.radiusMd),
        child: Padding(
          padding: const EdgeInsets.all(GfTokens.spacingMd),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Cabecalho com foto, nome e acoes
              Row(
                children: [
                  // Foto do motorista
                  CircleAvatar(
                    radius: 24,
                    backgroundColor:
                        const Color(GfTokens.colorPrimary).withOpacity(0.1),
                    backgroundImage: driver.profileImageUrl != null
                        ? NetworkImage(driver.profileImageUrl!)
                        : null,
                    child: driver.profileImageUrl == null
                        ? Text(
                            driver.initials,
                            style: const TextStyle(
                              color: Color(GfTokens.colorPrimary),
                              fontWeight: FontWeight.bold,
                              fontSize: GfTokens.fontSizeMd,
                            ),
                          )
                        : null,
                  ),

                  const SizedBox(width: GfTokens.spacingMd),

                  // Nome e informacoes basicas
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                driver.name,
                                style: GfTextStyles.bodyMedium.copyWith(
                                  fontSize: GfTokens.fontSizeLg,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(GfTokens.colorOnSurface),
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),

                            // Status badge
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: GfTokens.spacingSm,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: driver.status.colorValue
                                    .withValues(alpha: 0.1),
                                borderRadius:
                                    BorderRadius.circular(GfTokens.radiusSm),
                                border: Border.all(
                                  color: driver.status.colorValue
                                      .withValues(alpha: 0.3),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    driver.status.iconData,
                                    size: 12,
                                    color: driver.status.colorValue,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    driver.status.displayName,
                                    style: TextStyle(
                                      fontSize: GfTokens.fontSizeXs,
                                      fontWeight: FontWeight.w500,
                                      color: driver.status.colorValue,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 2),

                        // Telefone e email
                        Text(
                          driver.formattedPhone,
                          style: const TextStyle(
                            fontSize: GfTokens.fontSizeSm,
                            color: Color(GfTokens.colorOnSurfaceVariant),
                          ),
                        ),

                        if (driver.email.isNotEmpty)
                          Text(
                            driver.email,
                            style: const TextStyle(
                              fontSize: GfTokens.fontSizeSm,
                              color:
                                  Color(GfTokens.colorOnSurfaceVariant),
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),

                  // Menu de acoes
                  PopupMenuButton<String>(
                    onSelected: (value) => _handleMenuAction(context, value),
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(Icons.edit, size: 18),
                            SizedBox(width: 8),
                            Text('Editar'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'status',
                        child: Row(
                          children: [
                            Icon(Icons.swap_horiz, size: 18),
                            SizedBox(width: 8),
                            Text('Alterar Status'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete, size: 18, color: Colors.red),
                            SizedBox(width: 8),
                            Text('Excluir',
                                style: TextStyle(color: Colors.red)),
                          ],
                        ),
                      ),
                    ],
                    child: const Icon(
                      Icons.more_vert,
                      color: Color(GfTokens.colorOnSurfaceVariant),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: GfTokens.spacingMd),

              // Informacoes da licenca e veiculo
              Row(
                children: [
                  // Licenca
                  Expanded(
                    child: _buildInfoItem(
                      icon: Icons.credit_card,
                      label: 'Licenca',
                      value: driver.license.category.displayName,
                      isAlert: driver.hasExpiredLicense ||
                          driver.hasExpiringSoonLicense,
                    ),
                  ),

                  const SizedBox(width: GfTokens.spacingMd),

                  // Veiculo atual
                  Expanded(
                    child: _buildInfoItem(
                      icon: Icons.directions_car,
                      label: 'Veiculo',
                      value: driver.currentVehicleId ?? 'Nao atribuido',
                      isAlert: false,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: GfTokens.spacingMd),

              // Estatisticas e avaliacao
              Row(
                children: [
                  // Avaliacao
                  Expanded(
                    child: Row(
                      children: [
                        const Icon(
                          Icons.star,
                          size: 16,
                          color: Colors.amber,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          driver.stats.averageRating.toStringAsFixed(1),
                          style: const TextStyle(
                            fontSize: GfTokens.fontSizeSm,
                            fontWeight: FontWeight.w500,
                            color: Color(GfTokens.colorOnSurface),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '(${driver.stats.totalTrips})',
                          style: const TextStyle(
                            fontSize: GfTokens.fontSizeSm,
                            color: Color(GfTokens.colorOnSurfaceVariant),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Status online
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: driver.isOnline
                              ? const Color(GfTokens.colorSuccess)
                              : const Color(GfTokens.colorOnSurfaceVariant),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        driver.isOnline ? 'Online' : 'Offline',
                        style: const TextStyle(
                          fontSize: GfTokens.fontSizeSm,
                          color: Color(GfTokens.colorOnSurfaceVariant),
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              // Alertas (se houver)
              if (driver.hasAlerts) ...[
                const SizedBox(height: GfTokens.spacingMd),
                _buildAlertsSection(),
              ],

              // Ultima atualizacao
              const SizedBox(height: GfTokens.spacingSm),
              Text(
                'Atualizado em ${_formatDate(driver.updatedAt)}',
                style: GfTextStyles.labelSmall.copyWith(
                  fontSize: GfTokens.fontSizeXs,
                  color: const Color(GfTokens.colorOnSurfaceVariant),
                ),
              ),
            ],
          ),
        ),
      ),
    );

  Widget _buildInfoItem({
    required IconData icon,
    required String label,
    required String value,
    required bool isAlert,
  }) => Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: isAlert
              ? const Color(GfTokens.colorWarning)
              : const Color(GfTokens.colorOnSurfaceVariant),
        ),
        const SizedBox(width: 4),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: GfTokens.fontSizeXs,
                  color: Color(GfTokens.colorOnSurfaceVariant),
                ),
              ),
              Text(
                value,
                style: TextStyle(
                  fontSize: GfTokens.fontSizeSm,
                  fontWeight: FontWeight.w500,
                  color: isAlert
                      ? const Color(GfTokens.colorWarning)
                      : const Color(GfTokens.colorOnSurface),
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );

  Widget _buildAlertsSection() {
    final alerts = <Widget>[];

    if (driver.hasExpiredLicense || driver.hasExpiringSoonLicense) {
      alerts.add(_buildAlert(
        icon: Icons.credit_card,
        text: 'Licenca vencendo',
        color: const Color(GfTokens.colorWarning),
      ));
    }

    if (driver.hasExpiredCertifications ||
        driver.hasExpiringSoonCertifications) {
      alerts.add(_buildAlert(
        icon: Icons.verified,
        text: 'Certificacao vencendo',
        color: const Color(GfTokens.colorWarning),
      ));
    }

    return Wrap(
      spacing: GfTokens.spacingSm,
      runSpacing: GfTokens.spacingSm,
      children: alerts,
    );
  }

  Widget _buildAlert({
    required IconData icon,
    required String text,
    required Color color,
  }) => Container(
      padding: const EdgeInsets.symmetric(
        horizontal: GfTokens.spacingSm,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(GfTokens.radiusSm),
        border: Border.all(
          color: color.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 12,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: GfTokens.fontSizeXs,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );

  void _handleMenuAction(BuildContext context, String action) {
    switch (action) {
      case 'edit':
        onEdit?.call();
        break;
      case 'status':
        _showStatusDialog(context);
        break;
      case 'delete':
        onDelete?.call();
        break;
    }
  }

  void _showStatusDialog(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Alterar Status'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: DriverStatus.values.map((status) => ListTile(
              leading: Icon(
                status.iconData,
                color: status.colorValue,
              ),
              title: Text(status.displayName),
              selected: status == driver.status,
              onTap: () {
                Navigator.of(context).pop();
                onStatusChanged?.call(status);
              },
            )).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 0) {
      return '${difference.inDays}d atras';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h atras';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}min atras';
    } else {
      return 'Agora';
    }
  }
}
