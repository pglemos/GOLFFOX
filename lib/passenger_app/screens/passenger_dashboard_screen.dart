import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';

class PassengerDashboardScreen extends StatefulWidget {
  const PassengerDashboardScreen({super.key});

  @override
  State<PassengerDashboardScreen> createState() => _PassengerDashboardScreenState();
}

class _PassengerDashboardScreenState extends State<PassengerDashboardScreen> {
  Map<String, dynamic>? _currentTrip;
  Map<String, dynamic>? _busPosition;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadCurrentTrip();
    _subscribeToBusPosition();
  }

  Future<void> _loadCurrentTrip() async {
    try {
      // Buscar trip ativa onde o passageiro está
      final Map<String, dynamic>? employee =
          await SupabaseService.instance.client
          .from('gf_employee_company')
          .select('id')
          .eq('login_cpf', '') // Substituir por CPF do usuário logado
          .maybeSingle();

      if (employee == null) {
        setState(() => _loading = false);
        return;
      }

      final Map<String, dynamic>? response =
          await SupabaseService.instance.client
          .from('trip_passengers')
          .select('*, trips(*, routes(*), vehicles(*))')
          .eq('passenger_id', employee['id'] as String)
          .eq('status', 'pending')
          .maybeSingle();

      setState(() {
        _currentTrip = response;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  void _subscribeToBusPosition() {
    // Assinar updates de posição do ônibus via Supabase Realtime
    SupabaseService.instance.client
        .from('driver_positions')
        .stream(primaryKey: ['id'])
        .listen((data) {
      if (data.isNotEmpty && _currentTrip != null) {
        setState(() {
          _busPosition = Map<String, dynamic>.from(
            data.last as Map,
          );
        });
        
        // Verificar se ônibus está próximo (5 min)
        _checkArrivalTime();
      }
    });
  }

  void _checkArrivalTime() {
    // Calcular tempo estimado de chegada
    // Se < 5 minutos, mostrar notificação (push)
    if (_busPosition != null) {
      // Implementar cálculo de ETA
      // Por enquanto apenas exemplo
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Seu ônibus chegará em 5 minutos'),
          duration: Duration(seconds: 3),
        ),
      );
    }
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
        title: const Text('Meu Ônibus'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              SupabaseService.instance.auth.signOut();
              Navigator.of(context).pushReplacementNamed('/passenger/login');
            },
          ),
        ],
      ),
      body: _currentTrip != null
          ? _buildTripView()
          : _buildEmptyState(),
    );
  }

  Widget _buildTripView() {
    Map<String, dynamic> _asMap(dynamic value) {
      if (value is Map<String, dynamic>) return value;
      if (value is Map) return Map<String, dynamic>.from(value);
      return <String, dynamic>{};
    }

    final trip = _asMap(_currentTrip?['trips']);
    final route = _asMap(trip['routes']);
    final vehicle = _asMap(trip['vehicles']);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  route['name'] as String? ?? 'Rota',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Veículo: ${vehicle['plate'] as String? ?? "N/A"}',
                ),
                if (_busPosition != null)
                  Text(
                    'Posição: ${_busPosition!['latitude']}, ${_busPosition!['longitude']}',
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: () {
            // Mostrar mapa com posição do ônibus
          },
          icon: const Icon(Icons.map),
          label: const Text('Ver no Mapa'),
        ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: () {
            // Validar QR/NFC no embarque
          },
          icon: const Icon(Icons.qr_code_scanner),
          label: const Text('Validar Embarque'),
        ),
      ],
    );
  }

  Widget _buildEmptyState() => const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.directions_bus, size: 80, color: Colors.grey),
          SizedBox(height: 24),
          Text(
            'Nenhuma viagem ativa',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
}

