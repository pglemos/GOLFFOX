import 'dart:async';
import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:golffox/models/user.dart';
import 'package:golffox/models/trip.dart';

/// Erros tipados para UI tratar mensagens e fallback.
class LocalDataFailure implements Exception {
  final String message;
  final Object? cause;
  LocalDataFailure(this.message, [this.cause]);
  @override
  String toString() => 'LocalDataFailure: $message';
}

/// Servico local "demo" com dados persistidos no SharedPreferences.
/// - Init idempotente com versionamento e migracao.
/// - Cache em memoria para leituras rapidas.
/// - Streams reativas: sessao do usuario e lista de viagens.
/// - Fila de escrita para evitar condicoes de corrida.
class LocalDataService {
  /* ------------------ Singleton ------------------ */
  static final LocalDataService _instance = LocalDataService._internal();
  factory LocalDataService() => _instance;
  LocalDataService._internal();

  /* ------------------ Const / Keys ------------------ */
  static const _kVersion = 2; // bump quando mudar estrutura dos dados
  static const _keyVersion = 'local_data_version';
  static const _keyUsers = 'sample_users';
  static const _keyTrips = 'sample_trips';
  static const _keyCurrentUser = 'current_user';

  /* ------------------ Runtime cache ------------------ */
  SharedPreferences? _prefs;
  bool _initialized = false;

  // caches em memoria para evitar JSON parse repetido
  List<User> _usersCache = const [];
  List<Trip> _tripsCache = const [];
  User? _currentUserCache;

  // fila simples de operacoes para serializar writes no SharedPreferences
  Future<void> _lastWrite = Future.value();

  // streams reativas
  final StreamController<User?> _sessionCtrl =
      StreamController<User?>.broadcast();
  final StreamController<List<Trip>> _tripsCtrl =
      StreamController<List<Trip>>.broadcast();

  Stream<User?> get sessionStream => _sessionCtrl.stream;
  Stream<List<Trip>> get tripsStream => _tripsCtrl.stream;

  /* ------------------ Demo seeds ------------------ */
  // Use um carimbo unico para os objetos "relativos ao agora"
  DateTime get _now => DateTime.now();

  List<User> get _seedUsers => [
        User(
          id: 'operator-001',
          email: 'operador@trans.com',
          name: 'Maria Operadora',
          role: 'operator',
          companyId: 'company-001',
          createdAt: _now.subtract(const Duration(days: 20)),
          updatedAt: _now,
        ),
        User(
          id: 'carrier-001',
          email: 'transportadora@trans.com',
          name: 'Carlos Transportadora',
          role: 'carrier',
          carrierId: 'carrier-001',
          createdAt: _now.subtract(const Duration(days: 15)),
          updatedAt: _now,
        ),
        User(
          id: 'driver-001',
          email: 'motorista@trans.com',
          name: 'Pedro Motorista',
          role: 'driver',
          companyId: 'company-001',
          carrierId: 'carrier-001',
          createdAt: _now.subtract(const Duration(days: 10)),
          updatedAt: _now,
        ),
        User(
          id: 'passenger-001',
          email: 'passageiro@trans.com',
          name: 'Ana Passageira',
          role: 'passenger',
          companyId: 'company-001',
          createdAt: _now.subtract(const Duration(days: 5)),
          updatedAt: _now,
        ),
      ];

  List<Trip> get _seedTrips => [
        Trip(
          id: 'trip-001',
          routeId: 'route-001',
          driverId: 'driver-001',
          vehicleId: 'vehicle-001',
          status: 'scheduled',
          scheduledStartTime: _now.add(const Duration(hours: 2)),
          notes: 'Rota Centro  Aeroporto',
          createdAt: _now.subtract(const Duration(hours: 1)),
          updatedAt: _now,
        ),
        Trip(
          id: 'trip-002',
          routeId: 'route-002',
          driverId: 'driver-001',
          vehicleId: 'vehicle-001',
          status: 'inProgress',
          scheduledStartTime: _now.subtract(const Duration(minutes: 30)),
          actualStartTime: _now.subtract(const Duration(minutes: 25)),
          notes: 'Rota Shopping  Universidade',
          createdAt: _now.subtract(const Duration(hours: 2)),
          updatedAt: _now.subtract(const Duration(minutes: 25)),
        ),
        Trip(
          id: 'trip-003',
          routeId: 'route-003',
          driverId: 'driver-001',
          vehicleId: 'vehicle-001',
          status: 'completed',
          scheduledStartTime: _now.subtract(const Duration(hours: 3)),
          actualStartTime: _now.subtract(const Duration(hours: 3)),
          actualEndTime: _now.subtract(const Duration(hours: 2)),
          notes: 'Rota Residencial  Centro',
          createdAt: _now.subtract(const Duration(hours: 4)),
          updatedAt: _now.subtract(const Duration(hours: 2)),
        ),
      ];

