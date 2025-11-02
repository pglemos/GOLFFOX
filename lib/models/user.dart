// lib/models/user.dart
import 'package:flutter/foundation.dart';
import 'package:characters/characters.dart';

typedef Json = Map<String, dynamic>;

@immutable
class User {
  final String id;
  final String email;
  final String name;

  /// Valores canonicos: operator | carrier | driver | passenger
  final String role;
  final String? companyId;
  final String? carrierId;
  final DateTime createdAt;
  final DateTime updatedAt;

  const User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.companyId,
    this.carrierId,
    required this.createdAt,
    required this.updatedAt,
  })  : assert(id != ''),
        assert(email != ''),
        assert(role != '');

  /* ------------------------- SERIALIZACAO (DB / snake_case) ------------------------- */

  Map<String, dynamic> toJson() => <String, dynamic>{
        UserFields.id: id,
        UserFields.email: email,
        UserFields.name: name,
        UserFields.role: role,
        UserFields.companyId: companyId,
        UserFields.carrierId: carrierId,
        UserFields.createdAt: createdAt.toIso8601String(),
        UserFields.updatedAt: updatedAt.toIso8601String(),
      };

  factory User.fromJson(Map<String, dynamic> json) {
    final id = _asString(json[UserFields.id]);
    final email = _asString(json[UserFields.email]);
    final name = _asString(json[UserFields.name]);

    if (id == null || id.isEmpty) {
      throw ArgumentError('User ID cannot be null or empty');
    }
    if (email == null || email.isEmpty) {
      throw ArgumentError('User email cannot be null or empty');
    }
    if (name == null || name.isEmpty) {
      throw ArgumentError('User name cannot be null or empty');
    }

    return User(
      id: id,
      email: email,
      name: name,
      role: _normalizeRole(_asString(json[UserFields.role]) ?? ''),
      companyId: _asString(json[UserFields.companyId]),
      carrierId: _asString(json[UserFields.carrierId]),
      createdAt: _asDateTime(json[UserFields.createdAt]) ?? DateTime.now(),
      updatedAt: _asDateTime(json[UserFields.updatedAt]) ?? DateTime.now(),
    );
  }

  /* ------------------------- SERIALIZACAO (App / camelCase) ------------------------- */

  Map<String, dynamic> toAppJson() => <String, dynamic>{
        'id': id,
        'email': email,
        'name': name,
        'role': role,
        'companyId': companyId,
        'carrierId': carrierId,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  factory User.fromAppJson(Map<String, dynamic> json) {
    final id = _asString(json['id']);
    final email = _asString(json['email']);
    final name = _asString(json['name']);

    if (id == null || id.isEmpty) {
      throw ArgumentError('User ID cannot be null or empty');
    }
    if (email == null || email.isEmpty) {
      throw ArgumentError('User email cannot be null or empty');
    }
    if (name == null || name.isEmpty) {
      throw ArgumentError('User name cannot be null or empty');
    }

    return User(
      id: id,
      email: email,
      name: name,
      role: _normalizeRole(_asString(json['role']) ?? ''),
      companyId: _asString(json['companyId']),
      carrierId: _asString(json['carrierId']),
      createdAt: _asDateTime(json['createdAt']) ?? DateTime.now(),
      updatedAt: _asDateTime(json['updatedAt']) ?? DateTime.now(),
    );
  }

  /* ------------------------- Helpers p/ Supabase (INSERT/UPDATE) ------------------------- */

  Map<String, dynamic> toDbInsert() => <String, dynamic>{
        UserFields.id: id,
        UserFields.email: email,
        UserFields.name: name,
        UserFields.role: role,
        if (companyId != null) UserFields.companyId: companyId,
        if (carrierId != null) UserFields.carrierId: carrierId,
        UserFields.createdAt: createdAt.toIso8601String(),
        UserFields.updatedAt: updatedAt.toIso8601String(),
      };

  Map<String, dynamic> toDbUpdate() => <String, dynamic>{
        UserFields.email: email,
        UserFields.name: name,
        UserFields.role: role,
        UserFields.companyId: companyId,
        UserFields.carrierId: carrierId,
        UserFields.updatedAt: updatedAt.toIso8601String(),
      };

  /* --------------------------------- UTILITARIOS --------------------------------- */

  User copyWith({
    String? id,
    String? email,
    String? name,
    String? role,
    String? companyId,
    String? carrierId,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) =>
      User(
        id: id ?? this.id,
        email: email ?? this.email,
        name: name ?? this.name,
        role: role != null ? _normalizeRole(role) : this.role,
        companyId: companyId ?? this.companyId,
        carrierId: carrierId ?? this.carrierId,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );

  /// Permite LIMPAR relacionamentos opcionais (company/carrier)
  User copyWithNullable({
    bool clearCompany = false,
    bool clearCarrier = false,
    String? companyId,
    String? carrierId,
    String? name,
    String? role,
    DateTime? updatedAt,
  }) =>
      User(
        id: id,
        email: email,
        name: name ?? this.name,
        role: role != null ? _normalizeRole(role) : this.role,
        companyId: clearCompany ? null : (companyId ?? this.companyId),
        carrierId: clearCarrier ? null : (carrierId ?? this.carrierId),
        createdAt: createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );

  /// Predicados de papel
  bool get isOperator => role == UserRoles.operator;
  bool get isCarrier => role == UserRoles.carrier;
  bool get isDriver => role == UserRoles.driver;
  bool get isPassenger => role == UserRoles.passenger;

  bool get hasCompany => (companyId ?? '').isNotEmpty;
  bool get hasCarrier => (carrierId ?? '').isNotEmpty;

  /// Exibe nome bonito: se nome vazio, usa parte do email
  String get displayName {
    final trimmed = name.trim();
    if (trimmed.isNotEmpty) return trimmed;
    final at = email.indexOf('@');
    return at > 0 ? email.substring(0, at) : email;
  }

  /// Iniciais (ex.: "Joao Admin" -> "JA")
  String get initials {
    final parts = displayName
        .trim()
        .split(RegExp(r'\s+'))
        .where((e) => e.isNotEmpty)
        .toList();
    if (parts.isEmpty) return '';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts[0].characters.first + parts[1].characters.first)
        .toUpperCase();
  }

  /// E-mail mascarado: jo***@dominio.com
  String get maskedEmail {
    final at = email.indexOf('@');
    if (at <= 1) return email;
    final local = email.substring(0, at);
    final domain = email.substring(at);
    final visible = local.substring(0, 2);
    return '$visible${'*' * (local.length - 2)}$domain';
  }

  /// Validacao leve para UX
  List<String> validate() {
    final errs = <String>[];
    if (id.trim().isEmpty) errs.add('id e obrigatorio');
    if (!_looksLikeEmail(email)) errs.add('email invalido');
    if (displayName.trim().isEmpty) errs.add('name e obrigatorio');
    if (!UserRoles.all.contains(role)) errs.add('role invalido: $role');
    return errs;
  }

  /// Constroi um User "rascunho" a partir do Supabase Auth (util pos-signup)
  static User fromSupabaseAuth({
    required String authUserId,
    required String email,
    String? name,
    String role = UserRoles.passenger,
    String? companyId,
    String? carrierId,
  }) {
    final now = DateTime.now();
    return User(
      id: authUserId,
      email: email,
      name: (name ?? '').trim().isEmpty ? email : name!.trim(),
      role: _normalizeRole(role),
      companyId: companyId,
      carrierId: carrierId,
      createdAt: now,
      updatedAt: now,
    );
  }

  /* --------------------------------- IGUALDADE --------------------------------- */

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is User && runtimeType == other.runtimeType && id == other.id);

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'User(id: $id, email: $email, name: $name, role: $role)';

  /* --------------------------------- HELPERS --------------------------------- */

  static String? _asString(dynamic v) => v?.toString();

  static DateTime? _asDateTime(dynamic v) {
    if (v == null) return null;
    if (v is DateTime) return v;
    if (v is int) {
      final isSeconds = v < 100000000000;
      return DateTime.fromMillisecondsSinceEpoch(isSeconds ? v * 1000 : v,
              isUtc: true)
          .toLocal();
    }
    if (v is String && v.isNotEmpty) return DateTime.parse(v);
    return null;
  }

  static String _normalizeRole(String r) {
    final x = r.trim().toLowerCase();
    if (x == 'operator' || x == 'ops') return UserRoles.operator;
    if (x == 'admin' || x == 'administrador')
      return UserRoles.operator; // Admin é tratado como operator
    if (x == 'carrier' || x == 'transportadora') return UserRoles.carrier;
    if (x == 'driver' || x == 'motorista') return UserRoles.driver;
    if (x == 'passenger' || x == 'passageiro') return UserRoles.passenger;
    return x; // mantem se ja for um dos validos ou desconhecido (para inspecao)
  }

  static bool _looksLikeEmail(String e) {
    final re = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    return re.hasMatch(e);
  }
}

/* ------------------------------ Campos/Constantes ------------------------------ */

abstract class UserFields {
  static const String id = 'id';
  static const String email = 'email';
  static const String name = 'name';
  static const String role = 'role';
  static const String companyId = 'company_id';
  static const String carrierId = 'carrier_id';
  static const String createdAt = 'created_at';
  static const String updatedAt = 'updated_at';
}

abstract class UserRoles {
  static const String operator = 'operator';
  static const String carrier = 'carrier';
  static const String driver = 'driver';
  static const String passenger = 'passenger';

  static const List<String> all = [operator, carrier, driver, passenger];
}
