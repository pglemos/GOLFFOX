import 'dart:async';
import 'package:flutter/material.dart';

import '../../core/location_service.dart';
import '../../services/supabase_service.dart';

class DriverRouteScreen extends StatefulWidget {

  const DriverRouteScreen({required this.trip, super.key});
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
      final Object? tripId = widget.trip['id'];

      if (driverId == null || location == null || tripId == null) return;

      await SupabaseService.instance.client.from('driver_positions').insert({
        'trip_id': tripId,
        'driver_id': driverId,
        'latitude': location.latitude,
        'longitude': location.longitude,
        'timestamp': DateTime.now().toIso8601String(),
        'speed': location.speed,
        'accuracy': location.accuracy,
      });
    } on Exception catch (e, stackTrace) {
      // Se offline, guardar para enviar depois (implementar queue local)
      debugPrint('Erro ao enviar posição: $e');
      debugPrintStack(stackTrace: stackTrace);
    }
  }

  Future<void> _loadPassengers() async {
    try {
      final Object? tripId = widget.trip['id'];
      if (tripId == null) return;

      final rows = await SupabaseService.instance.client
          .from('trip_passengers')
          .select()
          .eq('trip_id', tripId);

      if (!mounted) return;

      final count = rows.length;
      setState(() {
        _passengerCount = count;
      });
    } on Exception catch (e, stackTrace) {
      debugPrint('Erro ao carregar passageiros: $e');
      debugPrintStack(stackTrace: stackTrace);
    }
  }

  Future<void> _validatePassenger(String qrCode) async {
    // Validar QR/NFC e marcar embarque
    try {
      // Buscar funcionário pelo QR code (CPF)
      final employeeResult = await SupabaseService.instance.client
          .from('gf_employee_company')
          .select()
          .eq('cpf', qrCode)
          .eq('is_active', true)
          .maybeSingle();
      final employee = employeeResult;

      if (!mounted) return;

      if (employee == null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Passageiro não encontrado ou inativo'),
          ),
        );
        return;
      }

      final passengerId = employee['id'] as Object?;
      final Object? tripId = widget.trip['id'];
      if (passengerId == null || tripId == null) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Dados do passageiro inválidos')),
        );
        return;
      }

      // Marcar embarque
      await SupabaseService.instance.client.from('trip_passengers').insert({
        'trip_id': tripId,
        'passenger_id': passengerId,
        'status': 'pickedup',
      });

      await _loadPassengers();
    } on Exception catch (e) {
      if (!mounted) return;
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
                          'Rota: ${_resolveNestedValue(widget.trip, 'routes', 'name')}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Veículo: ${_resolveNestedValue(widget.trip, 'vehicles', 'plate')}',
                        ),
                        Text('Passageiros: $_passengerCount'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () {
                    // Abrir scanner QR/NFC
                    showDialog<void>(
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
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    Icon(Icons.location_on, color: Colors.white),
                    Text(
                      'Enviando posição',
                      style: TextStyle(color: Colors.white),
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

String _resolveNestedValue(
  Map<String, dynamic> source,
  String parentKey,
  String childKey,
) {
  final parent = source[parentKey];
  if (parent is Map<String, dynamic>) {
    final value = parent[childKey];
    if (value is String) {
      return value;
    }
  }
  return 'N/A';
}

