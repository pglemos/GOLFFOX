import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../../core/theme/gf_tokens.dart';
import '../../../models/driver.dart';
import '../../../widgets/gx_card.dart';

class DriverInfoCard extends StatelessWidget {

  const DriverInfoCard({
    super.key,
    required this.driver,
  });
  final Driver driver;

  @override
  Widget build(BuildContext context) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Informacoes Pessoais
        _buildSection(
          title: 'Informacoes Pessoais',
          icon: Icons.person,
          children: [
            _buildInfoRow('Nome Completo', driver.name),
            _buildInfoRow('Email', driver.email),
            _buildInfoRow('Telefone', driver.formattedPhone),
            if (driver.birthDate != null)
              _buildInfoRow(
                'Data de Nascimento',
                '${DateFormat('dd/MM/yyyy').format(driver.birthDate!)} (${driver.age} anos)',
              ),
            if (driver.address != null)
              _buildInfoRow('Endereco', driver.address!),
          ],
        ),

        const SizedBox(height: 24),

        // Licenca e Habilitacao
        _buildSection(
          title: 'Licenca e Habilitacao',
          icon: Icons.credit_card,
          children: [
            _buildInfoRow('Numero da CNH', driver.license.number),
            _buildInfoRow('Categoria', driver.license.category.displayName),
            _buildInfoRow(
              'Validade',
              DateFormat('dd/MM/yyyy').format(driver.license.expiryDate),
              trailing: driver.license.isExpired
                  ? _buildAlertBadge(
                      'Vencida', const Color(GfTokens.colorError))
                  : driver.license.isExpiringSoon
                      ? _buildAlertBadge(
                          'Vencendo', const Color(GfTokens.colorWarning))
                      : _buildAlertBadge(
                          'Valida', const Color(GfTokens.colorSuccess)),
            ),
            _buildInfoRow(
              'Data de Emissao',
              DateFormat('dd/MM/yyyy').format(driver.license.issueDate),
            ),
          ],
        ),

        const SizedBox(height: 24),

        // Certificacoes
        if (driver.certifications.isNotEmpty) ...[
          _buildSection(
            title: 'Certificacoes',
            icon: Icons.verified,
            children: driver.certifications.map((cert) {
              return _buildCertificationItem(cert);
            }).toList(),
          ),
          const SizedBox(height: 24),
        ],

        // Estatisticas
        _buildSection(
          title: 'Estatisticas',
          icon: Icons.analytics,
          children: [
            _buildInfoRow(
              'Total de Viagens',
              driver.stats.totalTrips.toString(),
            ),
            _buildInfoRow(
              'Distancia Total',
              '${(driver.stats.totalDistance / 1000).toStringAsFixed(1)} km',
            ),
            _buildInfoRow(
              'Tempo Total',
              _formatDuration(driver.stats.totalDrivingTime),
            ),
            _buildInfoRow(
              'Avaliacao Media',
              '${driver.stats.averageRating.toStringAsFixed(1)} ',
            ),
            _buildInfoRow(
              'Total de Avaliacoes',
              driver.stats.totalRatings.toString(),
            ),
          ],
        ),

        const SizedBox(height: 24),

        // Veiculo Atual
        if (driver.currentVehicleId != null) ...[
          _buildSection(
            title: 'Veiculo Atual',
            icon: Icons.directions_car,
            children: [
              _buildInfoRow('ID do Veiculo', driver.currentVehicleId!),
              // Aqui poderia ser expandido para mostrar mais detalhes do veiculo
            ],
          ),
          const SizedBox(height: 24),
        ],

        // Preferencias
        _buildSection(
          title: 'Preferencias',
          icon: Icons.settings,
          children: [
            _buildInfoRow(
              'Disponivel para Viagens',
              driver.isAvailable ? 'Sim' : 'Nao',
              trailing: driver.isAvailable
                  ? _buildAlertBadge(
                      'Disponivel', const Color(GfTokens.colorSuccess))
                  : _buildAlertBadge(
                      'Indisponivel', const Color(GfTokens.colorError)),
            ),
            _buildInfoRow(
              'Status Online',
              driver.isOnline ? 'Online' : 'Offline',
              trailing: driver.isOnline
                  ? _buildAlertBadge(
                      'Online', const Color(GfTokens.colorSuccess))
                  : _buildAlertBadge(
                      'Offline', const Color(GfTokens.colorOnSurfaceVariant)),
            ),
            if (driver.preferences.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: driver.preferences.entries.map((entry) {
                  return Chip(
                    label: Text('${entry.key}: ${entry.value}'),
                    backgroundColor: const Color(GfTokens.colorSurfaceVariant),
                    labelStyle: GfTextStyles.labelSmall.copyWith(
                      color: const Color(GfTokens.colorOnSurfaceVariant),
                    ),
                  );
                }).toList(),
              ),
            ],
          ],
        ),

        const SizedBox(height: 24),

        // Informacoes do Sistema
        _buildSection(
          title: 'Informacoes do Sistema',
          icon: Icons.info_outline,
          children: [
            _buildInfoRow('ID', driver.id),
            _buildInfoRow(
              'Criado em',
              DateFormat('dd/MM/yyyy HH:mm').format(driver.createdAt),
            ),
            _buildInfoRow(
              'Ultima Atualizacao',
              DateFormat('dd/MM/yyyy HH:mm').format(driver.updatedAt),
            ),
          ],
        ),
      ],
    );

  Widget _buildSection({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) => GxCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                icon,
                size: 20,
                color: const Color(GfTokens.colorPrimary),
              ),
              const SizedBox(width: 8),
              Text(
                title,
                style: GfTextStyles.labelLarge.copyWith(
                  color: const Color(GfTokens.colorPrimary),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    ).animate().fadeIn().slideX(begin: -0.1);

  Widget _buildInfoRow(
    String label,
    String value, {
    Widget? trailing,
  }) => Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: GfTextStyles.bodyMedium.copyWith(
                color: const Color(GfTokens.colorOnSurfaceVariant),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    value,
                    style: GfTextStyles.labelSmall.copyWith(
                      color: const Color(GfTokens.colorOnSurfaceVariant),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                if (trailing != null) ...[
                  const SizedBox(width: 8),
                  trailing,
                ],
              ],
            ),
          ),
        ],
      ),
    );

  Widget _buildCertificationItem(DriverCertification certification) => Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: GfTokens.colorSurfaceVariant.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: const Color(GfTokens.colorOutlineVariant),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  certification.name,
                  style: GfTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (certification.isExpired)
                _buildAlertBadge('Vencida', const Color(GfTokens.colorError))
              else if (certification.isExpiringSoon)
                _buildAlertBadge('Vencendo', const Color(GfTokens.colorWarning))
              else
                _buildAlertBadge('Valida', const Color(GfTokens.colorSuccess)),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Valida ate: ${DateFormat('dd/MM/yyyy').format(certification.expiryDate!)}',
            style: GfTextStyles.labelSmall.copyWith(
              color: const Color(GfTokens.colorOnSurfaceVariant),
            ),
          ),
        ],
      ),
    );

  Widget _buildAlertBadge(String text, Color color) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(GfTokens.radiusSm),
        border: Border.all(
          color: color.withValues(alpha: 0.3),
        ),
      ),
      child: Text(
        text,
        style: GfTextStyles.labelSmall.copyWith(
          color: color,
          fontWeight: FontWeight.w500,
        ),
      ),
    );

  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);

    if (hours > 0) {
      return '${hours}h ${minutes}min';
    } else {
      return '${minutes}min';
    }
  }
}
