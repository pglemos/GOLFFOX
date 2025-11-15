# Módulo de Motoristas

Este módulo gerencia todas as funcionalidades relacionadas aos motoristas no sistema GOLFFOX.

## Estrutura do Módulo

### Modelos de Dados
- **Driver**: Modelo principal do motorista com informações pessoais, status, licença, certificações, estatísticas e preferências
- **DriverStatus**: Enum para status do motorista (ativo, inativo, suspenso, em viagem)
- **LicenseCategory**: Enum para categorias de habilitação (A, B, C, D, E)
- **DriverLicense**: Informações da habilitação com validação de vencimento
- **DriverCertification**: Certificações do motorista com validação de vencimento
- **DriverRating**: Sistema de avaliações
- **DriverStats**: Estatísticas do motorista (viagens, distância, tempo, avaliações)
- **TripExtended**: Modelo estendido de viagem para histórico

### Serviços
- **DriverService**: Serviço principal para gerenciamento de motoristas usando StateNotifier
  - CRUD completo de motoristas
  - Sistema de filtros avançados
  - Estatísticas da frota
  - Dados simulados para desenvolvimento

### Providers (Riverpod)
- **driverServiceProvider**: Provider principal do serviço
- **driverProvider**: Provider para motorista específico
- **driversListProvider**: Lista de motoristas filtrada
- **driverStatsProvider**: Estatísticas da frota
- **onlineDriversProvider**: Motoristas online
- **availableDriversProvider**: Motoristas disponíveis
- **topDriversProvider**: Top motoristas por avaliação
- E muitos outros providers especializados

### Páginas
1. **DriversPage**: Página principal com listagem, busca, filtros e estatísticas
2. **CreateDriverPage**: Página para criar/editar motoristas com formulário em etapas
3. **DriverDetailsPage**: Página de detalhes com abas para informações, avaliações e histórico

### Widgets Especializados

#### Cards
- **DriverCard**: Card resumido do motorista com informações principais e alertas
- **DriverStatsCard**: Card com estatísticas da frota
- **DriverInfoCard**: Card detalhado com todas as informações do motorista
- **DriverRatingCard**: Card com avaliações e distribuição de estrelas

#### Filtros e Histórico
- **DriverFilters**: Widget de filtros avançados (status, licença, alertas, etc.)
- **DriverTripHistory**: Widget de histórico de viagens com filtros e estatísticas

### Rotas
- `/drivers` - Listagem de motoristas
- `/drivers/create` - Criar novo motorista
- `/drivers/edit/:id` - Editar motorista
- `/drivers/details/:id` - Detalhes do motorista

## Funcionalidades Principais

### Gestão de Motoristas
- ✅ Cadastro completo com informações pessoais
- ✅ Gerenciamento de status (ativo, inativo, suspenso, em viagem)
- ✅ Controle de disponibilidade e status online
- ✅ Sistema de tags para categorização

### Documentação
- ✅ Gerenciamento de habilitação com validação de vencimento
- ✅ Sistema de certificações com alertas de vencimento
- ✅ Alertas automáticos para documentos próximos ao vencimento

### Avaliações e Estatísticas
- ✅ Sistema completo de avaliações
- ✅ Estatísticas detalhadas (viagens, distância, tempo, ganhos)
- ✅ Distribuição de avaliações por estrelas
- ✅ Ranking de motoristas

### Histórico de Viagens
- ✅ Histórico completo de viagens
- ✅ Filtros por status (todas, concluídas, canceladas, em andamento)
- ✅ Estatísticas rápidas do histórico
- ✅ Detalhes de cada viagem (origem, destino, tarifa, avaliação)

### Filtros Avançados
- ✅ Filtro por status do motorista
- ✅ Filtro por categoria de habilitação
- ✅ Filtro por alertas (documentos/certificações vencendo)
- ✅ Filtro por status online
- ✅ Filtro por avaliação mínima
- ✅ Filtro por número mínimo de viagens

### Busca e Navegação
- ✅ Busca por nome, email ou telefone
- ✅ Navegação intuitiva entre páginas
- ✅ Estados de carregamento, erro e vazio

## Como Usar

### Importação
```dart
import 'package:golffox/features/drivers/drivers.dart';
```

### Uso Básico
```dart
// Em uma página que usa Riverpod
class MyPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final drivers = ref.watch(driversListProvider);
    final stats = ref.watch(driverStatsProvider);
    
    return Column(
      children: [
        DriverStatsCard(),
        Expanded(
          child: ListView.builder(
            itemCount: drivers.length,
            itemBuilder: (context, index) {
              return DriverCard(driver: drivers[index]);
            },
          ),
        ),
      ],
    );
  }
}
```

### Navegação
```dart
// Navegar para lista de motoristas
DriverRoutes.goToDrivers(context);

// Navegar para criar motorista
DriverRoutes.pushCreateDriver(context);

// Navegar para detalhes
DriverRoutes.pushDriverDetails(context, driverId);
```

### Filtros
```dart
// Aplicar filtros
final service = ref.read(driverServiceProvider.notifier);
service.applyFilters(DriverFilters(
  status: DriverStatus.active,
  isOnline: true,
  minRating: 4.0,
));
```

## Estados e Tratamento de Erros

O módulo possui tratamento completo de estados:
- **Carregamento**: Indicadores visuais durante operações
- **Erro**: Mensagens de erro amigáveis
- **Vazio**: Estados vazios com ações sugeridas
- **Sucesso**: Feedback visual para operações bem-sucedidas

## Próximos Passos

- [ ] Integração com API real
- [ ] Testes unitários e de widget
- [ ] Testes de integração
- [ ] Otimizações de performance
- [ ] Funcionalidades offline
- [ ] Sincronização em tempo real

## Dependências

- `flutter_riverpod`: Gerenciamento de estado
- `flutter_animate`: Animações
- `intl`: Formatação de datas e números
- `go_router`: Navegação (se usado no projeto)

## Arquitetura

O módulo segue os princípios de Clean Architecture:
- **Presentation Layer**: Páginas e widgets
- **Domain Layer**: Modelos e regras de negócio
- **Data Layer**: Serviços e providers

Utiliza o padrão Repository através do DriverService e gerenciamento de estado reativo com Riverpod.