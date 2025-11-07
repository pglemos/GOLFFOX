import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:latlong2/latlong.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/vehicle_position.dart';

/// Servico de real-time que combina dados mock para desenvolvimento
/// e funcionalidade real-time via Supabase para producao
class RealtimeService {

  RealtimeService._();
  static RealtimeService? _instance;
  static RealtimeService get instance => _instance ??= RealtimeService._();

  // Configuracoes
  static const Duration _updateInterval = Duration(seconds: 5);
  static const Duration _simulationInterval = Duration(seconds: 2);
  // Estado interno
  final StreamController<List<VehiclePosition>> _positionsController =
      StreamController<List<VehiclePosition>>.broadcast();

  List<VehiclePosition> _currentPositions = [];
  Timer? _updateTimer;
  Timer? _simulationTimer;
  RealtimeChannel? _realtimeChannel;
  bool _isInitialized = false;
  bool _useSupabase = false;

  // Getters publicos
  Stream<List<VehiclePosition>> get positionsStream =>
      _positionsController.stream;
  List<VehiclePosition> get currentPositions =>
      List.unmodifiable(_currentPositions);
  bool get isConnected => _useSupabase ? _realtimeChannel != null : true;

  /// Inicializa o servico
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Tentar conectar com Supabase
      await _initializeSupabase();
      _useSupabase = true;
      debugPrint('RealtimeService: Conectado ao Supabase');
    } catch (e) {
      // Fallback para dados mock
      _useSupabase = false;
      debugPrint('RealtimeService: Usando dados mock - $e');
    }

    // Carregar dados iniciais
    await _loadInitialData();

    // Iniciar atualizacoes
    _startUpdates();

    _isInitialized = true;
    debugPrint('RealtimeService: Inicializado (Supabase: $_useSupabase)');
  }

  /// Inicializa conexao com Supabase
  Future<void> _initializeSupabase() async {
    final supabase = Supabase.instance.client;

    // Verificar se a tabela existe
    final response =
        await supabase.from('vehicle_positions').select('count').limit(1);

    if (response.isEmpty) {
      throw Exception('Tabela vehicle_positions nao encontrada');
    }

    // Configurar subscription real-time
    _realtimeChannel = supabase
        .channel('vehicle_positions_channel')
        .onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'vehicle_positions',
          callback: _handleRealtimeUpdate,
        )
        .subscribe();
  }

  /// Carrega dados iniciais
  Future<void> _loadInitialData() async {
    if (_useSupabase) {
      await _loadFromSupabase();
    } else {
      _loadMockData();
    }

    _positionsController.add(_currentPositions);
  }

  /// Carrega dados do Supabase
  Future<void> _loadFromSupabase() async {
    try {
      final response = await Supabase.instance.client
          .from('vehicle_positions')
          .select()
          .order('updated_at', ascending: false);

      final List<dynamic> data = response as List<dynamic>;
      _currentPositions = data
          .map(
            (item) => _vehiclePositionFromSupabase(
              Map<String, dynamic>.from(item as Map),
            ),
          )
          .toList();
    } catch (e) {
      debugPrint('Erro ao carregar do Supabase: $e');
      _loadMockData();
    }
  }

  /// Carrega dados mock para desenvolvimento
  void _loadMockData() {
    final random = Random();

    // Coordenadas base (centro de uma cidade exemplo)
    const baseLatitude = -23.5505;
    const baseLongitude = -46.6333;

    _currentPositions = List.generate(15, (index) {
      final vehicleId = 'VEH${(index + 1).toString().padLeft(3, '0')}';
      final latitude = baseLatitude + (random.nextDouble() - 0.5) * 0.02;
      final longitude = baseLongitude + (random.nextDouble() - 0.5) * 0.02;

      return VehiclePosition(
        id: vehicleId,
        vehicleId: vehicleId,
        licensePlate: 'ABC-${1000 + index}',
        driverName: _getRandomDriverName(index),
        position: LatLng(latitude, longitude),
        status: _getRandomStatus(random),
        speed: random.nextDouble() * 60,
        heading: random.nextDouble() * 360,
        lastUpdate:
            DateTime.now().subtract(Duration(seconds: random.nextInt(300))),
        routeId: 'ROUTE_${(index % 5) + 1}',
        routeName: _getRouteName(index % 5),
        passengerCount: random.nextInt(40),
        capacity: 40,
      );
    });
  }

  /// Inicia atualizacoes periodicas
  void _startUpdates() {
    // Timer para atualizacoes gerais
    _updateTimer = Timer.periodic(_updateInterval, (_) => _performUpdate());

    // Timer para simulacao de movimento (apenas para dados mock)
    if (!_useSupabase) {
      _simulationTimer =
          Timer.periodic(_simulationInterval, (_) => _simulateMovement());
    }
  }

  /// Realiza atualizacao dos dados
  Future<void> _performUpdate() async {
    if (_useSupabase) {
      await _loadFromSupabase();
    } else {
      _updateMockData();
    }

    _positionsController.add(_currentPositions);
  }

  /// Simula movimento dos veiculos (apenas para dados mock)
  void _simulateMovement() {
    final random = Random();

    for (var i = 0; i < _currentPositions.length; i++) {
      final vehicle = _currentPositions[i];

      // Apenas mover veiculos ativos
      if (vehicle.status != VehicleStatus.active) continue;

      // Calcular nova posicao baseada na direcao atual
      final distance =
          (vehicle.speed ?? 0) * _simulationInterval.inSeconds / 3600;
      final bearing = vehicle.heading ?? random.nextDouble() * 360;

      final newPosition = _calculateNewPosition(
        vehicle.position,
        bearing,
        distance * 1000, // converter para metros
      );

      // Atualizar veiculo
      _currentPositions[i] = vehicle.copyWith(
        position: newPosition,
        speed: vehicle.speed! + (random.nextDouble() - 0.5) * 5,
        heading: bearing + (random.nextDouble() - 0.5) * 30,
        lastUpdate: DateTime.now(),
      );
    }

    _positionsController.add(_currentPositions);
  }

  /// Atualiza dados mock com variacoes
  void _updateMockData() {
    final random = Random();

    for (var i = 0; i < _currentPositions.length; i++) {
      final vehicle = _currentPositions[i];

      // Simular mudancas ocasionais de status
      var newStatus = vehicle.status;
      if (random.nextDouble() < 0.05) {
        // 5% chance de mudanca
        newStatus = _getRandomStatus(random);
      }

      // Simular mudancas na contagem de passageiros
      var newPassengerCount = vehicle.passengerCount;
      if (random.nextDouble() < 0.1) {
        // 10% chance de mudanca
        newPassengerCount = random.nextInt(vehicle.capacity ?? 40);
      }

      _currentPositions[i] = vehicle.copyWith(
        status: newStatus,
        passengerCount: newPassengerCount,
        lastUpdate: DateTime.now(),
      );
    }
  }

  /// Manipula atualizacoes real-time do Supabase
  void _handleRealtimeUpdate(PostgresChangePayload payload) {
    debugPrint('Atualizacao real-time recebida: ${payload.eventType}');

    switch (payload.eventType) {
      case PostgresChangeEvent.insert:
      case PostgresChangeEvent.update:
        final vehicleData = payload.newRecord;
        final vehicle = _vehiclePositionFromSupabase(vehicleData);
        _updateVehicleInList(vehicle);
              break;
      case PostgresChangeEvent.delete:
        final vehicleData = payload.oldRecord;
        _removeVehicleFromList(vehicleData['id'] as String);
              break;
      case PostgresChangeEvent.all:
        // Caso para eventos gerais - nao precisamos fazer nada especifico
        debugPrint('Evento geral recebido');
        break;
    }

    _positionsController.add(_currentPositions);
  }

  /// Atualiza um veiculo na lista
  void _updateVehicleInList(VehiclePosition vehicle) {
    final index = _currentPositions.indexWhere((v) => v.id == vehicle.id);
    if (index >= 0) {
      _currentPositions[index] = vehicle;
    } else {
      _currentPositions.add(vehicle);
    }
  }

  /// Remove um veiculo da lista
  void _removeVehicleFromList(String vehicleId) {
    _currentPositions.removeWhere((v) => v.id == vehicleId);
  }

  /// Converte dados do Supabase para VehiclePosition
  VehiclePosition _vehiclePositionFromSupabase(Map<String, dynamic> json) {
    final lat = (json['latitude'] as num?)?.toDouble() ?? 0;
    final lng = (json['longitude'] as num?)?.toDouble() ?? 0;

    return VehiclePosition(
      id: json['id'] as String? ?? '',
      vehicleId: json['vehicle_id'] as String? ?? '',
      licensePlate: json['license_plate'] as String? ?? '',
      driverName: json['driver_name'] as String? ?? '',
      position: LatLng(lat, lng),
      status: VehicleStatus.values.firstWhere(
        (s) => s.name == (json['status'] as String?),
        orElse: () => VehicleStatus.offline,
      ),
      speed: (json['speed'] as num?)?.toDouble(),
      heading: (json['heading'] as num?)?.toDouble(),
      lastUpdate: DateTime.parse(
        json['updated_at'] as String? ??
            DateTime.now().toIso8601String(),
      ),
      routeId: json['route_id'] as String?,
      routeName: json['route_name'] as String?,
      passengerCount: (json['passenger_count'] as num?)?.toInt(),
      capacity: (json['capacity'] as num?)?.toInt(),
    );
  }

  /// Calcula nova posicao baseada em bearing e distancia
  LatLng _calculateNewPosition(LatLng start, double bearing, double distance) {
    const double earthRadius = 6371000; // metros

    final lat1 = start.latitude * pi / 180;
    final lon1 = start.longitude * pi / 180;
    final bearingRad = bearing * pi / 180;

    final lat2 = asin(sin(lat1) * cos(distance / earthRadius) +
        cos(lat1) * sin(distance / earthRadius) * cos(bearingRad));

    final lon2 = lon1 +
        atan2(sin(bearingRad) * sin(distance / earthRadius) * cos(lat1),
            cos(distance / earthRadius) - sin(lat1) * sin(lat2));

    return LatLng(lat2 * 180 / pi, lon2 * 180 / pi);
  }

  /// Gera status aleatorio
  VehicleStatus _getRandomStatus(Random random) {
    final statuses = [
      VehicleStatus.active,
      VehicleStatus.active,
      VehicleStatus.active, // Mais chance de estar ativo
      VehicleStatus.inactive,
      VehicleStatus.maintenance,
      VehicleStatus.offline,
    ];
    return statuses[random.nextInt(statuses.length)];
  }

  /// Gera nome de motorista aleatorio
  String _getRandomDriverName(int index) {
    final names = [
      'Joao Silva',
      'Maria Santos',
      'Pedro Oliveira',
      'Ana Costa',
      'Carlos Ferreira',
      'Lucia Almeida',
      'Roberto Lima',
      'Fernanda Souza',
      'Marcos Pereira',
      'Juliana Rodrigues',
      'Antonio Barbosa',
      'Carla Mendes',
      'Paulo Nascimento',
      'Beatriz Cardoso',
      'Ricardo Gomes'
    ];
    return names[index % names.length];
  }

  /// Gera nome de rota
  String _getRouteName(int routeIndex) {
    final routes = [
      'Centro - Aeroporto',
      'Shopping - Universidade',
      'Terminal - Hospital',
      'Estacao - Praia',
      'Bairro Norte - Sul'
    ];
    return routes[routeIndex];
  }

  /// Forca atualizacao dos dados
  Future<void> forceUpdate() async {
    await _performUpdate();
  }

  /// Limpa recursos
  void dispose() {
    _updateTimer?.cancel();
    _simulationTimer?.cancel();
    _realtimeChannel?.unsubscribe();
    _positionsController.close();
    _isInitialized = false;
    debugPrint('RealtimeService: Recursos limpos');
  }
}
