import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../domain/user_role.dart';
import '../auth/auth_manager.dart';
import '../services/logger_service.dart';
import 'app_router.dart';
import 'app_routes.dart';

/// Route guard for role-based access control
class RouteGuard {
  static final _logger = LoggerService.instance;

  /// Checks if user has access to a specific route
  static Future<String?> checkAccess({
    required String location,
    required AuthManager authManager,
  }) async {
    _logger.info('RouteGuard: Checking access for route: $location');

    // Get current auth state and profile
    final isAuthenticated = authManager.isAuthenticated;
    final profile = authManager.currentUserProfile;

    // Public routes that don't require authentication
    if (_isPublicRoute(location)) {
      _logger.debug('RouteGuard: Public route access granted');
      return null;
    }

    // Check authentication
    if (!isAuthenticated || profile == null) {
      _logger
          .warning('RouteGuard: Unauthenticated access attempt to: $location');
      return '/';
    }

    // Convert string role to UserRole enum
    final userRole = authManager.currentUserRole;
    if (userRole == null) {
      return '/'; // Invalid role, redirect to home
    }

    // Check role-based access
    final hasAccess = _hasRoleAccess(location, userRole);
    if (!hasAccess) {
      _logger.warning(
        'RouteGuard: Unauthorized access attempt by $userRole to: $location',
      );
      return _getDefaultRouteForRole(userRole);
    }

    _logger.debug('RouteGuard: Access granted for $userRole to: $location');
    return null;
  }

  /// Checks if a route is public (doesn't require authentication)
  static bool _isPublicRoute(String location) {
    final publicRoutes = [
      AppRoutes.error,
      AppRoutes.notFound,
    ];

    return publicRoutes.any((route) => location.startsWith(route));
  }

  /// Checks if a user role has access to a specific route
  static bool _hasRoleAccess(String location, UserRole role) {
    // Role-specific route access
    switch (role) {
      case UserRole.admin:
        return _isAdminRoute(location) || _isSharedRoute(location);

      case UserRole.operator:
        return _isOperatorRoute(location) || _isSharedRoute(location);

      case UserRole.carrier:
        return _isCarrierRoute(location) || _isSharedRoute(location);

      case UserRole.driver:
        return _isDriverRoute(location) || _isSharedRoute(location);

      case UserRole.passenger:
        return _isPassengerRoute(location) || _isSharedRoute(location);
    }
  }

  static bool _isAdminRoute(String location) {
    final adminRoutes = [AppRoutes.adminHome];
    return adminRoutes.any((route) => location.startsWith(route));
  }

  /// Checks if route is accessible by operators
  static bool _isOperatorRoute(String location) {
    final operatorRoutes = [
      AppRoutes.operatorHome,
      AppRoutes.operatorTrips,
      AppRoutes.operatorDrivers,
      AppRoutes.operatorReports,
    ];

    return operatorRoutes.any((route) => location.startsWith(route));
  }

  /// Checks if route is accessible by carriers
  static bool _isCarrierRoute(String location) {
    final carrierRoutes = [
      AppRoutes.carrierHome,
      AppRoutes.carrierFleet,
      AppRoutes.carrierDrivers,
      AppRoutes.carrierTrips,
      AppRoutes.carrierFinancials,
    ];

    return carrierRoutes.any((route) => location.startsWith(route));
  }

  /// Checks if route is accessible by drivers
  static bool _isDriverRoute(String location) {
    final driverRoutes = [
      AppRoutes.driverHome,
      AppRoutes.driverTrips,
      AppRoutes.driverEarnings,
      AppRoutes.driverVehicle,
      AppRoutes.driverDocuments,
    ];

    return driverRoutes.any((route) => location.startsWith(route));
  }

  /// Checks if route is accessible by passengers
  static bool _isPassengerRoute(String location) {
    final passengerRoutes = [
      AppRoutes.passengerHome,
      AppRoutes.passengerBooking,
      AppRoutes.passengerTrips,
      AppRoutes.passengerPayment,
      AppRoutes.passengerSupport,
    ];

    return passengerRoutes.any((route) => location.startsWith(route));
  }

  /// Checks if route is shared across roles
  static bool _isSharedRoute(String location) {
    final sharedRoutes = [
      AppRoutes.profile,
      AppRoutes.settings,
      AppRoutes.notifications,
      AppRoutes.help,
      AppRoutes.about,
      AppRoutes.map,
      AppRoutes.tripDetails,
    ];

    return sharedRoutes.any(
        (route) => location.startsWith(route.split('/').take(2).join('/')));
  }

