import 'package:flutter/material.dart';

import '../../models/user.dart' as app;
import '../../screens/operator/operator_dashboard.dart';
import '../../services/supabase_service.dart';

class OperatorHome extends StatelessWidget {
  const OperatorHome({super.key});

  @override
  Widget build(BuildContext context) => FutureBuilder<app.User?>(
      future: SupabaseService.instance.getCurrentUserProfile(),
      builder: (context, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Scaffold(
              body: Center(child: CircularProgressIndicator()));
        }
        if (snap.hasError) {
          return Scaffold(body: Center(child: Text('Erro: ${snap.error}')));
        }
        final user = snap.data;
        if (user == null) {
          return const Scaffold(body: Center(child: Text('Sem perfil.')));
        }
        return OperatorDashboard(user: user);
      },
    );
}
