import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';
import 'driver_checklist_screen.dart';
import 'driver_route_screen.dart';

class DriverDashboardScreen extends StatefulWidget {
  const DriverDashboardScreen({super.key});

  @override
  State<DriverDashboardScreen> createState() => _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends State<DriverDashboardScreen> {
  Map<String, dynamic>? _currentTrip;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadCurrentTrip();
  }

  Future<void> _loadCurrentTrip() async {
    try {
      final driverId = SupabaseService.instance.currentUserId;
      if (driverId == null) {
        if (!mounted) return;
        setState(() => _loading = false);
        return;
      }

      final trip = await SupabaseService.instance.client
          .from('trips')
          .select('*, routes(*), vehicles(*)')
          .eq('driver_id', driverId)
          .eq('status', 'inProgress')
          .maybeSingle();

      if (!mounted) return;
      setState(() {
        _currentTrip = trip;
        _loading = false;
      });
    } on Exception {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _startTrip() async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) => const DriverChecklistScreen(),
      ),
    );
    if (!context.mounted) return;
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard Motorista'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await SupabaseService.instance.auth.signOut();
              if (!context.mounted) return;
              await Navigator.of(context)
                  .pushReplacementNamed<void, void>('/driver/login');
            },
          ),
        ],
      ),
      body: _currentTrip != null
          ? DriverRouteScreen(trip: _currentTrip!)
          : _buildEmptyState(),
    );
  }

  Widget _buildEmptyState() => Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.directions_bus, size: 80, color: Colors.grey),
          const SizedBox(height: 24),
          const Text(
            'Nenhuma viagem ativa',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _startTrip,
            icon: const Icon(Icons.play_arrow),
            label: const Text('Iniciar Viagem'),
          ),
        ],
      ),
    );
}

