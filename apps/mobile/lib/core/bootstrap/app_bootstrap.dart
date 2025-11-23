import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/env_config.dart';
import '../error/sentry_setup.dart';
import '../services/error_service.dart';
import '../services/logger_service.dart';

/// Comprehensive bootstrap system for GolfFox
///
/// Handles:
/// - Environment validation
/// - Supabase initialization
/// - Error handling setup
/// - Logging configuration
/// - System preferences
class AppBootstrap {
  static bool _isInitialized = false;
  static final _logger = LoggerService.instance;

  /// Initialize the entire application
  static Future<void> initialize() async {
    debugPrint('=== APPBOOTSTRAP INITIALIZE STARTED ===');
    if (_isInitialized) {
      debugPrint('=== APPBOOTSTRAP ALREADY INITIALIZED ===');
      _logger.warning('AppBootstrap already initialized');
      return;
    }

    try {
      debugPrint('=== STARTING GOLFFOX BOOTSTRAP ===');
      _logger.info('Starting GolfFox bootstrap...');

      // Step 1: Validate environment
      debugPrint('=== STEP 1: VALIDATING ENVIRONMENT ===');
      _logger.info('Step 1: Validating environment...');
      await _validateEnvironment();
      debugPrint('=== STEP 1: ENVIRONMENT VALIDATED ===');
      _logger.info('Step 1: Environment validated');

      // Step 2: Initialize core services
      debugPrint('=== STEP 2: INITIALIZING CORE SERVICES ===');
      _logger.info('Step 2: Initializing core services...');
      await _initializeCoreServices();
      debugPrint('=== STEP 2: CORE SERVICES INITIALIZED ===');
      _logger.info('Step 2: Core services initialized');

      // Step 3: Initialize Supabase
      debugPrint('=== STEP 3: INITIALIZING SUPABASE ===');
      _logger.info('Step 3: Initializing Supabase...');
      await _initializeSupabase();
      debugPrint('=== STEP 3: SUPABASE INITIALIZED ===');
      _logger.info('Step 3: Supabase initialized');

      // Step 4: Setup error handling
      debugPrint('=== STEP 4: SETTING UP ERROR HANDLING ===');
      _logger.info('Step 4: Setting up error handling...');
      await _setupErrorHandling();
      debugPrint('=== STEP 4: ERROR HANDLING CONFIGURED ===');
      _logger.info('Step 4: Error handling configured');

      // Step 5: Configure system preferences
      debugPrint('=== STEP 5: CONFIGURING SYSTEM PREFERENCES ===');
      _logger.info('Step 5: Configuring system preferences...');
      await _configureSystemPreferences();
      debugPrint('=== STEP 5: SYSTEM PREFERENCES CONFIGURED ===');
      _logger.info('Step 5: System preferences configured');

      _isInitialized = true;
      debugPrint('=== GOLFFOX BOOTSTRAP COMPLETED SUCCESSFULLY ===');
      _logger.success('GolfFox bootstrap completed successfully');
    } catch (error, stackTrace) {
      debugPrint('=== BOOTSTRAP FAILED: $error ===');
      debugPrint('=== BOOTSTRAP STACK TRACE: $stackTrace ===');
      _logger.error('Bootstrap failed', error, stackTrace);
      await ErrorService.instance.reportError(
        error,
        stackTrace,
        context: 'AppBootstrap.initialize',
      );
      rethrow;
    }
  }

  /// Validate environment configuration
  static Future<void> _validateEnvironment() async {
    _logger.info('Validating environment configuration...');

    if (!EnvConfig.isValidConfig) {
      final missingVars = <String>[];

      if (EnvConfig.supabaseUrl.isEmpty) {
        missingVars.add('SUPABASE_URL');
      }

      if (EnvConfig.supabaseAnonKey.isEmpty) {
        missingVars.add('SUPABASE_ANON_KEY');
      }

      throw BootstrapException(
        'Missing required environment variables: ${missingVars.join(', ')}\n'
        'Please run with: flutter run --dart-define=SUPABASE_URL=your_url '
        '--dart-define=SUPABASE_ANON_KEY=your_key',
      );
    }

    _logger
      ..info('Environment validation passed')
      ..debug('Environment info: ${EnvConfig.debugInfo}');
  }

  /// Initialize core services
  static Future<void> _initializeCoreServices() async {
    _logger.info('Initializing core services...');

    // Initialize logger service
    await LoggerService.instance.initialize();

    // Initialize error service
    await ErrorService.instance.initialize();

    // Initialize Sentry (if DSN provided)
    await SentrySetup.initialize();

    _logger.info('Core services initialized');
  }

  /// Initialize Supabase with proper error handling
  static Future<void> _initializeSupabase() async {
    _logger.info('Initializing Supabase...');

    try {
      await Supabase.initialize(
        url: EnvConfig.supabaseUrl,
        anonKey: EnvConfig.supabaseAnonKey,
        debug: EnvConfig.enableDebugLogs,
        realtimeClientOptions: const RealtimeClientOptions(
          logLevel: RealtimeLogLevel.info,
        ),
      );

      // Test connection (lightweight query)
      final _ = await Supabase.instance.client
          .from('users')
          .select('id')
          .limit(1)
          .timeout(const Duration(seconds: 10));

      _logger
        ..info('Supabase initialized successfully')
        ..debug('Connection test query OK');
    } on TimeoutException {
      throw const BootstrapException(
        'Supabase connection timeout. '
        'Please check your network connection and Supabase URL.',
      );
    } catch (error) {
      throw BootstrapException(
        'Failed to initialize Supabase: $error',
      );
    }
  }

  /// Setup global error handling
  static Future<void> _setupErrorHandling() async {
    _logger.info('Setting up error handling...');

    // Handle Flutter framework errors
    FlutterError.onError = (details) {
      _logger.error(
        'Flutter Error',
        details.exception,
        details.stack,
      );

      ErrorService.instance.reportError(
        details.exception,
        details.stack,
        context: 'FlutterError',
        additionalData: {
          'library': details.library,
          'context': details.context?.toString(),
        },
      );
    };

    // Handle platform errors
    PlatformDispatcher.instance.onError = (error, stack) {
      _logger.error('Platform Error', error, stack);

      ErrorService.instance.reportError(
        error,
        stack,
        context: 'PlatformError',
      );

      return true;
    };

    _logger.info('Error handling configured');
  }

  /// Configure system preferences
  static Future<void> _configureSystemPreferences() async {
    _logger.info('Configuring system preferences...');

    // Set preferred orientations for mobile
    if (!kIsWeb) {
      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
        DeviceOrientation.portraitDown,
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
    }

    // Configure system UI overlay style
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        systemNavigationBarColor: Colors.white,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
    );

    _logger.info('System preferences configured');
  }

  /// Get initialization status
  static bool get isInitialized => _isInitialized;

  /// Reset initialization (for testing)
  @visibleForTesting
  static void reset() {
    _isInitialized = false;
  }
}

/// Custom exception for bootstrap errors
class BootstrapException implements Exception {
  const BootstrapException(this.message);
  final String message;

  @override
  String toString() => 'BootstrapException: $message';
}
