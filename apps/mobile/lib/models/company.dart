// lib/models/company.dart
import 'package:characters/characters.dart';
import 'package:flutter/foundation.dart';

typedef Json = Map<String, dynamic>;

@immutable
class Company {

  const Company({
    required this.id,
    required this.name,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
    this.address,
    this.phone,
    this.email,
  })  : assert(id != '', 'id nao pode ser vazio'),
        assert(name != '', 'name nao pode ser vazio');

  /// Mantem compatibilidade: carrega de snake_case (padrao Supabase)
  factory Company.fromJson(Map<String, dynamic> json) => Company(
        id: _asString(json[CompanyFields.id])!,
        name: _asString(json[CompanyFields.name])!,
        address: _asString(json[CompanyFields.address]),
        phone: _asString(json[CompanyFields.phone]),
        email: _asString(json[CompanyFields.email]),
        isActive: _asBool(json[CompanyFields.isActive], defaultValue: true),
        createdAt: _asDateTime(json[CompanyFields.createdAt])!,
        updatedAt: _asDateTime(json[CompanyFields.updatedAt])!,
      );

  factory Company.fromAppJson(Map<String, dynamic> json) => Company(
        id: _asString(json['id'])!,
        name: _asString(json['name'])!,
        address: _asString(json['address']),
        phone: _asString(json['phone']),
        email: _asString(json['email']),
        isActive: _asBool(json['isActive'], defaultValue: true),
        createdAt: _asDateTime(json['createdAt'])!,
        updatedAt: _asDateTime(json['updatedAt'])!,
      );
  final String id;
  final String name;
  final String? address;
  final String? phone;
  final String? email;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  /* ------------------------- SERIALIZACAO (DB / snake_case) ------------------------- */

  /// Mantem compatibilidade: mapeia para snake_case (padrao Supabase)
  Map<String, dynamic> toJson() => <String, dynamic>{
        CompanyFields.id: id,
        CompanyFields.name: name,
        CompanyFields.address: address,
        CompanyFields.phone: phone,
        CompanyFields.email: email,
        CompanyFields.isActive: isActive,
        CompanyFields.createdAt: createdAt.toIso8601String(),
        CompanyFields.updatedAt: updatedAt.toIso8601String(),
      };

  /* ------------------------- SERIALIZACAO (App / camelCase) ------------------------- */

  Map<String, dynamic> toAppJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'address': address,
        'phone': phone,
        'email': email,
        'isActive': isActive,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  /* ------------------------- Helpers p/ Supabase (INSERT/UPDATE) ------------------------- */

  /// Para INSERT: inclui timestamps se nao vierem de fora.
  Map<String, dynamic> toDbInsert() => <String, dynamic>{
        CompanyFields.id: id,
        CompanyFields.name: name,
        if (address != null) CompanyFields.address: address,
        if (phone != null) CompanyFields.phone: phone,
        if (email != null) CompanyFields.email: email,
        CompanyFields.isActive: isActive,
        CompanyFields.createdAt: createdAt.toIso8601String(),
        CompanyFields.updatedAt: updatedAt.toIso8601String(),
      };

  /// Para UPDATE parcial: so manda campos nao nulos.
  Map<String, dynamic> toDbUpdate() => <String, dynamic>{
        CompanyFields.name: name,
        if (address != null) CompanyFields.address: address,
        if (phone != null) CompanyFields.phone: phone,
        if (email != null) CompanyFields.email: email,
        CompanyFields.isActive: isActive,
        CompanyFields.updatedAt: updatedAt.toIso8601String(),
      };

  /* --------------------------------- UTILITARIOS --------------------------------- */

  Company copyWith({
    String? id,
    String? name,
    String? address,
    String? phone,
    String? email,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) =>
      Company(
        id: id ?? this.id,
        name: name ?? this.name,
        address: address ?? this.address,
        phone: phone ?? this.phone,
        email: email ?? this.email,
        isActive: isActive ?? this.isActive,
        createdAt: createdAt ?? this.createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );

  /// Permite **limpar** (setar `null`) os campos opcionais.
  Company copyWithNullable({
    bool clearAddress = false,
    bool clearPhone = false,
    bool clearEmail = false,
    String? address,
    String? phone,
    String? email,
    String? name,
    bool? isActive,
    DateTime? updatedAt,
  }) =>
      Company(
        id: id,
        name: name ?? this.name,
        address: clearAddress ? null : (address ?? this.address),
        phone: clearPhone ? null : (phone ?? this.phone),
        email: clearEmail ? null : (email ?? this.email),
        isActive: isActive ?? this.isActive,
        createdAt: createdAt,
        updatedAt: updatedAt ?? this.updatedAt,
      );

  /// Atualiza o `updatedAt` para agora.
  Company touch() => copyWith(updatedAt: DateTime.now());

  Company activate() => copyWith(isActive: true).touch();
  Company deactivate() => copyWith(isActive: false).touch();

  bool get hasContact =>
      (phone?.trim().isNotEmpty ?? false) ||
      (email?.trim().isNotEmpty ?? false);

  /// Ex.: "Gol" + "Fox" -> "GF"
  String get initials {
    final parts =
        name.trim().split(RegExp(r'\s+')).where((e) => e.isNotEmpty).toList();
    if (parts.isEmpty) return '';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts[0].characters.first + parts[1].characters.first)
        .toUpperCase();
  }

  /// Validacao leve. Retorna lista de mensagens se houver problemas.
  List<String> validate() {
    final errors = <String>[];
    if (id.trim().isEmpty) errors.add('id e obrigatorio');
    if (name.trim().isEmpty) errors.add('name e obrigatorio');
    if (email != null && email!.isNotEmpty && !_looksLikeEmail(email!)) {
      errors.add('email invalido');
    }
    if (phone != null && phone!.isNotEmpty && phone!.length < 8) {
      errors.add('phone muito curto');
    }
    return errors;
  }

  /* --------------------------------- IGUALDADE --------------------------------- */

  /// Mantem semantica atual: igualdade por `id` (identidade da entidade).
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Company && runtimeType == other.runtimeType && id == other.id);

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() =>
      'Company(id: $id, name: $name, active: $isActive, updatedAt: ${updatedAt.toIso8601String()})';

  /* --------------------------------- HELPERS --------------------------------- */

  static String? _asString(Object? v) => v?.toString();

  static bool _asBool(Object? v, {bool defaultValue = false}) {
    if (v is bool) return v;
    if (v is num) return v != 0;
    if (v is String) {
      final s = v.toLowerCase().trim();
      if (s == 'true' || s == '1' || s == 't' || s == 'yes' || s == 'y') {
        return true;
      }
      if (s == 'false' || s == '0' || s == 'f' || s == 'no' || s == 'n') {
        return false;
      }
    }
    return defaultValue;
  }

  static DateTime? _asDateTime(Object? v) {
    if (v == null) return null;
    if (v is DateTime) return v;
    if (v is int) {
      return DateTime.fromMillisecondsSinceEpoch(v, isUtc: true).toLocal();
    }
    if (v is String && v.isNotEmpty) return DateTime.parse(v);
    return null;
  }

  static bool _looksLikeEmail(String e) {
    // simples e rapido (evita dependencias)
    final re = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    return re.hasMatch(e);
  }
}

/* ------------------------------ Campos/Constantes ------------------------------ */

abstract class CompanyFields {
  static const String id = 'id';
  static const String name = 'name';
  static const String address = 'address';
  static const String phone = 'phone';
  static const String email = 'email';
  static const String isActive = 'is_active';
  static const String createdAt = 'created_at';
  static const String updatedAt = 'updated_at';
}
