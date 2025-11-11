import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../domain/user_role.dart';
import '../../features/auth/login_screen.dart';
import '../../features/drivers/driver_routes.dart';
import '../../features/mapa/mapa_page.dart';
import '../../models/user.dart' as app_user;
import '../../screens/carrier/carrier_dashboard.dart';
import '../../screens/dashboard/dashboard_page.dart' as admin;
import '../../screens/driver/driver_dashboard.dart';
import '../../screens/operator/operator_dashboard.dart';
import '../../screens/passenger/passenger_dashboard.dart';
import '../../services/supabase_service.dart';
import '../../ui/widgets/common/gf_error_widget.dart';
import '../auth/auth_manager.dart';
import '../services/error_service.dart';
import '../services/logger_service.dart';
import 'app_routes.dart';
import 'route_guards.dart';
import 'router_observer.dart';

/// Modern role-based routing system for GolfFox
///
/// Features:
/// - Role-based access control
/// - Route guards
/// - Deep linking support
/// - Navigation analytics
/// - Error handling
class AppRouter {
  AppRouter._();
  static AppRouter? _instance;
  // ignore: prefer_constructors_over_static_methods
  static AppRouter get instance => _instance ??= AppRouter._();

  final _logger = LoggerService.instance;
  late final GoRouter _router;

  // Lazy getters para evitar inicialização prematura
  AuthManager get _authManager => AuthManager.instance;
  SupabaseService get _supabaseService => SupabaseService.instance;

  /// Initialize the router
  void initialize() {
    _logger.info('Initializing AppRouter...');

    _router = GoRouter(
      initialLocation: '/',
      refreshListenable: _authManager,
      redirect: _handleRedirect,
      routes: _buildRoutes(),
      errorBuilder: _buildErrorPage,
      observers: [GxRouterObserver()],
    );

    _logger.info('AppRouter initialized');
  }

  /// Get the router instance
  GoRouter get router => _router;

  /// Navigate to a route
  void go(String location, {Object? extra}) {
    _logger.debug('Navigating to: $location');
    _router.go(location, extra: extra);
  }

  /// Push a route
  void push(String location, {Object? extra}) {
    _logger.debug('Pushing route: $location');
    _router.push(location, extra: extra);
  }

  /// Pop the current route
  void pop([Object? result]) {
    _logger.debug('Popping route');
    _router.pop(result);
  }

  /// Replace the current route
  void replace(String location, {Object? extra}) {
    _logger.debug('Replacing route with: $location');
    _router.replace<void>(location, extra: extra);
  }

  /// Navigate to home based on user role
  void goToRoleHome() {
    final role = _authManager.currentUserRole;
    final homeRoute = _getHomeRouteForRole(role);
    go(homeRoute);
  }

  /// Check if user can access route
  Future<bool> canAccessRoute(String route, BuildContext context, GoRouterState state) async {
    final redirectRoute = await RouteGuard.checkAccess(
      location: route,
      authManager: _authManager,
    );

    // If no redirect is needed, access is granted
    return redirectRoute == null;
  }

  // Private methods

  String? _handleRedirect(BuildContext context, GoRouterState state) {
    final location = state.uri.toString();
    final currentRole = _authManager.currentUserRole;
    final currentEmail = _supabaseService.currentUser?.email?.toLowerCase();

    _logger.debug('Route redirect check: $location (role: $currentRole)');

    // Allow public routes without authentication/role checks
    final isPublic = location.startsWith(AppRoutes.error) ||
        location.startsWith(AppRoutes.notFound) ||
        location.startsWith(AppRoutes.maintenance) ||
        location.startsWith(AppRoutes.login) ||
        location.startsWith(AppRoutes.signup) ||
        location.startsWith(AppRoutes.forgotPassword) ||
        location.startsWith(AppRoutes.resetPassword);
    if (isPublic) {
      return null;
    }

    // Superuser override: e-mail de admin sempre pode acessar '/admin'
    if (currentEmail == 'golffox@admin.com') {
      // Admin por e-mail: força rotas de admin e impede acesso a '/operator'
      if (location.startsWith('/operator')) {
        _logger.info('Redirecting admin email from /operator to /admin');
        return AppRoutes.adminHome;
      }
      // Se está indo para /admin, não bloqueie
      if (location.startsWith('/admin')) {
        return null;
      }
    }

    // Basic role access check
    if (currentRole != null && !_hasBasicRoleAccess(location, currentRole)) {
      _logger.warning('Access denied to route: $location (role: $currentRole)');
      final fallback = _getHomeRouteForRole(currentRole);
      _logger.info('Redirecting to fallback: $fallback');
      return fallback == location ? null : fallback;
    }

    return null;
  }

