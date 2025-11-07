import 'package:flutter/material.dart';
import '../../services/supabase_service.dart';
import 'driver_route_screen.dart';

class DriverChecklistScreen extends StatefulWidget {
  const DriverChecklistScreen({super.key});

  @override
  State<DriverChecklistScreen> createState() => _DriverChecklistScreenState();
}

class _DriverChecklistScreenState extends State<DriverChecklistScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _lightsWorking = false;
  bool _brakesWorking = false;
  bool _emergencyKit = false;
  String _fuelLevel = '';
  String _tirePressure = '';
  String _vehicleCondition = '';
  bool _loading = false;

  Future<void> _submitChecklist() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    setState(() => _loading = true);

    try {
      // Criar checklist no Supabase
      final driverId = SupabaseService.instance.currentUserId;
      if (driverId == null) throw Exception('Usuário não autenticado');

      // Buscar trip ativa
      final trip = await SupabaseService.instance.client
          .from('trips')
          .select('id')
          .eq('driver_id', driverId)
          .eq('status', 'inProgress')
          .maybeSingle();

      if (trip == null) {
        throw Exception('Nenhuma viagem ativa encontrada');
      }

      await SupabaseService.instance.client.from('checklists').insert({
        'trip_id': trip['id'],
        'type': 'pre_trip',
        'completed_by': driverId,
        'vehicle_condition': _vehicleCondition,
        'fuel_level': _fuelLevel,
        'tire_pressure': _tirePressure,
        'lights_working': _lightsWorking,
        'brakes_working': _brakesWorking,
        'emergency_kit': _emergencyKit,
        'completed_at': DateTime.now().toIso8601String(),
      });

      if (mounted) {
        Navigator.of(context).pushReplacement<void, void>(
          MaterialPageRoute<void>(
            builder: (_) => DriverRouteScreen(trip: trip),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Checklist do Veículo')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            CheckboxListTile(
              title: const Text('Faróis funcionando'),
              value: _lightsWorking,
              onChanged: (value) => setState(() => _lightsWorking = value ?? false),
            ),
            CheckboxListTile(
              title: const Text('Freios funcionando'),
              value: _brakesWorking,
              onChanged: (value) => setState(() => _brakesWorking = value ?? false),
            ),
            CheckboxListTile(
              title: const Text('Kit de emergência presente'),
              value: _emergencyKit,
              onChanged: (value) => setState(() => _emergencyKit = value ?? false),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: 'Nível de Combustível'),
              items: ['Cheio', '3/4', '1/2', '1/4', 'Reserva'].map((level) {
                return DropdownMenuItem(value: level, child: Text(level));
              }).toList(),
              onChanged: (value) => setState(() => _fuelLevel = value ?? ''),
              validator: (value) => value == null ? 'Selecione o nível' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              decoration: const InputDecoration(labelText: 'Pressão dos Pneus'),
              onSaved: (value) => _tirePressure = value ?? '',
              validator: (value) => value == null || value.isEmpty ? 'Obrigatório' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              decoration: const InputDecoration(labelText: 'Condição do Veículo'),
              onSaved: (value) => _vehicleCondition = value ?? '',
              validator: (value) => value == null || value.isEmpty ? 'Obrigatório' : null,
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _loading ? null : _submitChecklist,
              child: _loading
                  ? const CircularProgressIndicator()
                  : const Text('Finalizar Checklist e Iniciar Viagem'),
            ),
          ],
        ),
      ),
    );
}

