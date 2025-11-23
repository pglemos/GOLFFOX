import 'package:flutter/foundation.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

class SentrySetup {
  static bool _initialized = false;

  static Future<void> initialize() async {
    if (_initialized) return;
    const dsn = String.fromEnvironment('SENTRY_DSN_MOBILE');
    if (dsn.isEmpty) {
      // Opt-out silently when DSN not configured
      return;
    }
    await SentryFlutter.init(
      (options) {
        options
          ..dsn = dsn
          ..tracesSampleRate = double.tryParse(const String.fromEnvironment(
                  'SENTRY_TRACES_RATE',
                  defaultValue: '0.1')) ??
              0.1
          ..reportPackages = true
          ..environment = kReleaseMode ? 'production' : 'development'
          ..sendDefaultPii = false;
      },
      appRunner: () {},
    );
    _initialized = true;
  }
}
