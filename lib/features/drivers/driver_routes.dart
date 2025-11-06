import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/routing/app_router.dart';
import 'drivers_page.dart';
import 'create_driver_page.dart';
import 'driver_details_page.dart';

class DriverRoutes {
  static const String drivers = '/drivers';
  static const String createDriver = '/drivers/create';
  static const String editDriver = '/drivers/edit';
  static const String driverDetails = '/drivers/details';

  static List<RouteBase> routes = [
    GoRoute(
      path: drivers,
      name: 'drivers',
      builder: (context, state) => const DriversPage(),
      routes: [
        GoRoute(
          path: '/create',
          name: 'create-driver',
          builder: (context, state) => const CreateDriverPage(),
        ),
        GoRoute(
          path: '/edit/:id',
          name: 'edit-driver',
          builder: (context, state) {
            final driverId = state.pathParameters['id']!;
            // Editing by ID not supported directly in CreateDriverPage constructor.
            // Navigate to page without passing the ID; implement loading by ID as needed.
            return const CreateDriverPage();
          },
        ),
        GoRoute(
          path: '/details/:id',
          name: 'driver-details',
          builder: (context, state) {
            final driverId = state.pathParameters['id']!;
            return DriverDetailsPage(driverId: driverId);
          },
        ),
      ],
    ),
  ];

  // Metodos de navegacao
  static void goToDrivers(BuildContext context) {
    AppRouter.instance.go(drivers);
  }

  static void goToCreateDriver(BuildContext context) {
    AppRouter.instance.go('$drivers/create');
  }

  static void goToEditDriver(BuildContext context, String driverId) {
    AppRouter.instance.go('$drivers/edit/$driverId');
  }

  static void goToDriverDetails(BuildContext context, String driverId) {
    AppRouter.instance.go('$drivers/details/$driverId');
  }

  // Metodos de navegacao com push (para manter historico)
  static void pushCreateDriver(BuildContext context) {
    AppRouter.instance.push('$drivers/create');
  }

  static void pushEditDriver(BuildContext context, String driverId) {
    AppRouter.instance.push('$drivers/edit/$driverId');
  }

  static void pushDriverDetails(BuildContext context, String driverId) {
    AppRouter.instance.push('$drivers/details/$driverId');
  }
}
