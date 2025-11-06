/// Route constants for GolfFox application
///
/// Centralized route definitions for type-safe navigation
class AppRoutes {
  // Private constructor to prevent instantiation
  AppRoutes._();

  // Authentication routes
  static const String login = '/login';
  static const String signup = '/signup';
  static const String forgotPassword = '/forgot-password';
  static const String resetPassword = '/reset-password';

  // Role-based home routes
  static const String adminHome = '/admin';
  static const String operatorHome = '/operator';
  static const String carrierHome = '/carrier';
  static const String driverHome = '/driver';
  static const String passengerHome = '/passenger';

  // Operator routes
  static const String operatorTrips = '/operator/trips';
  static const String operatorDrivers = '/operator/drivers';
  static const String operatorVehicles = '/operator/vehicles';
  static const String operatorReports = '/operator/reports';

  // Carrier routes
  static const String carrierFleet = '/carrier/fleet';
  static const String carrierDrivers = '/carrier/drivers';
  static const String carrierTrips = '/carrier/trips';
  static const String carrierFinancials = '/carrier/financials';

  // Driver routes
  static const String driverTrips = '/driver/trips';
  static const String driverEarnings = '/driver/earnings';
  static const String driverVehicle = '/driver/vehicle';
  static const String driverDocuments = '/driver/documents';

  // Passenger routes
  static const String passengerBooking = '/passenger/booking';
  static const String passengerTrips = '/passenger/trips';
  static const String passengerPayment = '/passenger/payment';
  static const String passengerSupport = '/passenger/support';

  // Shared routes
  static const String profile = '/profile';
  static const String settings = '/settings';
  static const String notifications = '/notifications';
  static const String help = '/help';
  static const String about = '/about';

  // Trip-related routes
  static const String tripDetails = '/trip/:tripId';
  static const String tripTracking = '/trip/:tripId/tracking';
  static const String tripPayment = '/trip/:tripId/payment';
  static const String tripRating = '/trip/:tripId/rating';

  // Map routes
  static const String map = '/map';
  static const String mapSearch = '/map/search';
  static const String mapDirections = '/map/directions';

  // Development routes
  static const String devUiCatalog = '/dev/ui';
  static const String devApiTest = '/dev/api';
  static const String devLogs = '/dev/logs';

  // Error routes
  static const String notFound = '/404';
  static const String error = '/error';
  static const String maintenance = '/maintenance';

  /// Get route with parameters
  static String tripDetailsWithId(String tripId) => tripDetails.replaceAll(':tripId', tripId);

  static String tripTrackingWithId(String tripId) => tripTracking.replaceAll(':tripId', tripId);

  static String tripPaymentWithId(String tripId) => tripPayment.replaceAll(':tripId', tripId);

  static String tripRatingWithId(String tripId) => tripRating.replaceAll(':tripId', tripId);

  /// Get all routes as a list
  static List<String> get allRoutes => [
        // Auth
        signup,
        forgotPassword,
        resetPassword,

        // Home
        operatorHome,
        carrierHome,
        driverHome,
        passengerHome,

        // Operator
        operatorTrips,
        operatorDrivers,
        operatorVehicles,
        operatorReports,

        // Carrier
        carrierFleet,
        carrierDrivers,
        carrierTrips,
        carrierFinancials,

        // Driver
        driverTrips,
        driverEarnings,
        driverVehicle,
        driverDocuments,

        // Passenger
        passengerBooking,
        passengerTrips,
        passengerPayment,
        passengerSupport,

        // Shared
        profile,
        settings,
        notifications,
        help,
        about,

        // Trip
        tripDetails,
        tripTracking,
        tripPayment,
        tripRating,

        // Map
        map,
        mapSearch,
        mapDirections,

        // Dev
        devUiCatalog,
        devApiTest,
        devLogs,

        // Error
        notFound,
        error,
        maintenance,
      ];

  /// Get public routes (no authentication required)
  static List<String> get publicRoutes => [
        signup,
        forgotPassword,
        resetPassword,
        notFound,
        error,
        maintenance,
      ];

  /// Get operator routes
  static List<String> get operatorRoutes => [
        operatorHome,
        operatorTrips,
        operatorDrivers,
        operatorVehicles,
        operatorReports,
      ];

  /// Get carrier routes
  static List<String> get carrierRoutes => [
        carrierHome,
        carrierFleet,
        carrierDrivers,
        carrierTrips,
        carrierFinancials,
      ];

  /// Get driver routes
  static List<String> get driverRoutes => [
        driverHome,
        driverTrips,
        driverEarnings,
        driverVehicle,
        driverDocuments,
      ];

  /// Get passenger routes
  static List<String> get passengerRoutes => [
        passengerHome,
        passengerBooking,
        passengerTrips,
        passengerPayment,
        passengerSupport,
      ];

  /// Get shared routes (available to all authenticated users)
  static List<String> get sharedRoutes => [
        profile,
        settings,
        notifications,
        help,
        about,
        tripDetails,
        tripTracking,
        tripPayment,
        tripRating,
        map,
        mapSearch,
        mapDirections,
      ];

  /// Get all available routes
  static List<String> getAllRoutes() => [
      // Auth routes
      signup,
      forgotPassword,
      resetPassword,

      // Role-based home routes
      operatorHome,
      carrierHome,
      driverHome,
      passengerHome,

      // Operator routes
      operatorTrips,
      operatorDrivers,
      operatorVehicles,
      operatorReports,

      // Carrier routes
      carrierFleet,
      carrierDrivers,
      carrierTrips,
      carrierFinancials,

      // Driver routes
      driverTrips,
      driverEarnings,
      driverVehicle,
      driverDocuments,

      // Passenger routes
      passengerBooking,
      passengerTrips,
      passengerPayment,
      passengerSupport,

      // Shared routes
      profile,
      settings,
      notifications,
      help,
      about,

      // Trip routes
      tripDetails,
      tripTracking,
      tripPayment,
      tripRating,

      // Map routes
      map,
      mapSearch,
      mapDirections,

      // Development routes
      devUiCatalog,
      devApiTest,
      devLogs,

      // Error routes
      error,
      notFound,
      maintenance,
    ];

  /// Get public routes (no authentication required)
  static List<String> getPublicRoutes() => [
      signup,
      forgotPassword,
      resetPassword,
      error,
      notFound,
      maintenance,
    ];

  /// Get shared routes (accessible by all authenticated users)
  static List<String> getSharedRoutes() => [
      profile,
      settings,
      notifications,
      help,
      about,
      map,
      mapSearch,
      mapDirections,
      tripDetails,
      tripTracking,
      tripPayment,
      tripRating,
    ];

  /// Get role-specific routes for a given role
  static List<String> getRoleRoutes(String role) {
    switch (role.toLowerCase()) {
      case 'operator':
        return [
          operatorHome,
          operatorTrips,
          operatorDrivers,
          operatorVehicles,
          operatorReports,
        ];
      case 'carrier':
        return [
          carrierHome,
          carrierFleet,
          carrierDrivers,
          carrierTrips,
          carrierFinancials,
        ];
      case 'driver':
        return [
          driverHome,
          driverTrips,
          driverEarnings,
          driverVehicle,
          driverDocuments,
        ];
      case 'passenger':
        return [
          passengerHome,
          passengerBooking,
          passengerTrips,
          passengerPayment,
          passengerSupport,
        ];
      default:
        return [];
    }
  }
}
