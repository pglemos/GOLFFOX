import 'package:flutter/material.dart';
import 'package:golffox/models/user.dart';
import 'package:golffox/screens/driver/driver_dashboard.dart';
import 'package:golffox/screens/passenger/passenger_dashboard.dart';
import 'package:golffox/screens/operator/operator_dashboard.dart';
import 'package:golffox/screens/carrier/carrier_dashboard.dart';
import 'package:golffox/core/theme/gf_tokens.dart';

/// Papeis suportados na plataforma.
enum UserRole { operator, carrier, driver, passenger, unknown }

/// Converte strings arbitrarias (inclui sinonimos pt-BR) para [UserRole].
extension UserRoleParsing on String {
  UserRole toUserRole() {
    final raw = trim().toLowerCase();
    // normalizacao de sinonimos
    final normalized = switch (raw) {
      'motorista' => 'driver',
      'passageiro' => 'passenger',
      'operador' => 'operator',
      'transportadora' => 'carrier',
      _ => raw,
    };
    return switch (normalized) {
      'operator' => UserRole.operator,
      'carrier' => UserRole.carrier,
      'driver' => UserRole.driver,
      'passenger' => UserRole.passenger,
      _ => UserRole.unknown,
    };
  }
}

/// Builder de dashboard por papel.
typedef _DashboardBuilder = Widget Function(User user);

class HomeScreen extends StatefulWidget {
  final User user;
  const HomeScreen({super.key, required this.user});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late UserRole _role;

  // Mapa centralizado com todos os destinos por papel.
  late final Map<UserRole, _DashboardBuilder> _builders = {
    UserRole.operator: (u) => OperatorDashboard(user: u),
    UserRole.carrier: (u) => CarrierDashboard(user: u),
    UserRole.driver: (u) => DriverDashboard(user: u),
    UserRole.passenger: (u) => PassengerDashboard(user: u),
  };

  @override
  void initState() {
    super.initState();
    _role = (widget.user.role).toString().toUserRole();
  }

  @override
  void didUpdateWidget(covariant HomeScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Se o usuario trocou (ou mudou de papel), atualiza e anima a transicao
    if (oldWidget.user.role != widget.user.role) {
      setState(() {
        _role = (widget.user.role).toString().toUserRole();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final child = _builders[_role]?.call(widget.user) ??
        _UnknownRoleScreen(user: widget.user);

    // Transicao suave estilo Apple/Nubank (fade + leve slide up)
    return AnimatedSwitcher(
      duration: GfTokens.durationSlow,
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      transitionBuilder: (widget, anim) {
        final fade = CurvedAnimation(parent: anim, curve: Curves.easeOutCubic);
        final slide =
            Tween<Offset>(begin: const Offset(0, .02), end: Offset.zero)
                .animate(fade);
        return FadeTransition(
          opacity: fade,
          child: SlideTransition(position: slide, child: widget),
        );
      },
      child: KeyedSubtree(
        // garante chave estavel por papel para animar corretamente
        key: ValueKey<UserRole>(_role),
        child: child,
      ),
    );
  }
}

class _UnknownRoleScreen extends StatelessWidget {
  final User user;
  const _UnknownRoleScreen({required this.user});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final role = (user.role).toString();

    return Scaffold(
      appBar: AppBar(
        title: const Text('GolfFox'),
        backgroundColor: theme.colorScheme.surface,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 520),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline,
                    size: 80, color: theme.colorScheme.error),
                const SizedBox(height: 16),
                Text('Papel nao reconhecido',
                    style: theme.textTheme.headlineSmall,
                    textAlign: TextAlign.center),
                const SizedBox(height: 8),
                Text(
                  'O papel do usuario "$role" nao e valido ou nao esta habilitado.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.7),
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                _RoleInfoBadge(
                  name: user.name,
                  email: user.email,
                  role: role.isEmpty ? '-' : role,
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    OutlinedButton.icon(
                      onPressed: () => Navigator.maybePop(context),
                      icon: const Icon(Icons.arrow_back),
                      label: const Text('Voltar'),
                    ),
                    const SizedBox(width: 12),
                    FilledButton.icon(
                      onPressed: () {
                        // Aqui voce pode abrir um dialogo/acao para trocar de conta
                        // ou direcionar para uma tela de suporte.
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text(
                              'Entre em contato com o suporte para habilitar seu papel.',
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.support_agent),
                      label: const Text('Suporte'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RoleInfoBadge extends StatelessWidget {
  const _RoleInfoBadge(
      {required this.name, required this.email, required this.role});
  final String name;
  final String email;
  final String role;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(top: 4),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: DefaultTextStyle(
        style: theme.textTheme.bodySmall!.copyWith(
          color: theme.colorScheme.onSurface.withOpacity(0.7),
        ),
        child: Column(
          children: [
            Row(
              children: [
                const Icon(Icons.person, size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text('Usuario: $name')),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.mail, size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text('E-mail: $email')),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.badge, size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text('Papel informado: $role')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
