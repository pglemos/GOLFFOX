// ========================================
// GolfFox SideNav v11.0 - Clear Theme
// Menu lateral com 12 itens obrigatorios
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/motion/gf_motion.dart';
import '../../core/routing/app_router.dart';
import '../../core/theme/gf_tokens.dart';

// Provider para controlar o item ativo
final activeSideNavItemProvider = StateProvider<String>((ref) => 'dashboard');

class GfSideNav extends ConsumerWidget {
  const GfSideNav({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeItem = ref.watch(activeSideNavItemProvider);

    return Container(
      width: GfTokens.sideNavWidth,
      decoration: const BoxDecoration(
        color: Color(GfTokens.shellSideNavBg),
        border: Border(
          right: BorderSide(
            color: Color(GfTokens.stroke),
          ),
        ),
      ),
      child: Column(
        children: [
          // ========================================
          // HEADER DO MENU
          // ========================================
          Container(
            height: GfTokens.topBarHeight,
            padding: const EdgeInsets.symmetric(horizontal: GfTokens.space6),
            decoration: const BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: Color(GfTokens.stroke),
                ),
              ),
            ),
            child: const Row(
              children: [
                Icon(
                  Icons.menu,
                  color: Color(GfTokens.textMuted),
                  size: 20,
                ),
                SizedBox(width: GfTokens.space3),
                Text(
                  'Menu Principal',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Color(GfTokens.textMuted),
                  ),
                ),
              ],
            ),
          ),

          // ========================================
          // ITENS DO MENU (12 obrigatorios)
          // ========================================
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: GfTokens.space4),
              children: _buildMenuItems(context, ref, activeItem),
            ),
          ),

          // ========================================
          // FOOTER DO MENU
          // ========================================
          Container(
            padding: const EdgeInsets.all(GfTokens.space4),
            decoration: const BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: Color(GfTokens.stroke),
                ),
              ),
            ),
            child: const Row(
              children: [
                Icon(
                  Icons.help_outline,
                  color: Color(GfTokens.textMuted),
                  size: 16,
                ),
                SizedBox(width: GfTokens.space2),
                Text(
                  'Ajuda & Suporte',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(GfTokens.textMuted),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildMenuItems(
      BuildContext context, WidgetRef ref, String activeItem) {
    final menuItems = [
      const _MenuItem(
        id: 'dashboard',
        title: 'Dashboard',
        icon: Icons.dashboard_outlined,
        activeIcon: Icons.dashboard,
        route: '/',
      ),
      const _MenuItem(
        id: 'mapa',
        title: 'Mapa',
        icon: Icons.map_outlined,
        activeIcon: Icons.map,
        route: '/mapa',
      ),
      const _MenuItem(
        id: 'rotas',
        title: 'Rotas',
        icon: Icons.route_outlined,
        activeIcon: Icons.route,
        route: '/rotas',
      ),
      const _MenuItem(
        id: 'veiculos',
        title: 'Veiculos',
        icon: Icons.directions_car_outlined,
        activeIcon: Icons.directions_car,
        route: '/veiculos',
      ),
      const _MenuItem(
        id: 'motoristas',
        title: 'Motoristas',
        icon: Icons.person_outline,
        activeIcon: Icons.person,
        route: '/motoristas',
      ),
      const _MenuItem(
        id: 'empresas',
        title: 'Empresas',
        icon: Icons.business_outlined,
        activeIcon: Icons.business,
        route: '/empresas',
      ),
      const _MenuItem(
        id: 'permissoes',
        title: 'Permissoes',
        icon: Icons.security_outlined,
        activeIcon: Icons.security,
        route: '/permissoes',
      ),
      const _MenuItem(
        id: 'socorro',
        title: 'Socorro',
        icon: Icons.emergency_outlined,
        activeIcon: Icons.emergency,
        route: '/socorro',
      ),
      const _MenuItem(
        id: 'alertas',
        title: 'Alertas',
        icon: Icons.warning_outlined,
        activeIcon: Icons.warning,
        route: '/alertas',
      ),
      const _MenuItem(
        id: 'relatorios',
        title: 'Relatorios',
        icon: Icons.analytics_outlined,
        activeIcon: Icons.analytics,
        route: '/relatorios',
      ),
      const _MenuItem(
        id: 'historico',
        title: 'Historico',
        icon: Icons.history_outlined,
        activeIcon: Icons.history,
        route: '/historico',
      ),
      const _MenuItem(
        id: 'custos',
        title: 'Custos',
        icon: Icons.attach_money_outlined,
        activeIcon: Icons.attach_money,
        route: '/custos',
      ),
    ];

    return menuItems.map((item) {
      final isActive = activeItem == item.id;

      return Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: GfTokens.space3,
          vertical: 2,
        ),
        child: _buildMenuItem(context, ref, item, isActive),
      );
    }).toList();
  }

  Widget _buildMenuItem(
      BuildContext context, WidgetRef ref, _MenuItem item, bool isActive) => _SideNavItemTile(
      item: item,
      isActive: isActive,
      onTap: () {
        ref.read(activeSideNavItemProvider.notifier).state = item.id;
        AppRouter.instance.go(item.route);
      },
    );
}

class _SideNavItemTile extends StatefulWidget {
  const _SideNavItemTile(
      {required this.item, required this.isActive, required this.onTap});
  final _MenuItem item;
  final bool isActive;
  final VoidCallback onTap;

  @override
  State<_SideNavItemTile> createState() => _SideNavItemTileState();
}

class _SideNavItemTileState extends State<_SideNavItemTile> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    final isActive = widget.isActive;
    final bgColor = isActive
        ? const Color(GfTokens.shellSideNavItemActive)
        : (_hover
            ? const Color(GfTokens.shellSideNavItemHover)
            : Colors.transparent);

    return MouseRegion(
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: widget.onTap,
          borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
          child: AnimatedContainer(
            duration: GfMotion.short,
            curve: GfMotion.easeOut,
            padding: const EdgeInsets.symmetric(
              horizontal: GfTokens.space4,
              vertical: GfTokens.space3,
            ),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(GfTokens.radiusSmall),
              border: isActive
                  ? const Border(
                      right: BorderSide(
                        color: Color(GfTokens.brand),
                        width: 3,
                      ),
                    )
                  : null,
            ),
            child: Row(
              children: [
                Icon(
                  isActive ? widget.item.activeIcon : widget.item.icon,
                  color: isActive
                      ? const Color(GfTokens.brand)
                      : const Color(GfTokens.textMuted),
                  size: 20,
                ),
                const SizedBox(width: GfTokens.space3),
                Expanded(
                  child: Text(
                    widget.item.title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                      color: isActive
                          ? const Color(GfTokens.textTitle)
                          : const Color(GfTokens.textBody),
                    ),
                  ),
                ),
                if (widget.item.id == 'alertas')
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(GfTokens.danger),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      '3',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: Color(GfTokens.surface),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ========================================
// CLASSE AUXILIAR PARA ITENS DO MENU
// ========================================
class _MenuItem {

  const _MenuItem({
    required this.id,
    required this.title,
    required this.icon,
    required this.activeIcon,
    required this.route,
  });
  final String id;
  final String title;
  final IconData icon;
  final IconData activeIcon;
  final String route;
}
