import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/supa/supa_client.dart';

Future<void> bootstrap(Widget app) async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await SupaClient.initialize();
    if (kDebugMode) {
      debugPrint('[bootstrap] Supabase initialized: ${SupaClient.status}');
    }
  } on Exception catch (e) {
    if (kDebugMode) {
      debugPrint('[bootstrap] Supabase não configurado ou falhou: $e');
      debugPrint('[bootstrap] Continuando sem backend (modo offline/dev).');
    }
  }

  FlutterError.onError = (details) {
    if (kDebugMode) {
      FlutterError.presentError(details);
    }
  };

  runApp(ProviderScope(child: app));
}
