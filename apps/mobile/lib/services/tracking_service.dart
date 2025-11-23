import 'dart:async';
import 'dart:convert';
import 'dart:io' show Platform;
import 'dart:math';

import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/services/logger_service.dart';
import '../core/theme/gf_tokens.dart';
import 'supabase_service.dart';

/// Evento de status para a UI
class TrackingStatus {
  const TrackingStatus({
    required this.tracking,
    required this.queued,
    this.tripId,
    this.driverId,
    this.lastPosition,
    this.lastError,
  });
  final bool tracking;
  final String? tripId;
  final String? driverId;
  final int queued;
  final Position? lastPosition;
  final String? lastError;

  TrackingStatus copyWith({
    bool? tracking,
    String? tripId,
    String? driverId,
    int? queued,
    Position? lastPosition,
    String? lastError,
  }) =>
      TrackingStatus(
        tracking: tracking ?? this.tracking,
        tripId: tripId ?? this.tripId,
        driverId: driverId ?? this.driverId,
        queued: queued ?? this.queued,
        lastPosition: lastPosition ?? this.lastPosition,
        lastError: lastError,
      );
}

/// Config de rastreamento (ajuste conforme o cenario)
class TrackingConfig {
  const TrackingConfig({
    this.streamInterval = const Duration(seconds: 8),
    this.distanceFilterMeters = 10,
    this.minTimeBetweenSaves = GfTokens.durationSlow,
    this.flushInterval = const Duration(seconds: 20),
    this.batchSize = 25,
    this.offlineQueueMax = 2000,
    this.accuracy = LocationAccuracy.high,
    this.useStream = true,
    this.debugLogs = false,
  });
  final Duration streamInterval; // intervalo sugerido p/ Android
  final int distanceFilterMeters; // minimo de deslocamento p/ emitir ponto
  final Duration minTimeBetweenSaves; // debouncer p/ salvar queue
  final Duration flushInterval; // flush periodico do queue
  final int batchSize; // itens por envio
  final int offlineQueueMax; // limite de itens offline
  final LocationAccuracy accuracy; // precisao
  final bool useStream; // true = stream; false = timer
  final bool debugLogs;

  TrackingConfig tunedForBattery() => TrackingConfig(
        streamInterval: const Duration(seconds: 15),
        distanceFilterMeters: max(distanceFilterMeters, 25),
        minTimeBetweenSaves: minTimeBetweenSaves,
        flushInterval: const Duration(seconds: 30),
        batchSize: batchSize,
        offlineQueueMax: offlineQueueMax,
        accuracy: LocationAccuracy.medium,
        useStream: useStream,
        debugLogs: debugLogs,
      );
}

class TrackingService {
  factory TrackingService() => _instance;
  TrackingService._internal();
  /* ------------------ Singleton ------------------ */
  static final TrackingService _instance = TrackingService._internal();

  /* ------------------ State ------------------ */
  Timer? _timer; // fallback quando nao usar stream
  Timer? _flushTimer; // flush periodico do queue
  StreamSubscription<Position>? _posSub; // stream do geolocator
  bool _isTracking = false;
  String? _tripId;
  String? _driverId;
  Position? _lastSent; // ultimo ponto enviado (para filtro)
  Position? _lastReceived; // ultimo ponto recebido
  TrackingConfig _config = const TrackingConfig();
  Duration _backoff = const Duration(seconds: 2);
  DateTime _nextAllowedSend = DateTime.fromMillisecondsSinceEpoch(0);

  final List<Map<String, dynamic>> _queue = <Map<String, dynamic>>[];
  DateTime _lastQueuePersist = DateTime.fromMillisecondsSinceEpoch(0);
  Future<void> _writeChain = Future.value();

  // Status stream para UI
  final _statusCtrl = StreamController<TrackingStatus>.broadcast();
  Stream<TrackingStatus> get statusStream => _statusCtrl.stream;

  static const _kQueueKey = 'tracking_offline_queue_v2';

  /* ------------------ Public API ------------------ */

  bool get isTracking => _isTracking;
  String? get currentTripId => _tripId;
  int get offlineQueueLength => _queue.length;

