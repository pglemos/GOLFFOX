import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.light);

class AppShell extends ConsumerWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isWide = MediaQuery.of(context).size.width >= 1100;

    const items = [
      _NavItem('/dashboard', Icons.dashboard_rounded, 'Dashboard'),
      _NavItem('/mapa', Icons.map_rounded, 'Mapa'),
      _NavItem('/rotas', Icons.alt_route_rounded, 'Rotas'),
      _NavItem('/veiculos', Icons.directions_bus_filled_rounded, 'Veiculos'),
      _NavItem('/motoristas', Icons.account_circle_rounded, 'Motoristas'),
      _NavItem('/empresas', Icons.business_rounded, 'Empresas'),
      _NavItem('/permissoes', Icons.lock_person_rounded, 'Permissoes'),
      _NavItem('/socorro', Icons.emergency_share_rounded, 'Socorro'),
      _NavItem('/alertas', Icons.notifications_active_rounded, 'Alertas'),
      _NavItem('/relatorios', Icons.bar_chart_rounded, 'Relatorios'),
      _NavItem('/historico', Icons.history_rounded, 'Historico'),
      _NavItem('/custos', Icons.paid_rounded, 'Custos'),
    ];

    // lateral clara estilo Apple/Tesla
    final side = Container(
      width: isWide ? 232 : 80,
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(
          right: BorderSide(color: Color(0xFFE5E7EB)),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          children: [
            // mini brand
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
              child: Row(
                children: [
                  Container(
                    height: 34,
                    width: 34,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE55600),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Icon(Icons.pets_rounded, color: Colors.white, size: 19),
                  ),
                  if (isWide) ...[
                    const SizedBox(width: 10),
                    const Text(
                      'GOLF FOX',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                        letterSpacing: .4,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 6),
            Expanded(
              child: ListView.builder(
                itemCount: items.length,
                itemBuilder: (ctx, i) {
                  final item = items[i];
                  final selected = GoRouterState.of(ctx).uri.toString().startsWith(item.route);
                  return _SideItem(
                    item: item,
                    selected: selected,
                    wide: isWide,
                    onTap: () => ctx.go(item.route),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );

    final content = Column(
      children: [
        const _TopBar(), // <-- aqui esta o nome GOLF FOX + botao Preferencias
        const Divider(height: 1, color: Color(0xFFE5E7EB)),
        Expanded(child: child),
      ],
    );

    if (isWide) {
      return Scaffold(
        backgroundColor: const Color(0xFFF4F5F7),
        body: Row(
          children: [
            side,
            Expanded(child: content),
          ],
        ),
      );
    }

    // mobile
    return Scaffold(
      backgroundColor: const Color(0xFFF4F5F7),
      appBar: const PreferredSize(
        preferredSize: Size.fromHeight(60),
        child: _TopBar(),
      ),
      body: child,
      bottomNavigationBar: NavigationBar(
        backgroundColor: Colors.white,
        selectedIndex: 0,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_rounded), label: 'Dash'),
          NavigationDestination(icon: Icon(Icons.map_rounded), label: 'Mapa'),
          NavigationDestination(icon: Icon(Icons.directions_bus_filled_rounded), label: 'Veic.'),
          NavigationDestination(icon: Icon(Icons.bar_chart_rounded), label: 'Relat.'),
        ],
      ),
    );
  }
}

class _TopBar extends ConsumerWidget {
  const _TopBar();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    return Container(
      height: 60,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      decoration: const BoxDecoration(
        color: Colors.white,
      ),
      child: Row(
        children: [
          const Text(
            'GOLF FOX',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              letterSpacing: .4,
            ),
          ),
          const SizedBox(width: 16),
          // as 4 "abas" de cima
          const Wrap(
            spacing: 8,
            children: const [
              _TopPill(label: 'Painel de Gestao'),
              _TopPill(label: 'App do Motorista'),
              _TopPill(label: 'App do Passageiro'),
              _TopPill(label: 'Portal do Operador'),
            ],
          ),
          const Spacer(),
          TextButton.icon(
            onPressed: () {},
            style: TextButton.styleFrom(
              backgroundColor: const Color(0xFFF3F4F6),
              foregroundColor: const Color(0xFF111827),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            ),
            icon: const Icon(Icons.tune_rounded, size: 17),
            label: const Text('Preferencias'),
          ),
          const SizedBox(width: 12),
          IconButton(
            tooltip: 'Modo escuro',
            onPressed: () {
              ref.read(themeModeProvider.notifier).state =
                  themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
            },
            icon: Icon(
              themeMode == ThemeMode.light ? Icons.dark_mode_outlined : Icons.light_mode_outlined,
              color: const Color(0xFF6B7280),
              size: 20,
            ),
          ),
        ],
      ),
    );
  }
}

class _TopPill extends StatelessWidget {
  final String label;
  const _TopPill({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF4B5563))),
    );
  }
}

class _SideItem extends StatelessWidget {
  final _NavItem item;
  final bool selected;
  final bool wide;
  final VoidCallback onTap;
  const _SideItem({
    required this.item,
    required this.selected,
    required this.wide,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      dense: true,
      leading: Icon(
        item.icon,
        color: selected ? const Color(0xFFE55600) : const Color(0xFF6B7280),
      ),
      title: wide
          ? Text(
              item.label,
              style: TextStyle(
                fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                color: selected ? const Color(0xFF111827) : const Color(0xFF6B7280),
              ),
            )
          : null,
      selected: selected,
      selectedTileColor: const Color(0xFFF3F4F6),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      contentPadding: EdgeInsets.symmetric(horizontal: wide ? 16 : 8),
    );
  }
}

class _NavItem {
  final String route;
  final IconData icon;
  final String label;
  const _NavItem(this.route, this.icon, this.label);
}



