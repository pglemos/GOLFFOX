/// Enum de roles do usuário - PT-BR
/// Modelo de Domínio GolfFox:
/// - admin: Administrador GolfFox
/// - empresa: Gestor/Admin da Empresa Contratante (antigo operator)
/// - operador: Gestor da Transportadora (antigo carrier)
/// - motorista: Condutor dos veículos (antigo driver)
/// - passageiro: Colaborador das empresas (antigo passenger)
enum UserRole { admin, empresa, operador, motorista, passageiro }

UserRole? parseRole(String? r) {
  if (r == null) return null;
  final v = r.trim().toLowerCase();
  switch (v) {
    // Admin
    case 'admin':
    case 'administrador':
      return UserRole.admin;
    // Empresa Contratante (PT-BR + compatibilidade inglês)
    case 'empresa':
    case 'operator': // Compatibilidade com role antiga
    case 'operador_empresa':
      return UserRole.empresa;
    // Transportadora / Operador (PT-BR + compatibilidade inglês)
    case 'operador':
    case 'carrier': // Compatibilidade com role antiga
    case 'transportadora':
      return UserRole.operador;
    // Motorista
    case 'motorista':
    case 'driver': // Compatibilidade com role antiga
      return UserRole.motorista;
    // Passageiro
    case 'passageiro':
    case 'passenger': // Compatibilidade com role antiga
      return UserRole.passageiro;
    default:
      return null;
  }
}