  List<RouteBase> _buildRoutes() => [
      // Root route - redirects based on authentication status
      GoRoute(
        path: '/',
        name: 'root',
        redirect: (context, state) {
          final isAuthenticated = _authManager.isAuthenticated;
          final currentRole = _authManager.currentUserRole;

          _logger.debug(
              'Root redirect - authenticated: $isAuthenticated, role: $currentRole');

          if (!isAuthenticated) {
            _logger.info('User not authenticated, redirecting to login');
            return AppRoutes.login;
          }

          if (currentRole != null) {
            final homeRoute = _getHomeRouteForRole(currentRole);
            _logger.info(
                'User authenticated with role $currentRole, redirecting to: $homeRoute');
            return homeRoute;
          }

          _logger.warning(
              'User authenticated but no role found, redirecting to login');
          return AppRoutes.login;
        },
      ),

      // Login route
      GoRoute(
        path: AppRoutes.login,
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),

      // Operator routes
      GoRoute(
        path: AppRoutes.adminHome,
        name: 'admin-home',
        builder: (context, state) => const admin.DashboardPage(),
      ),

      // Operator route (separado do admin)
      GoRoute(
        path: AppRoutes.operatorHome,
        name: 'operator-home',
        builder: (context, state) => _buildOperatorHome(),
      ),

      // (Sem aliases: admin usa apenas '/admin')

      // Carrier routes
      GoRoute(
        path: AppRoutes.carrierHome,
        name: 'carrier-home',
        builder: (context, state) => _buildCarrierHome(),
      ),

      // Driver routes
      GoRoute(
        path: AppRoutes.driverHome,
        name: 'driver-home',
        builder: (context, state) => _buildDriverHome(),
      ),

      // Passenger routes
      GoRoute(
        path: AppRoutes.passengerHome,
        name: 'passenger-home',
        builder: (context, state) => _buildPassengerHome(),
      ),

      // Development routes
      GoRoute(
        path: AppRoutes.devUiCatalog,
        name: 'dev-ui-catalog',
        builder: (context, state) => _buildUiCatalog(),
      ),

      // Map routes
      GoRoute(
        path: AppRoutes.map,
        name: 'map',
        builder: (context, state) => const MapaPage(),
      ),

      // Settings routes
      GoRoute(
        path: AppRoutes.settings,
        name: 'settings',
        builder: (context, state) => _buildSettings(),
      ),

      // Profile routes
      GoRoute(
        path: AppRoutes.profile,
        name: 'profile',
        builder: (context, state) => _buildProfile(),
      ),

      // Error routes (explicit)
      GoRoute(
        path: AppRoutes.error,
        name: 'error',
        builder: _buildErrorPage,
      ),
      GoRoute(
        path: AppRoutes.notFound,
        name: 'not-found',
        builder: _buildErrorPage,
      ),

      // Feature routes
      ...DriverRoutes.routes,
    ];

  Widget _buildErrorPage(BuildContext context, GoRouterState state) {
    LoggerService.instance.error('Route error: ${state.error}');

    final Object routeError = state.error ?? GxError(
      code: 'routing.not_found',
      message: 'Route not found: ${state.uri.path}',
      userMessage: 'Página não encontrada: ${state.uri.path}',
    );

    return Scaffold(
      appBar: AppBar(title: const Text('Erro')),
      body: Center(
        child: GfErrorWidget.fromError(
          error: routeError,
          onRetry: AppRouter.instance.goToRoleHome,
        ),
      ),
    );
  }

  String _getHomeRouteForRole(UserRole? role) {
    final homeRoute = switch (role) {
      UserRole.admin => AppRoutes.adminHome,
      UserRole.operator => AppRoutes.operatorHome,
      UserRole.carrier => AppRoutes.carrierHome,
      UserRole.driver => AppRoutes.driverHome,
      UserRole.passenger => AppRoutes.passengerHome,
      null => AppRoutes.passengerHome,
    };

    _logger.info(' Getting home route for role: $role -> $homeRoute');
    return homeRoute;
  }

