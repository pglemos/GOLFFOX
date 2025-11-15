import 'package:flutter/material.dart';

import 'bootstrap.dart';
import 'core/auth/auth_manager.dart';
import 'core/config/app_config.dart';
import 'core/error/error_handler.dart';
import 'core/logging/app_logger.dart';
import 'core/routing/app_router.dart';
import 'core/security/rate_limiter.dart';

void main() async {
  // Inicializar sistema de tratamento de erros
  ErrorHandler.initialize();
  
  // Inicializar rate limiter
  RateLimiter().initialize();
  
  // Validar configurações essenciais
  if (!AppConfig.validateConfig()) {
    AppLogger.critical('Configurações essenciais ausentes. Verifique as variáveis de ambiente.');
    throw Exception('Configurações essenciais ausentes. Verifique as variáveis de ambiente.');
  }
  
  AppLogger.info('GolfFox app starting...', tag: 'Main');
  
  await bootstrap(const MyApp());
}

/// Root app configured with GoRouter so `context.go(...)` works.
class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  void initState() {
    super.initState();
    // Ensure auth/listeners and router are ready once at startup.
    AuthManager.instance.initialize();
    AppRouter.instance.initialize();
  }

  @override
  Widget build(BuildContext context) => MaterialApp.router(
        title: 'GolfFox',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorSchemeSeed: Colors.orange,
          useMaterial3: true,
        ),
        routerConfig: AppRouter.instance.router,
      );
}
