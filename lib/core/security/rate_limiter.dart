import 'dart:async';
import 'dart:collection';

import '../config/app_config.dart';
import '../logging/app_logger.dart';

/// Configuração de rate limiting
class RateLimitConfig {

  const RateLimitConfig({
    required this.maxRequests,
    required this.window,
    this.blockDuration,
  });
  final int maxRequests;
  final Duration window;
  final Duration? blockDuration;

  /// Configuração para login (mais restritiva)
  static const login = RateLimitConfig(
    maxRequests: 5,
    window: Duration(minutes: 15),
    blockDuration: Duration(minutes: 30),
  );

  /// Configuração para API geral
  static const api = RateLimitConfig(
    maxRequests: 100,
    window: Duration(minutes: 1),
  );

  /// Configuração para upload de arquivos
  static const upload = RateLimitConfig(
    maxRequests: 10,
    window: Duration(minutes: 5),
    blockDuration: Duration(minutes: 10),
  );

  /// Configuração para busca
  static const search = RateLimitConfig(
    maxRequests: 50,
    window: Duration(minutes: 1),
  );

  /// Configuração para criação de conteúdo
  static const create = RateLimitConfig(
    maxRequests: 20,
    window: Duration(minutes: 5),
    blockDuration: Duration(minutes: 5),
  );
}

/// Entrada de rate limiting
class _RateLimitEntry {
  final Queue<DateTime> requests = Queue<DateTime>();
  DateTime? blockedUntil;

  bool get isBlocked => blockedUntil != null && DateTime.now().isBefore(blockedUntil!);

  void addRequest() {
    requests.add(DateTime.now());
  }

  void cleanOldRequests(Duration window) {
    final cutoff = DateTime.now().subtract(window);
    while (requests.isNotEmpty && requests.first.isBefore(cutoff)) {
      requests.removeFirst();
    }
  }

  void block(Duration duration) {
    blockedUntil = DateTime.now().add(duration);
  }

  void unblock() {
    blockedUntil = null;
  }
}

/// Sistema de rate limiting
class RateLimiter {
  factory RateLimiter() => _instance;
  RateLimiter._internal();
  static final RateLimiter _instance = RateLimiter._internal();

  final Map<String, _RateLimitEntry> _entries = {};
  Timer? _cleanupTimer;

  /// Inicializa o rate limiter
  void initialize() {
    // Limpa entradas antigas a cada 5 minutos
    _cleanupTimer = Timer.periodic(const Duration(minutes: 5), (_) {
      _cleanup();
    });

    AppLogger.info('Rate limiter initialized', tag: 'Security');
  }

  /// Finaliza o rate limiter
  void dispose() {
    _cleanupTimer?.cancel();
    _entries.clear();
  }

  /// Verifica se uma requisição é permitida
  bool isAllowed(String identifier, RateLimitConfig config) {
    if (!AppConfig.rateLimitEnabled) {
      return true;
    }

    final key = _generateKey(identifier, config);
    final entry = _entries.putIfAbsent(key, _RateLimitEntry.new);

    // Verifica se está bloqueado
    if (entry.isBlocked) {
      AppLogger.warning(
        'Rate limit blocked request',
        tag: 'Security',
      );
      return false;
    }

    // Limpa requisições antigas
    entry.cleanOldRequests(config.window);

    // Verifica se excedeu o limite
    if (entry.requests.length >= config.maxRequests) {
      AppLogger.warning(
        'Rate limit exceeded for identifier',
        tag: 'Security',
      );

      // Bloqueia se configurado
      if (config.blockDuration != null) {
        entry.block(config.blockDuration!);
        AppLogger.warning(
          'Identifier blocked for ${config.blockDuration!.inMinutes} minutes',
          tag: 'Security',
        );
      }

      return false;
    }

    // Adiciona a requisição
    entry.addRequest();
    return true;
  }

  /// Força o bloqueio de um identificador
  void block(String identifier, RateLimitConfig config, Duration duration) {
    final key = _generateKey(identifier, config);
    final entry = _entries.putIfAbsent(key, _RateLimitEntry.new);
    entry.block(duration);

    AppLogger.warning(
      'Identifier manually blocked for ${duration.inMinutes} minutes',
      tag: 'Security',
    );
  }

  /// Remove o bloqueio de um identificador
  void unblock(String identifier, RateLimitConfig config) {
    final key = _generateKey(identifier, config);
    final entry = _entries[key];
    if (entry != null) {
      entry.unblock();
      AppLogger.info(
        'Identifier manually unblocked',
        tag: 'Security',
      );
    }
  }

