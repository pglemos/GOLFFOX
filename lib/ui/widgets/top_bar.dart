// ========================================
// GolfFox TopBar v11.0 - Clear Theme
// TopBar com logo, pills de navegacao e preferencias
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../core/motion/gf_motion.dart';
import '../../core/theme/gf_tokens.dart';
import '../../services/supabase_service.dart';

class GfTopBar extends ConsumerWidget implements PreferredSizeWidget {
  const GfTopBar({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(GfTokens.topBarHeight);

  @override
  Widget build(BuildContext context, WidgetRef ref) => Container(
      height: GfTokens.topBarHeight,
      decoration: const BoxDecoration(
        color: Color(GfTokens.shellTopBarBg),
        border: Border(
          bottom: BorderSide(
            color: Color(GfTokens.stroke),
          ),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: GfTokens.space6),
        child: Row(
          children: [
            // ========================================
            // LOGO E BADGE
            // ========================================
            _buildLogo(),

            const SizedBox(width: GfTokens.space8),

            // ========================================
            // PILLS DE NAVEGACAO (centro)
            // ========================================
            Expanded(
              child: Center(
                child: _buildNavigationPills(),
              ),
            ),

            const SizedBox(width: GfTokens.space8),

            // ========================================
            // PREFERENCIAS E AVATAR (direita)
            // ========================================
            _buildUserActions(),
          ],
        ),
      ),
    );

  Widget _buildLogo() => Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Logo Golf Fox
        SizedBox(
          width: 32,
          height: 32,
          child: SvgPicture.asset('assets/icons/golf_fox_logo.svg'),
        ),

        const SizedBox(width: GfTokens.space3),

        // Nome e badge
        Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'GOLF FOX',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(GfTokens.textTitle),
                letterSpacing: 0.5,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: GfTokens.space2,
                vertical: 2,
              ),
              decoration: BoxDecoration(
                color: const Color(GfTokens.accent),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text(
                'GolfFox Premium',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  color: Color(GfTokens.surface),
                ),
              ),
            ),
          ],
        ),
      ],
    );

  Widget _buildNavigationPills() {
    final pills = [
      'Painel de Gestão',
      'App do Motorista',
      'App do Passageiro',
      'Portal do Operador',
    ];

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: pills.asMap().entries.map((entry) {
        final index = entry.key;
        final title = entry.value;
        final isActive = index == 0; // Primeiro pill ativo por padrao

        return Padding(
          padding: EdgeInsets.only(
            right: index < pills.length - 1 ? GfTokens.space2 : 0,
          ),
          child: _buildPill(title, isActive),
        );
      }).toList(),
    );
  }

  Widget _buildPill(String title, bool isActive) => GfHoverScale(
      child: AnimatedContainer(
        duration: GfMotion.short,
        curve: GfMotion.easeOut,
        padding: const EdgeInsets.symmetric(
          horizontal: GfTokens.space4,
          vertical: GfTokens.space2,
        ),
        decoration: BoxDecoration(
          color: isActive
              ? const Color(GfTokens.pillActive)
              : const Color(GfTokens.pillInactive),
          borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
          border:
              isActive ? null : Border.all(color: const Color(GfTokens.stroke)),
        ),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: isActive
                ? const Color(GfTokens.pillActiveText)
                : const Color(GfTokens.pillInactiveText),
          ),
        ),
      ),
    );

  Widget _buildUserActions() => Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Botao Preferencias
        IconButton(
          onPressed: () {
            // TODO(golffox-team): Abrir modal de preferencias
          },
          icon: const Icon(
            Icons.settings_outlined,
            color: Color(GfTokens.textBody),
            size: 20,
          ),
          tooltip: 'Preferências',
        ),

        const SizedBox(width: GfTokens.space2),

        // Avatar + menu de conta
        PopupMenuButton<String>(
          tooltip: 'Conta',
          offset: const Offset(0, 36),
          onSelected: (value) async {
            if (value == 'logout') {
              await SupabaseService.instance.signOut();
              // Context sera passado via callback ou navegacao sera feita externamente
            }
          },
          itemBuilder: (context) => const [
            PopupMenuItem(
              value: 'profile',
              child: Text('Perfil'),
            ),
            PopupMenuItem(
              value: 'logout',
              child: Row(
                children: [
                  Icon(Icons.logout, size: 16),
                  SizedBox(width: 8),
                  Text('Sair'),
                ],
              ),
            ),
          ],
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: const Color(GfTokens.surfaceMuted),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: const Color(GfTokens.stroke),
              ),
            ),
            child: const Icon(
              Icons.person_outline,
              color: Color(GfTokens.textMuted),
              size: 18,
            ),
          ),
        ),
      ],
    );
}
