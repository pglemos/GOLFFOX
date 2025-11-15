import 'package:flutter/foundation.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

class SentrySetup {
  static bool _initialized = false;

  static Future<void> initialize() async {
    if (_initialized) return;
    final dsn = const String.fromEnvironment('SENTRY_DSN_MOBILE', defaultValue: '');
    if (dsn.isEmpty) {
      // Opt-out silently when DSN not configured
      return;
    }
    await SentryFlutter.init(
      (options) {
        options.dsn = dsn;
        options.tracesSampleRate = double.tryParse(const String.fromEnvironment('SENTRY_TRACES_RATE', defaultValue: '0.1')) ?? 0.1;
        options.reportPackages = true;
        options.enableNativeFramesTracking = true;
        options.environment = kReleaseMode ? 'production' : 'development';
        options.sendDefaultPii = false;
      },
      appRunner: () {},
    );
    _initialized = true;
  }
}

