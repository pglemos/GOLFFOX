// lib/models/vehicle_situation.dart

enum VehicleSituation {
  active('Ativo'),
  inactive('Inativo'),
  maintenance('Manutencao'),
  outOfService('Fora de Servico'),
  emergency('Emergencia');

  const VehicleSituation(this.displayName);

  final String displayName;

  static VehicleSituation fromString(String value) {
    switch (value.toLowerCase()) {
      case 'active':
      case 'ativo':
        return VehicleSituation.active;
      case 'inactive':
      case 'inativo':
        return VehicleSituation.inactive;
      case 'maintenance':
      case 'manutencao':
        return VehicleSituation.maintenance;
      case 'out_of_service':
      case 'fora de servico':
        return VehicleSituation.outOfService;
      case 'emergency':
      case 'emergencia':
        return VehicleSituation.emergency;
      default:
        return VehicleSituation.inactive;
    }
  }

  String toJson() => name;
}