  /* ------------------ Init / Migracao ------------------ */
  /// Garante inicializacao idempotente, com migracao por versao.
  Future<void> ensureInitialized() async {
    if (_initialized) return;
    _prefs ??= await SharedPreferences.getInstance();

    final version = _prefs!.getInt(_keyVersion) ?? 0;
    final needSeed = !_prefs!.containsKey(_keyUsers) ||
        !_prefs!.containsKey(_keyTrips) ||
        version != _kVersion;

    if (needSeed) {
      await _seedAll(); // sobrescreve dados antigos
      await _prefs!.setInt(_keyVersion, _kVersion);
    } else {
      await _loadCaches();
    }

    _initialized = true;
  }

  Future<void> _seedAll() async {
    // salva users
    final usersJson =
        _seedUsers.map((u) => jsonEncode(u.toJson())).toList(growable: false);
    final tripsJson =
        _seedTrips.map((t) => jsonEncode(t.toJson())).toList(growable: false);

    await _prefs!.setStringList(_keyUsers, usersJson);
    await _prefs!.setStringList(_keyTrips, tripsJson);

    _usersCache = List<User>.unmodifiable(_seedUsers);
    _tripsCache = _sortedTrips(_seedTrips);
    _currentUserCache = null;

    _tripsCtrl.add(_tripsCache);
    _sessionCtrl.add(null);
  }

  Future<void> _loadCaches() async {
    _usersCache = _readUsers();
    _tripsCache = _sortedTrips(_readTrips());
    _currentUserCache = _readCurrentUserOrNull();

    _tripsCtrl.add(_tripsCache);
    _sessionCtrl.add(_currentUserCache);
  }

  /* ------------------ Auth (demo) ------------------ */
  /// Autentica um usuario pelo e-mail. Senha "demo" padrao: `senha123`.
  Future<User?> authenticateUser(String email, String password) async {
    await ensureInitialized();

    if (password != 'senha123') {
      throw LocalDataFailure('Senha incorreta');
    }
    final user = _usersCache.firstWhere(
      (u) => u.email.trim().toLowerCase() == email.trim().toLowerCase(),
      orElse: () => throw LocalDataFailure('Usuario nao encontrado'),
    );

    await _enqueueWrite(() async {
      final jsonStr = jsonEncode(user.toJson());
      await _prefs!.setString(_keyCurrentUser, jsonStr);
      _currentUserCache = user;
      _sessionCtrl.add(user);
    });

    return user;
  }

  Future<User?> getCurrentUser() async {
    await ensureInitialized();
    return _currentUserCache;
  }

  Future<void> signOut() async {
    await ensureInitialized();
    await _enqueueWrite(() async {
      await _prefs!.remove(_keyCurrentUser);
      _currentUserCache = null;
      _sessionCtrl.add(null);
    });
  }

  Future<bool> isAuthenticated() async {
    await ensureInitialized();
    return _currentUserCache != null;
  }

  /* ------------------ Trips ------------------ */

  /// Trips para o usuario, filtradas por papel, ordenadas por prioridade.
  Future<List<Trip>> getTripsForUser(User user) async {
    await ensureInitialized();
    final role = (user.role).toLowerCase();

    // Filtro por papel - ajuste conforme seu dominio evoluir.
    bool include(Trip t) {
      switch (role) {
        case 'operator':
        case 'passenger':
        case 'carrier':
          // Demo: todos. Voce pode filtrar por companyId/carrierId/route depois.
          return true;
        case 'driver':
          return t.driverId == user.id;
        default:
          return false;
      }
    }

    final list = _tripsCache.where(include).toList(growable: false);
    return list;
  }

  /// Atualiza status de uma trip (simulacao) e grava no storage.
  Future<void> updateTripStatus(String tripId, String newStatus) async {
    await ensureInitialized();

    final idx = _tripsCache.indexWhere((t) => t.id == tripId);
    if (idx == -1) {
      throw LocalDataFailure('Viagem nao encontrada');
    }

    final current = _tripsCache[idx];
    final now = DateTime.now();

    final updated = current.copyWith(
      status: newStatus,
      actualStartTime: newStatus == 'inProgress'
          ? (current.actualStartTime ?? now)
          : current.actualStartTime,
      actualEndTime: newStatus == 'completed' ? now : current.actualEndTime,
      updatedAt: now,
    );

    final nextTrips = [..._tripsCache]..[idx] = updated;
    final nextSorted = _sortedTrips(nextTrips);

    await _enqueueWrite(() async {
      final encoded = nextSorted.map((t) => jsonEncode(t.toJson())).toList();
      await _prefs!.setStringList(_keyTrips, encoded);
      _tripsCache = nextSorted;
      _tripsCtrl.add(_tripsCache);
    });
  }

  /// Observa trips do usuario (auto-atualiza apos writes).
  Stream<List<Trip>> watchTripsForUser(User user) async* {
    await ensureInitialized();
    // emite atual imediatamente
    yield await getTripsForUser(user);
    // depois, filtra o stream global
    yield* tripsStream.map((all) {
      final role = (user.role).toLowerCase();
      bool include(Trip t) {
        switch (role) {
          case 'driver':
            return t.driverId == user.id;
          case 'operator':
          case 'passenger':
          case 'carrier':
            return true;
          default:
            return false;
        }
      }

      return _sortedTrips(all.where(include).toList());
    });
  }

