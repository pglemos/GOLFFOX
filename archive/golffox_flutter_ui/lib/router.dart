
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'widgets/app_shell.dart';
import 'screens/dashboard.dart';
import 'screens/rotas.dart';
import 'screens/veiculos.dart';
import 'screens/motoristas.dart';
import 'screens/empresas.dart';
import 'screens/permissoes.dart';
import 'screens/socorro.dart';
import 'screens/alertas.dart';
import 'screens/relatorios.dart';
import 'screens/configuracoes.dart';

GoRouter buildRouter(WidgetRef ref) {
  return GoRouter(
    initialLocation: '/dashboard',
    routes: [
      ShellRoute(
        builder: (context, state, child) => AppShell(child: child),
        routes: [
          GoRoute(path: '/dashboard', builder: (ctx, st) => const DashboardScreen(),),
          GoRoute(path: '/rotas', builder: (ctx, st) => const RotasScreen(),),
          GoRoute(path: '/veiculos', builder: (ctx, st) => const VeiculosScreen(),),
          GoRoute(path: '/motoristas', builder: (ctx, st) => const MotoristasScreen(),),
          GoRoute(path: '/empresas', builder: (ctx, st) => const EmpresasScreen(),),
          GoRoute(path: '/permissoes', builder: (ctx, st) => const PermissoesScreen(),),
          GoRoute(path: '/socorro', builder: (ctx, st) => const SocorroScreen(),),
          GoRoute(path: '/alertas', builder: (ctx, st) => const AlertasScreen(),),
          GoRoute(path: '/relatorios', builder: (ctx, st) => const RelatoriosScreen(),),
          GoRoute(path: '/configuracoes', builder: (ctx, st) => const ConfiguracoesScreen(),),
        ],
      ),
    ],
  );
}

