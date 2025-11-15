enum UserRole { admin, operator, carrier, driver, passenger }

UserRole? parseRole(String? r) {
  if (r == null) return null;
  final v = r.trim().toLowerCase();
  switch (v) {
    case 'admin':
    case 'administrador':
      return UserRole.admin;
    case 'operator':
    case 'operador':
      return UserRole.operator;
    case 'carrier':
    case 'transportadora':
      return UserRole.carrier;
    case 'driver':
    case 'motorista':
      return UserRole.driver;
    case 'passenger':
    case 'passageiro':
      return UserRole.passenger;
    default:
      return null;
  }
}
