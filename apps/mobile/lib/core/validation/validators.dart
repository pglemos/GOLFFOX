import 'dart:io';

/// Sistema de validação centralizado
class Validators {
  // Expressões regulares comuns
  static final RegExp _emailRegex = RegExp(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
  );

  static final RegExp _phoneRegex = RegExp(
    r'^\+?[\d\s\-\(\)]{10,}$',
  );

  static final RegExp _passwordRegex = RegExp(
    r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$',
  );

  static final RegExp _nameRegex = RegExp(
    r'^[a-zA-ZÀ-ÿ\s]{2,50}$',
  );

  static final RegExp _plateRegex = RegExp(
    r'^[A-Z]{3}[0-9][A-Z][0-9]{2}$|^[A-Z]{3}[0-9]{4}$',
  );

  /// Validação de email
  static String? email(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email é obrigatório';
    }

    if (!_emailRegex.hasMatch(value.trim())) {
      return 'Email inválido';
    }

    return null;
  }

  /// Validação de senha
  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Senha é obrigatória';
    }

    if (value.length < 8) {
      return 'Senha deve ter pelo menos 8 caracteres';
    }

    if (!_passwordRegex.hasMatch(value)) {
      return 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial';
    }

    return null;
  }

  /// Validação de confirmação de senha
  static String? confirmPassword(String? value, String? originalPassword) {
    if (value == null || value.isEmpty) {
      return 'Confirmação de senha é obrigatória';
    }

    if (value != originalPassword) {
      return 'Senhas não coincidem';
    }

    return null;
  }

  /// Validação de nome
  static String? name(String? value) {
    if (value == null || value.isEmpty) {
      return 'Nome é obrigatório';
    }

    if (value.trim().length < 2) {
      return 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!_nameRegex.hasMatch(value.trim())) {
      return 'Nome contém caracteres inválidos';
    }

    return null;
  }

  /// Validação de telefone
  static String? phone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Telefone é obrigatório';
    }

    final cleanPhone = value.replaceAll(RegExp(r'[\s\-\(\)]'), '');
    
    if (cleanPhone.length < 10) {
      return 'Telefone deve ter pelo menos 10 dígitos';
    }

    if (!_phoneRegex.hasMatch(value)) {
      return 'Formato de telefone inválido';
    }

    return null;
  }

  /// Validação de campo obrigatório
  static String? required(String? value, [String fieldName = 'Campo']) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName é obrigatório';
    }
    return null;
  }

  /// Validação de comprimento mínimo
  static String? minLength(String? value, int minLength, [String fieldName = 'Campo']) {
    if (value == null || value.trim().length < minLength) {
      return '$fieldName deve ter pelo menos $minLength caracteres';
    }
    return null;
  }

  /// Validação de comprimento máximo
  static String? maxLength(String? value, int maxLength, [String fieldName = 'Campo']) {
    if (value != null && value.trim().length > maxLength) {
      return '$fieldName deve ter no máximo $maxLength caracteres';
    }
    return null;
  }

  /// Validação de número
  static String? number(String? value, [String fieldName = 'Campo']) {
    if (value == null || value.isEmpty) {
      return '$fieldName é obrigatório';
    }

    if (double.tryParse(value) == null) {
      return '$fieldName deve ser um número válido';
    }

    return null;
  }

  /// Validação de número inteiro
  static String? integer(String? value, [String fieldName = 'Campo']) {
    if (value == null || value.isEmpty) {
      return '$fieldName é obrigatório';
    }

    if (int.tryParse(value) == null) {
      return '$fieldName deve ser um número inteiro válido';
    }

    return null;
  }

  /// Validação de placa de veículo
  static String? vehiclePlate(String? value) {
    if (value == null || value.isEmpty) {
      return 'Placa é obrigatória';
    }

    final cleanPlate = value.replaceAll(RegExp(r'[\s\-]'), '').toUpperCase();
    
    if (!_plateRegex.hasMatch(cleanPlate)) {
      return 'Formato de placa inválido (ex: ABC1234 ou ABC1D23)';
    }

    return null;
  }

  /// Validação de arquivo
  static String? file(File? file, {
    List<String>? allowedExtensions,
    int? maxSizeBytes,
  }) {
    if (file == null) {
      return 'Arquivo é obrigatório';
    }

    if (!file.existsSync()) {
      return 'Arquivo não encontrado';
    }

    // Validar extensão
    if (allowedExtensions != null && allowedExtensions.isNotEmpty) {
      final extension = file.path.split('.').last.toLowerCase();
      if (!allowedExtensions.contains(extension)) {
        return 'Tipo de arquivo não permitido. Permitidos: ${allowedExtensions.join(', ')}';
      }
    }

    // Validar tamanho
    if (maxSizeBytes != null) {
      final fileSize = file.lengthSync();
      if (fileSize > maxSizeBytes) {
        final maxSizeMB = (maxSizeBytes / (1024 * 1024)).toStringAsFixed(1);
        return 'Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB';
      }
    }

    return null;
  }

  /// Validação de URL
  static String? url(String? value, [String fieldName = 'URL']) {
    if (value == null || value.isEmpty) {
      return '$fieldName é obrigatória';
    }

    try {
      final uri = Uri.parse(value);
      if (!uri.hasScheme || (!uri.scheme.startsWith('http'))) {
        return '$fieldName deve ser uma URL válida';
      }
    } on FormatException {
      return '$fieldName deve ser uma URL válida';
    }

    return null;
  }

  /// Combinar múltiplos validadores
  static String? combine(String? value, List<String? Function(String?)> validators) {
    for (final validator in validators) {
      final result = validator(value);
      if (result != null) {
        return result;
      }
    }
    return null;
  }

  /// Validação condicional
  static String? conditional(
    String? value, {
    required bool condition,
    required String? Function(String?) validator,
  }) {
    if (!condition) return null;
    return validator(value);
  }
}
