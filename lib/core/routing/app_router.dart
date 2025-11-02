import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_manager.dart';
import '../services/logger_service.dart';
import '../../domain/user_role.dart';
import '../../models/user.dart' as app_user;
import '../../services/supabase_service.dart';

import '../../screens/operator/operator_dashboard.dart';
import '../../screens/carrier/carrier_dashboard.dart';
import '../../screens/driver/driver_dashboard.dart';
import '../../screens/passenger/passenger_dashboard.dart';
import '../../features/auth/login_screen.dart';
import '../../features/dashboard/dashboard_page.dart' as admin;
import '../config/supabase_config.dart';
import 'route_guards.dart';
import 'app_routes.dart';

/// Modern role-based routing system for GolfFox
///
/// Features:
/// - Role-based access control
/// - Route guards
/// - Deep linking support
/// - Navigation analytics
/// - Error handling
class AppRouter {
  static AppRouter? _instance;
  static AppRouter get instance => _instance ??= AppRouter._();
  AppRouter._();

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
    _router.replace(location, extra: extra);
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

  List<RouteBase> _buildRoutes() {
    return [
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
    ];
  }

  Widget _buildErrorPage(BuildContext context, GoRouterState state) {
    LoggerService.instance.error('Route error: ${state.error}');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Erro'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            const Text(
              'Pagina nao encontrada',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'A pagina "${state.uri.path}" nao existe.',
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => AppRouter.instance.goToRoleHome(),
              child: const Text('Voltar ao Inicio'),
            ),
          ],
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

  Widget _buildOperatorHome() {
    return _buildDashboardWithUser(
      (user) => OperatorDashboard(user: user),
      fallbackRole: UserRole.operator,
    );
  }

  Widget _buildCarrierHome() {
    return _buildDashboardWithUser((user) => CarrierDashboard(user: user));
  }

  Widget _buildDriverHome() {
    return _buildDashboardWithUser((user) => DriverDashboard(user: user));
  }

  Widget _buildPassengerHome() {
    return _buildDashboardWithUser((user) => PassengerDashboard(user: user));
  }

  Widget _buildDashboardWithUser(
    Widget Function(app_user.User) builder, {
    UserRole? fallbackRole,
  }) {
    return FutureBuilder<app_user.User?>(
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
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red),
                  SizedBox(height: 16),
                  Text(
                    'Erro ao carregar perfil',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '${snapshot.error}',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      // Forca rebuild do FutureBuilder
                      (context as Element).markNeedsBuild();
                    },
                    child: Text('Tentar novamente'),
                  ),
                ],
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
              companyId: null,
              carrierId: null,
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
                  Icon(Icons.person_off, size: 64, color: Colors.orange),
                  SizedBox(height: 16),
                  Text(
                    'Perfil nao encontrado',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Nao foi possivel encontrar o perfil do usuario.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      (context as Element).markNeedsBuild();
                    },
                    child: Text('Tentar novamente'),
                  ),
                ],
              ),
            ),
          );
        }
        return builder(user);
      },
    );
  }

  Widget _buildUiCatalog() {
    // TODO: Import and return actual UiCatalogPage
    return const Scaffold(
      body: Center(
        child: Text('UI Catalog - TODO'),
      ),
    );
  }

  Widget _buildSettings() {
    return const Scaffold(
      body: Center(
        child: Text('Settings - TODO'),
      ),
    );
  }

  Widget _buildProfile() {
    return const Scaffold(
      body: Center(
        child: Text('Profile - TODO'),
      ),
    );
  }

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
  bool _isSharedRoute(String location) {
    return location == '/profile' ||
        location == '/ui-catalog' ||
        location.startsWith('/shared');
  }
}

/// Route configuration
class RouteConfig {
  final List<UserRole> requiredRoles;
  final bool isPublic;

  const RouteConfig({
    required this.requiredRoles,
    this.isPublic = false,
  });
}
