
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'router.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const ProviderScope(child: GolfFoxApp()));
}

class GolfFoxApp extends ConsumerWidget {
  const GolfFoxApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = AppTheme.buildTheme(ref);
    final router = buildRouter(ref);
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'GolfFox',
      theme: theme.light,
      darkTheme: theme.dark,
      themeMode: ref.watch(themeModeProvider),
      routerConfig: router,
    );
  }
}