  Future<void> startTracking({
    required String tripId,
    required String driverId,
    TrackingConfig config = const TrackingConfig(),
  }) async {
    await _ensurePermissions();

    await stopTracking(); // idempotente

    _tripId = tripId;
    _driverId = driverId;
    _isTracking = true;
    _config = config;
    _backoff = const Duration(seconds: 2);
    _lastSent = null;
    _lastReceived = null;

    await _loadQueue(); // recupera offline

    // Inicia stream ou timer
    if (_config.useStream) {
      final settings = LocationSettings(
        accuracy: _config.accuracy,
        distanceFilter: _config.distanceFilterMeters,
      );

      // Ajustes especificos por plataforma
      final locSettings = Platform.isAndroid
          ? AndroidSettings(
              accuracy: _config.accuracy,
              distanceFilter: _config.distanceFilterMeters,
              intervalDuration: _config.streamInterval,
              foregroundNotificationConfig: const ForegroundNotificationConfig(
                notificationText: 'Rastreando sua viagem...',
                notificationTitle: 'GolfFox em execucao',
              ),
            )
          : Platform.isIOS
              ? AppleSettings(
                  accuracy: _config.accuracy,
                  distanceFilter: _config.distanceFilterMeters,
                  activityType: ActivityType.automotiveNavigation,
                  showBackgroundLocationIndicator: true,
                )
              : settings;

      _posSub =
          Geolocator.getPositionStream(locationSettings: locSettings).listen(
        _onPosition,
        onError: (Object e, StackTrace st) => _emitError(e.toString()),
      );
    } else {
      _timer = Timer.periodic(
        _config.streamInterval,
        (_) => unawaited(_pollPosition()),
      );
      // dispara logo
      unawaited(_pollPosition());
    }

    // Agenda flush periodico
    _flushTimer =
        Timer.periodic(_config.flushInterval, (_) => unawaited(_flushQueue()));

    // Emite status inicial
    _emitStatus();
  }

  Future<void> stopTracking() async {
    if (_posSub != null) {
      await _posSub!.cancel();
      _posSub = null;
    }
    _timer?.cancel();
    _timer = null;
    _flushTimer?.cancel();
    _flushTimer = null;

    _isTracking = false;
    _emitStatus();

    // Tenta flush final (sem ficar preso - com timeout leve)
    try {
      await _flushQueue(timeout: const Duration(seconds: 8));
    } on Exception {
      // mantem na fila
    }

    _tripId = null;
    _driverId = null;
  }

  /// Forca reprocessar fila offline agora
  Future<void> retryOfflineSync() => _flushQueue();

  /* ------------------ Position handling ------------------ */

  Future<void> _pollPosition() async {
    try {
      final settings = LocationSettings(accuracy: _config.accuracy);
      final p = await Geolocator.getCurrentPosition(locationSettings: settings);
      _onPosition(p);
    } on Exception catch (e) {
      _emitError('Erro ao obter posicao: $e');
    }
  }

  void _onPosition(Position p) {
    _lastReceived = p;

    if (!_isTracking || _tripId == null || _driverId == null) {
      return;
    }

    // Tuning: ignora se quase parado e nao passou tempo/distancia suficiente
    final now = DateTime.now();
    if (_lastSent != null) {
      final dist = calculateDistanceMeters(
        _lastSent!.latitude,
        _lastSent!.longitude,
        p.latitude,
        p.longitude,
      );
      final tooClose =
          dist < max(1, (_config.distanceFilterMeters * 0.5).round());
      final almostStopped = p.speed.isFinite && p.speed < 0.5;
      if (tooClose && almostStopped) {
        _debug('Skip point (too close & slow) d=${dist.toStringAsFixed(1)}m');
        _emitStatus(); // atualiza ultimo recebido
        return;
      }
    }

    // Rate-limit: evita bursts quando GPS entrega varios pontos juntos
    if (now.isBefore(_nextAllowedSend)) {
      _enqueue(p); // mas guarda offline
      _emitStatus();
      return;
    }
    _nextAllowedSend = now.add(const Duration(seconds: 2));

    // Tenta enviar ja; se falhar, vai pro queue
    unawaited(_sendOrQueue(p));
    _emitStatus();
  }

  Future<void> _sendOrQueue(Position p) async {
    try {
      await SupabaseService.instance.insertDriverPosition(
        tripId: _tripId!,
        driverId: _driverId!,
        latitude: p.latitude,
        longitude: p.longitude,
        accuracy: p.accuracy,
        speed: p.speed,
        heading: p.heading,
      );
      _lastSent = p;
      // sucesso  tenta flush do que ja havia
      unawaited(_flushQueue());
    } on Exception catch (e) {
      _debug('Falha envio imediato, add queue: $e');
      _enqueue(p);
      await _saveQueueDebounced();
    }
  }

