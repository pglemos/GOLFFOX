import 'dart:async';
import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';
import '../../core/location_service.dart';

class DriverRouteScreen extends StatefulWidget {

  const DriverRouteScreen({super.key, required this.trip});
  final Map<String, dynamic> trip;

  @override
  State<DriverRouteScreen> createState() => _DriverRouteScreenState();
}

class _DriverRouteScreenState extends State<DriverRouteScreen> {
  Timer? _positionTimer;
  bool _isSendingPosition = false;
  int _passengerCount = 0;

  @override
  void initState() {
    super.initState();
    _startSendingPosition();
    _loadPassengers();
  }

  Future<void> _startSendingPosition() async {
    // Enviar posição a cada 5 segundos
    _positionTimer = Timer.periodic(const Duration(seconds: 5), (_) async {
      if (!_isSendingPosition) {
        _isSendingPosition = true;
        await _sendCurrentPosition();
        _isSendingPosition = false;
      }
    });
  }

  Future<void> _sendCurrentPosition() async {
    try {
      final location = await LocationService.instance.getCurrentLocation();
      final driverId = SupabaseService.instance.currentUserId;

      if (driverId == null || location == null) return;

      await SupabaseService.instance.client.from('driver_positions').insert({
        'trip_id': widget.trip['id'],
        'driver_id': driverId,
        'latitude': location.latitude,
        'longitude': location.longitude,
        'timestamp': DateTime.now().toIso8601String(),
        'speed': location.speed ?? 0,
        'accuracy': location.accuracy ?? 0,
      });
    } catch (e) {
      // Se offline, guardar para enviar depois (implementar queue local)
      print('Erro ao enviar posição: $e');
    }
  }

  Future<void> _loadPassengers() async {
    try {
      final response = await SupabaseService.instance.client
          .from('trip_passengers')
          .select()
          .eq('trip_id', widget.trip['id']);

      setState(() {
        _passengerCount = response.data?.length ?? 0;
      });
    } catch (e) {
      print('Erro ao carregar passageiros: $e');
    }
  }

  Future<void> _validatePassenger(String qrCode) async {
    // Validar QR/NFC e marcar embarque
    try {
      // Buscar funcionário pelo QR code (CPF)
      final employee = await SupabaseService.instance.client
          .from('gf_employee_company')
          .select()
          .eq('cpf', qrCode)
          .eq('is_active', true)
          .maybeSingle();

      if (employee.data == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Passageiro não encontrado ou inativo')),
        );
        return;
      }

      // Marcar embarque
      await SupabaseService.instance.client.from('trip_passengers').insert({
        'trip_id': widget.trip['id'],
        'passenger_id': employee.data!['id'],
        'status': 'pickedup',
      });

      _loadPassengers();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro: ${e.toString()}')),
      );
    }
  }

  @override
  void dispose() {
    _positionTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Viagem em Andamento')),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Rota: ${widget.trip['routes']?['name'] ?? "N/A"}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text('Veículo: ${widget.trip['vehicles']?['plate'] ?? "N/A"}'),
                        Text('Passageiros: $_passengerCount'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () {
                    // Abrir scanner QR/NFC
                    showDialog(
                      context: context,
                      builder: (_) => AlertDialog(
                        title: const Text('Validar Passageiro'),
                        content: TextField(
                          decoration: const InputDecoration(labelText: 'CPF ou QR Code'),
                          onSubmitted: _validatePassenger,
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Cancelar'),
                          ),
                        ],
                      ),
                    );
                  },
                  icon: const Icon(Icons.qr_code_scanner),
                  label: const Text('Validar Embarque'),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.blue,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    const Icon(Icons.location_on, color: Colors.white),
                    Text(
                      'Enviando posição',
                      style: const TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
}