  /// Obtém informações sobre o rate limit
  RateLimitInfo getInfo(String identifier, RateLimitConfig config) {
    final key = _generateKey(identifier, config);
    final entry = _entries[key];

    if (entry == null) {
      return RateLimitInfo(
        requestCount: 0,
        maxRequests: config.maxRequests,
        windowDuration: config.window,
        isBlocked: false,
        remainingRequests: config.maxRequests,
      );
    }

    entry.cleanOldRequests(config.window);

    return RateLimitInfo(
      requestCount: entry.requests.length,
      maxRequests: config.maxRequests,
      windowDuration: config.window,
      isBlocked: entry.isBlocked,
      blockedUntil: entry.blockedUntil,
      remainingRequests: config.maxRequests - entry.requests.length,
    );
  }

  /// Reseta o contador para um identificador
  void reset(String identifier, RateLimitConfig config) {
    final key = _generateKey(identifier, config);
    _entries.remove(key);

    AppLogger.info(
      'Rate limit reset for identifier',
      tag: 'Security',
    );
  }

  /// Gera chave única para o rate limit
  String _generateKey(String identifier, RateLimitConfig config) => '${identifier}_${config.maxRequests}_${config.window.inSeconds}';

  /// Limpa entradas antigas
  void _cleanup() {
    final now = DateTime.now();
    final keysToRemove = <String>[];

    for (final entry in _entries.entries) {
      final rateLimitEntry = entry.value;
      
      // Remove se não está bloqueado e não tem requisições recentes
      if (!rateLimitEntry.isBlocked && rateLimitEntry.requests.isEmpty) {
        keysToRemove.add(entry.key);
      }
      
      // Remove bloqueios expirados
      if (rateLimitEntry.isBlocked && 
          rateLimitEntry.blockedUntil != null && 
          now.isAfter(rateLimitEntry.blockedUntil!)) {
        rateLimitEntry.unblock();
      }
    }

    for (final key in keysToRemove) {
      _entries.remove(key);
    }

    if (keysToRemove.isNotEmpty) {
      AppLogger.debug(
        'Cleaned up ${keysToRemove.length} rate limit entries',
        tag: 'Security',
      );
    }
  }
}

/// Informações sobre rate limit
class RateLimitInfo {

  const RateLimitInfo({
    required this.requestCount,
    required this.maxRequests,
    required this.windowDuration,
    required this.isBlocked,
    this.blockedUntil,
    required this.remainingRequests,
  });
  final int requestCount;
  final int maxRequests;
  final Duration windowDuration;
  final bool isBlocked;
  final DateTime? blockedUntil;
  final int remainingRequests;

  /// Tempo restante até o reset da janela
  Duration? get timeUntilReset {
    if (requestCount == 0) return null;
    
    // Estima baseado na janela de tempo
    return windowDuration;
  }

  /// Tempo restante até o desbloqueio
  Duration? get timeUntilUnblock {
    if (!isBlocked || blockedUntil == null) return null;
    
    final remaining = blockedUntil!.difference(DateTime.now());
    return remaining.isNegative ? Duration.zero : remaining;
  }

  @override
  String toString() => 'RateLimitInfo(requests: $requestCount/$maxRequests, '
           'blocked: $isBlocked, remaining: $remainingRequests)';
}

/// Mixin para facilitar o uso de rate limiting
mixin RateLimitMixin {
  /// Verifica rate limit para login
  bool checkLoginRateLimit(String identifier) => RateLimiter().isAllowed(identifier, RateLimitConfig.login);

  /// Verifica rate limit para API
  bool checkApiRateLimit(String identifier) => RateLimiter().isAllowed(identifier, RateLimitConfig.api);

  /// Verifica rate limit para upload
  bool checkUploadRateLimit(String identifier) => RateLimiter().isAllowed(identifier, RateLimitConfig.upload);

  /// Verifica rate limit para busca
  bool checkSearchRateLimit(String identifier) => RateLimiter().isAllowed(identifier, RateLimitConfig.search);

  /// Verifica rate limit para criação
  bool checkCreateRateLimit(String identifier) => RateLimiter().isAllowed(identifier, RateLimitConfig.create);

  /// Obtém informações de rate limit
  RateLimitInfo getRateLimitInfo(String identifier, RateLimitConfig config) => RateLimiter().getInfo(identifier, config);
}

/// Exceção de rate limit
class RateLimitException implements Exception {

  const RateLimitException(this.message, this.info);
  final String message;
  final RateLimitInfo info;

  @override
  String toString() => 'RateLimitException: $message ($info)';
}