  // Page builders

  Widget _buildOperatorHome() => _buildDashboardWithUser(
      (user) => OperatorDashboard(user: user),
      fallbackRole: UserRole.operator,
    );

  Widget _buildCarrierHome() => _buildDashboardWithUser((user) => CarrierDashboard(user: user));

  Widget _buildDriverHome() => _buildDashboardWithUser((user) => DriverDashboard(user: user));

  Widget _buildPassengerHome() => _buildDashboardWithUser((user) => PassengerDashboard(user: user));

  Widget _buildDashboardWithUser(
    Widget Function(app_user.User) builder, {
    UserRole? fallbackRole,
  }) => FutureBuilder<app_user.User?>(
      future: _supabaseService.getCurrentUserProfile(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Carregando perfil do usuario...'),
                ],
              ),
            ),
          );
        }
        if (snapshot.hasError) {
          return Scaffold(
            body: Center(
              child: GfErrorWidget.fromError(
                error: snapshot.error!,
                onRetry: () {
                  // Força rebuild do FutureBuilder
                  (context as Element).markNeedsBuild();
                },
              ),
            ),
          );
        }
        final user = snapshot.data;
        if (user == null) {
          // Fallback: cria um perfil mínimo se a rota exigir acesso (ex.: operador)
          if (fallbackRole == UserRole.operator) {
            final now = DateTime.now();
            final fallback = app_user.User(
              id: 'admin-fallback',
              email: 'golffox@admin.com',
              name: 'GolfFox Admin',
              role: 'operator',
              createdAt: now,
              updatedAt: now,
            );
            return builder(fallback);
          }
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.person_off, size: 64, color: Colors.orange),
                  const SizedBox(height: 16),
                  const Text(
          'Perfil não encontrado',
                    style:
                        TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
          'Não foi possível encontrar o perfil do usuário.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      (context as Element).markNeedsBuild();
                    },
                    child: const Text('Tentar novamente'),
                  ),
                ],
              ),
            ),
          );
        }
        return builder(user);
      },
    );

  Widget _buildUiCatalog() => const Scaffold(
        body: Center(
          child: Text('UI Catalog - TODO'),
        ),
      ); // TODO(golffox): Import and return actual UiCatalogPage

  Widget _buildSettings() => const Scaffold(
      body: Center(
        child: Text('Settings - TODO'),
      ),
    );

  Widget _buildProfile() => const Scaffold(
      body: Center(
        child: Text('Profile - TODO'),
      ),
    );

  /// Basic role access check for redirect logic
  bool _hasBasicRoleAccess(String location, UserRole? role) {
    if (role == null) return false;

    // Check role-specific routes
    switch (role) {
      case UserRole.admin:
        return location.startsWith('/admin') || _isSharedRoute(location);
      case UserRole.operator:
        return location.startsWith('/operator') || _isSharedRoute(location);
      case UserRole.carrier:
        return location.startsWith('/carrier') || _isSharedRoute(location);
      case UserRole.driver:
        return location.startsWith('/driver') || _isSharedRoute(location);
      case UserRole.passenger:
        return location.startsWith('/passenger') || _isSharedRoute(location);
    }
  }

  /// Check if route is shared across roles
  bool _isSharedRoute(String location) =>
      location.startsWith(AppRoutes.profile) ||
      location.startsWith(AppRoutes.settings) ||
      location.startsWith(AppRoutes.notifications) ||
      location.startsWith(AppRoutes.help) ||
      location.startsWith(AppRoutes.about) ||
      // Trip routes can include parameters; match the prefix
      location.startsWith('/trip/') ||
      // Map routes
      location.startsWith(AppRoutes.map) ||
      location.startsWith(AppRoutes.mapSearch) ||
      location.startsWith(AppRoutes.mapDirections);
}

/// Route configuration
class RouteConfig {

  const RouteConfig({
    required this.requiredRoles,
    this.isPublic = false,
  });
  final List<UserRole> requiredRoles;
  final bool isPublic;
}