  /// Gets the default route for a specific role
  static String _getDefaultRouteForRole(UserRole role) {
    switch (role) {
      case UserRole.admin:
        return AppRoutes.adminHome;
      case UserRole.operator:
        return AppRoutes.operatorHome;
      case UserRole.carrier:
        return AppRoutes.carrierHome;
      case UserRole.driver:
        return AppRoutes.driverHome;
      case UserRole.passenger:
        return AppRoutes.passengerHome;
    }
  }
}

/// Navigation helper for role-based routing
class RoleBasedNavigation {
  static final _logger = LoggerService.instance;

  /// Navigates to the appropriate home page based on user role
  static void navigateToRoleHome(BuildContext context, UserRole role) {
    final route = RouteGuard._getDefaultRouteForRole(role);
    _logger.info('RoleBasedNavigation: Navigating to $route for role $role');
    AppRouter.instance.go(route);
  }

  /// Checks if current route is accessible and redirects if necessary
  static Future<void> validateCurrentRoute(
    BuildContext context,
    AuthManager authManager,
  ) async {
    // Obtém a localização atual via RouteInformationProvider
    final currentLocation = AppRouter
        .instance.router.routeInformationProvider.value.uri
        .toString();
    final redirectRoute = await RouteGuard.checkAccess(
      location: currentLocation,
      authManager: authManager,
    );

    if (!context.mounted) return;
    if (redirectRoute != null && redirectRoute != currentLocation) {
      _logger.info(
        'RoleBasedNavigation: Redirecting from $currentLocation to $redirectRoute',
      );
      AppRouter.instance.go(redirectRoute);
    }
  }

  /// Gets available routes for a specific role
  static List<String> getAvailableRoutesForRole(UserRole role) {
    switch (role) {
      case UserRole.admin:
        return [
          AppRoutes.adminHome,
          // Adicione aqui subrotas de admin quando existirem
        ];
      case UserRole.operator:
        return [
          AppRoutes.operatorHome,
          AppRoutes.operatorTrips,
          AppRoutes.operatorDrivers,
          AppRoutes.operatorReports,
        ];

      case UserRole.carrier:
        return [
          AppRoutes.carrierHome,
          AppRoutes.carrierFleet,
          AppRoutes.carrierDrivers,
          AppRoutes.carrierTrips,
          AppRoutes.carrierFinancials,
        ];

      case UserRole.driver:
        return [
          AppRoutes.driverHome,
          AppRoutes.driverTrips,
          AppRoutes.driverEarnings,
          AppRoutes.driverVehicle,
          AppRoutes.driverDocuments,
        ];

      case UserRole.passenger:
        return [
          AppRoutes.passengerHome,
          AppRoutes.passengerBooking,
          AppRoutes.passengerTrips,
          AppRoutes.passengerPayment,
          AppRoutes.passengerSupport,
        ];
    }
  }
}

/// Route transition animations based on navigation type
class RouteTransitions {
  /// Slide transition for role-based navigation
  static Page<T> slideTransition<T extends Object?>(
    BuildContext context,
    GoRouterState state,
    Widget child,
  ) =>
      CustomTransitionPage<T>(
        key: state.pageKey,
        child: child,
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          const begin = Offset(1, 0);
          const end = Offset.zero;
          const curve = Curves.easeInOutCubic;

          final tween = Tween<Offset>(begin: begin, end: end).chain(
            CurveTween(curve: curve),
          );

          return SlideTransition(
            position: animation.drive(tween),
            child: child,
          );
        },
      );

  /// Fade transition for authentication flows
  static Page<T> fadeTransition<T extends Object?>(
    BuildContext context,
    GoRouterState state,
    Widget child,
  ) =>
      CustomTransitionPage<T>(
        key: state.pageKey,
        child: child,
        transitionsBuilder: (context, animation, secondaryAnimation, child) =>
            FadeTransition(
          opacity: animation,
          child: child,
        ),
      );

  /// Scale transition for modal-like pages
  static Page<T> scaleTransition<T extends Object?>(
    BuildContext context,
    GoRouterState state,
    Widget child,
  ) =>
      CustomTransitionPage<T>(
        key: state.pageKey,
        child: child,
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          const curve = Curves.easeInOutBack;
          final tween = Tween<double>(begin: 0.8, end: 1).chain(
            CurveTween(curve: curve),
          );

        return ScaleTransition(
          scale: animation.drive(tween),
          child: FadeTransition(
            opacity: animation,
            child: child,
          ),
        );
      },
    );
}
