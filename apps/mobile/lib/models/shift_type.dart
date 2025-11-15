// lib/models/shift_type.dart

enum ShiftType {
  morning('Manha'),
  afternoon('Tarde'),
  night('Noite'),
  fullDay('Dia Completo'),
  weekend('Fim de Semana');

  const ShiftType(this.displayName);

  final String displayName;

  static ShiftType fromString(String value) {
    switch (value.toLowerCase()) {
      case 'morning':
      case 'manha':
        return ShiftType.morning;
      case 'afternoon':
      case 'tarde':
        return ShiftType.afternoon;
      case 'night':
      case 'noite':
        return ShiftType.night;
      case 'full_day':
      case 'dia completo':
        return ShiftType.fullDay;
      case 'weekend':
      case 'fim de semana':
        return ShiftType.weekend;
      default:
        return ShiftType.morning;
    }
  }

  String toJson() => name;
}