  void _enqueue(Position p) {
    // Cap do queue (descarta mais antigos se exceder)
    if (_queue.length >= _config.offlineQueueMax) {
      _queue.removeRange(0, _queue.length - _config.offlineQueueMax + 1);
    }
    _queue.add({
      'trip_id': _tripId,
      'driver_id': _driverId,
      'latitude': p.latitude,
      'longitude': p.longitude,
      'accuracy': p.accuracy,
      'speed': p.speed,
      'heading': p.heading,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  Future<void> _flushQueue({Duration? timeout}) async {
    if (_queue.isEmpty) {
      await _loadQueue(); // tenta carregar pendentes
      if (_queue.isEmpty) {
        _emitStatus();
        return;
      }
    }

    // faz uma copia para enviar por lotes
    final copy = List<Map<String, dynamic>>.from(_queue);
    final chunkSize = max(1, _config.batchSize);

    // backoff com jitter leve
    var backoff = _backoff;

    for (var i = 0; i < copy.length; i += chunkSize) {
      final chunk = copy.sublist(i, min(i + chunkSize, copy.length));

      try {
        // como nao ha batch no service, enviamos item a item:
        for (final it in chunk) {
          await SupabaseService.instance.insertDriverPosition(
            tripId: it['trip_id'] as String? ?? '',
            driverId: it['driver_id'] as String? ?? '',
            latitude: (it['latitude'] as num).toDouble(),
            longitude: (it['longitude'] as num).toDouble(),
            accuracy: (it['accuracy'] as num?)?.toDouble(),
            speed: (it['speed'] as num?)?.toDouble(),
            heading: (it['heading'] as num?)?.toDouble(),
          );
        }

        // sucesso  remove do queue "vivo" e persiste
        _queue.removeRange(0, min(chunk.length, _queue.length));
        await _saveQueue();

        // reset backoff ao primeiro sucesso
        backoff = const Duration(seconds: 2);
        _backoff = backoff;
      } on Exception catch (e) {
        _debug('Flush chunk falhou: $e');

        // aplica backoff + jitter e aborta o restante (tentara depois)
        final jitterMs = Random().nextInt(400); // 0-400ms
        final wait = backoff + Duration(milliseconds: jitterMs);
        _backoff = Duration(
          milliseconds: min(wait.inMilliseconds * 2, 120000), // cap 2min
        );

        if (timeout != null && wait > timeout) rethrow;

        await Future<void>.delayed(wait);
        break;
      }
    }

    _emitStatus();
  }

  /* ------------------ Persistence ------------------ */

  Future<void> _saveQueueDebounced() async {
    final now = DateTime.now();
    if (now.difference(_lastQueuePersist) < _config.minTimeBetweenSaves) {
      return;
    }
    _lastQueuePersist = now;
    await _saveQueue();
  }

  Future<void> _saveQueue() => _writeChain = _writeChain.then((_) async {
        try {
          final prefs = await SharedPreferences.getInstance();
          final list = _queue.map(jsonEncode).toList(growable: false);
          await prefs.setStringList(_kQueueKey, list);
        } on Exception catch (e) {
          _debug('Erro salvando queue: $e');
        }
      });

  Future<void> _loadQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = prefs.getStringList(_kQueueKey) ?? const <String>[];
      _queue.clear();
      for (final s in list) {
        try {
          final m = jsonDecode(s) as Map<String, dynamic>;
          _queue.add(m);
        } on FormatException {
          // Ignora item corrompido
        }
      }
    } on Exception catch (e) {
      _debug('Erro lendo queue: $e');
    }
  }

  /* ------------------ Permissions ------------------ */

  Future<void> _ensurePermissions() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) {
      throw Exception('Servicos de localizacao desativados.');
    }

    var perm = await Geolocator.checkPermission();
    if (perm == LocationPermission.denied) {
      perm = await Geolocator.requestPermission();
    }

    if (perm == LocationPermission.denied) {
      throw Exception('Permissao de localizacao negada.');
    }
    if (perm == LocationPermission.deniedForever) {
      throw Exception('Permissao de localizacao negada permanentemente.');
    }
    // Observacao: para rastrear em 2o plano no Android/iOS,
    // e necessario declarar permissoes nas plataformas e, em Android,
    // usar foreground service (Geolocator ja suporta via config acima).
  }

  /* ------------------ Utils ------------------ */

  void _emitStatus({String? error}) {
    _statusCtrl.add(TrackingStatus(
      tracking: _isTracking,
      tripId: _tripId,
      driverId: _driverId,
      queued: _queue.length,
      lastPosition: _lastReceived,
      lastError: error,
    ));
  }

  void _emitError(String msg) {
    LoggerService.instance.error('Tracking error', msg);
    _debug(msg);
    _statusCtrl.add(TrackingStatus(
      tracking: _isTracking,
      tripId: _tripId,
      driverId: _driverId,
      queued: _queue.length,
      lastPosition: _lastReceived,
      lastError: msg,
    ));
  }

  void _debug(String msg) {
    if (_config.debugLogs) {
      LoggerService.instance.debug('[Tracking] $msg');
    }
  }

  // Haversine (metros)
  static double calculateDistanceMeters(
    double lat1,
    double lng1,
    double lat2,
    double lng2,
  ) {
    const R = 6371000;
    final dLat = _deg2rad(lat2 - lat1);
    final dLon = _deg2rad(lng2 - lng1);
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_deg2rad(lat1)) *
            cos(_deg2rad(lat2)) *
            sin(dLon / 2) *
            sin(dLon / 2);
    final c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return R * c;
  }

  static double _deg2rad(double deg) => deg * pi / 180.0;

  /* ------------------ Dispose ------------------ */

  Future<void> dispose() async {
    await stopTracking();
    await _statusCtrl.close();
  }
}