  /* ------------------ Admin helpers (uteis no dev) ------------------ */

  /// Recria todos os dados de demonstracao. **Atencao**: sobrescreve storage.
  Future<void> resetDemoData() async {
    await ensureInitialized();
    await _enqueueWrite(() async {
      await _seedAll();
      await _prefs!.setInt(_keyVersion, _kVersion);
    });
  }

  /// Upsert de usuario (por id). Util pra testar sem Supabase.
  Future<void> upsertUser(User user) async {
    await ensureInitialized();
    final map = {for (final u in _usersCache) u.id: u};
    map[user.id] = user.copyWith(updatedAt: DateTime.now());
    final next = map.values.toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    await _enqueueWrite(() async {
      final encoded = next.map((u) => jsonEncode(u.toJson())).toList();
      await _prefs!.setStringList(_keyUsers, encoded);
      _usersCache = List.unmodifiable(next);
    });
  }

  /// Upsert de trip (por id).
  Future<void> upsertTrip(Trip trip) async {
    await ensureInitialized();
    final map = {for (final t in _tripsCache) t.id: t};
    map[trip.id] = trip.copyWith(updatedAt: DateTime.now());
    final nextSorted = _sortedTrips(map.values.toList());
    await _enqueueWrite(() async {
      final encoded = nextSorted.map((t) => jsonEncode(t.toJson())).toList();
      await _prefs!.setStringList(_keyTrips, encoded);
      _tripsCache = nextSorted;
      _tripsCtrl.add(_tripsCache);
    });
  }

  /// Remove tudo do storage local (inclui sessao).
  Future<void> clearAll() async {
    await ensureInitialized();
    await _enqueueWrite(() async {
      await _prefs!.remove(_keyUsers);
      await _prefs!.remove(_keyTrips);
      await _prefs!.remove(_keyCurrentUser);
      _usersCache = const [];
      _tripsCache = const [];
      _currentUserCache = null;
      _sessionCtrl.add(null);
      _tripsCtrl.add(const []);
      await _prefs!.setInt(_keyVersion, _kVersion);
      await _seedAll(); // re-seed para manter demo funcional
    });
  }

  /* ------------------ Internals ------------------ */

  List<User> _readUsers() {
    final list = _prefs!.getStringList(_keyUsers) ?? const [];
    final parsed = <User>[];
    for (final s in list) {
      try {
        final m = jsonDecode(s) as Map<String, dynamic>;
        parsed.add(User.fromJson(m));
      } catch (e) {
        // ignora item corrompido
      }
    }
    // mantem ordem criada desc
    parsed.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return List.unmodifiable(parsed);
  }

  List<Trip> _readTrips() {
    final list = _prefs!.getStringList(_keyTrips) ?? const [];
    final parsed = <Trip>[];
    for (final s in list) {
      try {
        final m = jsonDecode(s) as Map<String, dynamic>;
        parsed.add(Trip.fromJson(m));
      } catch (e) {
        // ignora item corrompido
      }
    }
    return parsed;
  }

  User? _readCurrentUserOrNull() {
    final s = _prefs!.getString(_keyCurrentUser);
    if (s == null) return null;
    try {
      final m = jsonDecode(s) as Map<String, dynamic>;
      return User.fromJson(m);
    } catch (_) {
      return null;
    }
  }

  /// Ordena trips por prioridade de status e depois por horario/atualizacao:
  /// 1) inProgress, 2) scheduled, 3) completed, 4) cancelled/outros.
  List<Trip> _sortedTrips(List<Trip> items) {
    int statusRank(String s) {
      switch (s.toLowerCase()) {
        case 'inprogress':
          return 0;
        case 'scheduled':
          return 1;
        case 'completed':
          return 2;
        case 'cancelled':
          return 3;
        default:
          return 4;
      }
    }

    int compare(Trip a, Trip b) {
      final r = statusRank(a.status).compareTo(statusRank(b.status));
      if (r != 0) return r;

      // se ambos scheduled, mais proximo no topo
      if (a.scheduledStartTime != null && b.scheduledStartTime != null) {
        return a.scheduledStartTime!.compareTo(b.scheduledStartTime!);
      }

      // fallback: updatedAt desc
      return b.updatedAt.compareTo(a.updatedAt);
    }

    final copy = [...items]..sort(compare);
    return List.unmodifiable(copy);
  }

  /// Serializa writes para evitar corrida no SharedPreferences.
  Future<void> _enqueueWrite(Future<void> Function() op) {
    _lastWrite = _lastWrite.then((_) => op());
    return _lastWrite;
  }

  /* ------------------ Dispose (testes) ------------------ */
  Future<void> dispose() async {
    await _sessionCtrl.close();
    await _tripsCtrl.close();
  }
}
