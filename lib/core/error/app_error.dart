import 'package:flutter/foundation.dart';

/// Tipos de erro da aplicação
enum AppErrorType {
  network,
  authentication,
  authorization,
  validation,
  notFound,
  serverError,
  timeout,
  unknown,
  fileSystem,
  permission,
}

/// Classe base para erros da aplicação
abstract class AppError implements Exception {

  const AppError({
    required this.message,
    required this.type,
    this.code,
    this.originalError,
    this.stackTrace,
  });
  final String message;
  final AppErrorType type;
  final String? code;
  final dynamic originalError;
  final StackTrace? stackTrace;

  /// Retorna uma mensagem amigável para o usuário
  String get userMessage => message;

  /// Retorna se o erro deve ser reportado para analytics
  bool get shouldReport => type != AppErrorType.validation;

  @override
  String toString() => 'AppError{type: $type, message: $message, code: $code}';
}

/// Erro de rede
class NetworkError extends AppError {
  const NetworkError({
    required super.message,
    super.code,
    super.originalError,
    super.stackTrace,
  }) : super(type: AppErrorType.network);

  @override
  String get userMessage {
    switch (code) {
      case 'timeout':
        return 'Tempo limite de conexão esgotado. Verifique sua internet.';
      case 'no_internet':
        return 'Sem conexão com a internet. Verifique sua conexão.';
      case 'server_unreachable':
        return 'Servidor indisponível. Tente novamente mais tarde.';
      default:
        return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }
  }
}

/// Erro de autenticação
class AuthenticationError extends AppError {
  const AuthenticationError({
    required super.message,
    super.code,
    super.originalError,
    super.stackTrace,
  }) : super(type: AppErrorType.authentication);

  @override
  String get userMessage {
    switch (code) {
      case 'invalid_credentials':
        return 'Email ou senha incorretos.';
      case 'account_locked':
        return 'Conta bloqueada. Entre em contato com o suporte.';
      case 'token_expired':
        return 'Sessão expirada. Faça login novamente.';
      default:
        return 'Erro de autenticação. Verifique suas credenciais.';
    }
  }
}

/// Erro de autorização
class AuthorizationError extends AppError {
  const AuthorizationError({
    required super.message,
    super.code,
    super.originalError,
    super.stackTrace,
  }) : super(type: AppErrorType.authorization);

  @override
  String get userMessage => 'Você não tem permissão para realizar esta ação.';
}

/// Erro de validação
class ValidationError extends AppError {

  const ValidationError({
    required super.message,
    this.fieldErrors,
    super.code,
    super.originalError,
    super.stackTrace,
  }) : super(type: AppErrorType.validation);
  final Map<String, List<String>>? fieldErrors;

  @override
  String get userMessage {
    if (fieldErrors != null && fieldErrors!.isNotEmpty) {
      final firstError = fieldErrors!.values.first.first;
      return firstError;
    }
    return message;
  }

  @override
  bool get shouldReport => false;
}

/// Erro de recurso não encontrado
class NotFoundError extends AppError {
  const NotFoundError({
    required super.message,
    super.code,
    super.originalError,
    super.stackTrace,
  }) : super(type: AppErrorType.notFound);

  @override
  String get userMessage => 'Recurso não encontrado.';
}

/// Erro do servidor
class ServerError extends AppError {
  const ServerError({
    required super.message,
    super.code,
    super.originalError,
    super.stackTrace,
  }) : super(type: AppErrorType.serverError);

  @override
  String get userMessage => 'Erro interno do servidor. Tente novamente mais tarde.';
}

/// Erro de timeout
class TimeoutError extends AppError {
  const TimeoutError({
    required super.message,
    super.code,
    super.originalError,
    super.stackTrace,
  }) : super(type: AppErrorType.timeout);

  @override
  String get userMessage => 'Operação demorou muito para responder. Tente novamente.';
}

/// Erro de sistema de arquivos
class FileSystemError extends AppError {
  const FileSystemError({
    required super.message,
    super.code,
    super.originalError,
    super.stackTrace,
  }) : super(type: AppErrorType.fileSystem);

  @override
  String get userMessage {
    switch (code) {
      case 'file_not_found':
        return 'Arquivo não encontrado.';
      case 'permission_denied':
        return 'Permissão negada para acessar o arquivo.';
      case 'disk_full':
        return 'Espaço em disco insuficiente.';
      default:
        return 'Erro ao acessar arquivo.';
    }
  }
}

/// Erro de permissão
class PermissionError extends AppError {
  const PermissionError({
    required super.message,
    super.code,
    super.originalError,
    super.stackTrace,
  }) : super(type: AppErrorType.permission);

  @override
  String get userMessage {
    switch (code) {
      case 'camera':
        return 'Permissão de câmera necessária.';
      case 'location':
        return 'Permissão de localização necessária.';
      case 'storage':
        return 'Permissão de armazenamento necessária.';
      default:
        return 'Permissão necessária para continuar.';
    }
  }
}

/// Erro desconhecido
class UnknownError extends AppError {
  const UnknownError({
    required super.message,
    super.code,
    super.originalError,
    super.stackTrace,
  }) : super(type: AppErrorType.unknown);

  @override
  String get userMessage => 'Erro inesperado. Tente novamente.';
}

/// Utilitário para criar erros a partir de exceções
class ErrorFactory {
  static AppError fromException(exception, [StackTrace? stackTrace]) {
    if (exception is AppError) {
      return exception;
    }

    // Log do erro original em modo debug
    if (kDebugMode) {
      print('ErrorFactory.fromException: $exception');
      if (stackTrace != null) {
        print('StackTrace: $stackTrace');
      }
    }

    // Mapear exceções conhecidas
    if (exception.toString().contains('SocketException') ||
        exception.toString().contains('HandshakeException')) {
      return NetworkError(
        message: 'Network error',
        code: 'connection_failed',
        originalError: exception,
        stackTrace: stackTrace,
      );
    }

    if (exception.toString().contains('TimeoutException')) {
      return TimeoutError(
        message: 'Request timeout',
        code: 'timeout',
        originalError: exception,
        stackTrace: stackTrace,
      );
    }

    if (exception.toString().contains('FormatException')) {
      return ValidationError(
        message: 'Invalid data format',
        code: 'format_error',
        originalError: exception,
        stackTrace: stackTrace,
      );
    }

    // Erro genérico
    return UnknownError(
      message: exception.toString(),
      originalError: exception,
      stackTrace: stackTrace,
    );
  }

  static AppError fromHttpStatus(int statusCode, String message) {
    switch (statusCode) {
      case 400:
        return ValidationError(message: message, code: 'bad_request');
      case 401:
        return AuthenticationError(message: message, code: 'unauthorized');
      case 403:
        return AuthorizationError(message: message, code: 'forbidden');
      case 404:
        return NotFoundError(message: message, code: 'not_found');
      case 408:
        return TimeoutError(message: message, code: 'request_timeout');
      case 500:
      case 502:
      case 503:
      case 504:
        return ServerError(message: message, code: statusCode.toString());
      default:
        return UnknownError(message: message, code: statusCode.toString());
    }
  }
}