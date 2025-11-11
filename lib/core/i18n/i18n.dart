import 'package:flutter/widgets.dart';

/// Serviço mínimo de i18n para centralizar acesso por chave.
/// Integra com AppLocalizations se disponível, caso contrário retorna fallback.
class I18n {
  static const Map<String, String> _fallback = {
    // Vehicles
    'vehicles.create.success': 'Veículo criado com sucesso!',
    'vehicles.title': 'Veículos',
    'vehicles.status.changed': 'Status alterado para {status}',
    'vehicles.save.error': 'Erro ao salvar veículo: {message}',
    // Passenger
    'passenger.incident.success': 'Incidente reportado com sucesso',
    'common.retry': 'Tentar novamente',
    'common.ok': 'OK',
    'common.cancel': 'Cancelar',
    'common.undo': 'Desfazer',
    'common.cpf': 'CPF',
    'common.cpf.hint': '000.000.000-00',
    'common.password': 'Senha',
    'common.yes': 'Sim',
    'common.no': 'Não',
    // Driver Trip
    'driver.trip.start.success': 'Viagem iniciada e rastreamento ativo',
    'driver.trip.complete.success': 'Viagem concluída',
    // Drivers
    'drivers.status.updated': 'Status do motorista atualizado para {statusName}',
    'drivers.delete.success': 'Motorista "{driverName}" excluído com sucesso',
    // Routes
    'routes.title': 'Rotas',
    'routes.action.new': 'Nova Rota',
    'routes.action.start': 'Iniciar Rota',
    'routes.action.cancel': 'Cancelar Rota',
    'routes.action.duplicate': 'Duplicar Rota',
    'routes.action.delete': 'Excluir Rota',
    'routes.tabs.overview': 'Visão Geral',
    'routes.tabs.stops': 'Paradas',
    'routes.search.hint': 'Buscar rotas...',
    'routes.edit.title': 'Editar Rota',
    'routes.cancel.title': 'Cancelar Rota',
    'routes.cancel.prompt': 'Tem certeza que deseja cancelar a rota "{name}"?',
    'routes.cancel.confirm': 'Sim, Cancelar',
    'routes.delete.title': 'Excluir Rota',
    'routes.delete.prompt': 'Tem certeza que deseja excluir esta rota? Esta ação não pode ser desfeita.',
    'routes.copy.suffix': ' (Cópia)',
    'routes.generate.success': 'Rota gerada automaticamente com sucesso',
    'routes.stops.required': 'Adicione pelo menos uma parada à rota',
    'routes.update.success': 'Rota atualizada com sucesso',
    'routes.create.success': 'Rota criada com sucesso',
    'routes.generate.auto': 'Gerar Automaticamente',
    // Auth
    'auth.logout.error': 'Falha ao fazer logout',
    'auth.login.welcome': 'Bem-vindo, {name}!',
    'auth.login.error': 'Erro de login: {message}',
    'auth.login.unexpected': 'Erro inesperado: {message}',
    'driver.login.error': 'Falha ao autenticar motorista: {message}',
    'passenger.login.error': 'Falha ao autenticar passageiro: {message}',
    'auth.login.email.label': 'E-mail',
    'auth.login.email.hint': 'Digite seu e-mail',
    'auth.login.email.required': 'Por favor, digite seu e-mail',
    'auth.login.email.invalid': 'Por favor, digite um e-mail válido',
    'auth.login.password.label': 'Senha',
    'auth.login.password.hint': 'Digite sua senha',
    'auth.login.password.required': 'Por favor, digite sua senha',
    'auth.login.password.min_length': 'A senha deve ter pelo menos {min} caracteres',
    'auth.login.submit': 'Entrar',
    'driver.app.title': 'App do Motorista',
    'passenger.app.title': 'App do Passageiro',
    'validation.required.cpf': 'Digite seu CPF',
    'validation.required.password': 'Digite sua senha',
    'common.delete': 'Excluir',
    // Mapa
    'mapa.contact.soon': 'Funcionalidade de contato será implementada',
    'mapa.stop.title': '{icon} {name}',
    'mapa.stop.eta': 'Chegada estimada: {eta}',
    // Route actions
    'routes.start.success': 'Rota "{name}" iniciada com sucesso',
    'routes.cancel.success': 'Rota "{name}" cancelada',
    'routes.start.error': 'Erro ao iniciar rota: {message}',
    'routes.cancel.error': 'Erro ao cancelar rota: {message}',
    'routes.delete.success': 'Rota excluída com sucesso',
    'routes.delete.error': 'Erro ao excluir rota: {message}',
    'routes.tabs.history': 'Histórico',
  };

  static String t(BuildContext context, String key, {Map<String, String>? params}) {
    // Se no futuro houver AppLocalizations, integrar aqui:
    // final loc = AppLocalizations.of(context);
    // final text = loc?.translate(key) ?? _fallback[key] ?? key;
    final text = _fallback[key] ?? key;
    if (params == null || params.isEmpty) return text;
    var out = text;
    params.forEach((k, v) => out = out.replaceAll('{$k}', v));
    return out;
  }
}
