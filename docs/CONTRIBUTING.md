# Guia de Contribuição - GolfFox

Obrigado por seu interesse em contribuir com o GolfFox! Este documento fornece diretrizes para contribuir com o projeto de forma efetiva e consistente.

## Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Processo de Desenvolvimento](#processo-de-desenvolvimento)
- [Padrões de Código](#padrões-de-código)
- [Testes](#testes)
- [Documentação](#documentação)
- [Pull Requests](#pull-requests)
- [Issues](#issues)
- [Versionamento](#versionamento)

## Código de Conduta

### Nosso Compromisso

Estamos comprometidos em fazer da participação neste projeto uma experiência livre de assédio para todos, independentemente da idade, tamanho corporal, deficiência visível ou invisível, etnia, características sexuais, identidade e expressão de gênero, nível de experiência, educação, status socioeconômico, nacionalidade, aparência pessoal, raça, religião ou identidade e orientação sexual.

### Padrões Esperados

Exemplos de comportamento que contribuem para um ambiente positivo:

- Usar linguagem acolhedora e inclusiva
- Respeitar diferentes pontos de vista e experiências
- Aceitar críticas construtivas graciosamente
- Focar no que é melhor para a comunidade
- Mostrar empatia com outros membros da comunidade

### Comportamentos Inaceitáveis

- Uso de linguagem ou imagens sexualizadas
- Trolling, comentários insultuosos/depreciativos e ataques pessoais ou políticos
- Assédio público ou privado
- Publicar informações privadas de outros sem permissão explícita
- Outras condutas que poderiam ser consideradas inadequadas em um ambiente profissional

## Como Contribuir

### Tipos de Contribuição

Valorizamos todos os tipos de contribuição:

1. **Código**: Novas funcionalidades, correções de bugs, melhorias de performance
2. **Documentação**: Melhorias na documentação, tutoriais, exemplos
3. **Testes**: Adição de testes, melhoria da cobertura de testes
4. **Design**: Melhorias na UI/UX, ícones, assets
5. **Tradução**: Localização para diferentes idiomas
6. **Relatórios de Bug**: Identificação e documentação de problemas
7. **Sugestões**: Ideias para novas funcionalidades ou melhorias

### Primeiros Passos

1. **Fork** o repositório
2. **Clone** seu fork localmente
3. **Configure** o ambiente de desenvolvimento
4. **Crie** uma branch para sua contribuição
5. **Faça** suas alterações
6. **Teste** suas alterações
7. **Commit** suas alterações
8. **Push** para seu fork
9. **Abra** um Pull Request

## Configuração do Ambiente

### Pré-requisitos

- **Flutter SDK**: Versão 3.0 ou superior
- **Dart SDK**: Versão 2.17 ou superior
- **Node.js**: 22.x ou superior
- **Git**: Para controle de versão
- **IDE**: VS Code, Android Studio ou IntelliJ IDEA
- **Emulador/Dispositivo**: Para testes

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/golffox.git
cd golffox

# 2. Instale as dependências
flutter pub get

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# 4. Execute os testes
flutter test

# 5. Execute a aplicação
flutter run
```

### Configuração do IDE

#### VS Code

Instale as extensões recomendadas:

```json
{
  "recommendations": [
    "dart-code.dart-code",
    "dart-code.flutter",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss"
  ]
}
```

#### Android Studio

1. Instale o plugin Flutter
2. Configure o SDK do Flutter
3. Configure o emulador Android

### Verificação da Configuração

```bash
# Verificar instalação do Flutter
flutter doctor

# Verificar dependências do projeto
flutter pub deps

# Executar análise estática
flutter analyze

# Executar testes
flutter test
```

## Processo de Desenvolvimento

### Workflow Git

Utilizamos o **Git Flow** simplificado:

```
main (produção)
├── develop (desenvolvimento)
    ├── feature/nova-funcionalidade
    ├── bugfix/correcao-bug
    ├── hotfix/correcao-urgente
    └── release/v1.2.0
```

### Branches

#### Tipos de Branch

- **main**: Código em produção
- **develop**: Código em desenvolvimento
- **feature/**: Novas funcionalidades
- **bugfix/**: Correções de bugs
- **hotfix/**: Correções urgentes
- **release/**: Preparação para release

#### Nomenclatura

```bash
# Funcionalidades
feature/add-route-sharing
feature/improve-user-profile

# Correções
bugfix/fix-route-calculation
bugfix/resolve-login-issue

# Hotfixes
hotfix/critical-security-patch

# Releases
release/v1.2.0
```

### Commits

#### Formato de Commit

Utilizamos o padrão **Conventional Commits**:

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé opcional]
```

#### Tipos de Commit

- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Documentação
- **style**: Formatação, ponto e vírgula ausente, etc.
- **refactor**: Refatoração de código
- **test**: Adição ou correção de testes
- **chore**: Tarefas de manutenção

#### Exemplos

```bash
# Funcionalidade
feat(routes): add route sharing functionality

# Correção
fix(auth): resolve login timeout issue

# Documentação
docs: update API documentation

# Refatoração
refactor(core): improve error handling structure

# Testes
test(routes): add unit tests for route calculation

# Manutenção
chore: update dependencies to latest versions
```

### Code Review

#### Checklist do Revisor

- [ ] O código segue os padrões estabelecidos?
- [ ] Os testes estão passando?
- [ ] A funcionalidade está bem documentada?
- [ ] Não há vazamentos de memória?
- [ ] A performance está adequada?
- [ ] A segurança foi considerada?
- [ ] A acessibilidade foi considerada?

#### Checklist do Autor

- [ ] Código testado localmente
- [ ] Testes unitários adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Análise estática passou
- [ ] Performance verificada
- [ ] Acessibilidade verificada

## Padrões de Código

### Linting

Configure o `analysis_options.yaml`:

```yaml
include: package:flutter_lints/flutter.yaml

analyzer:
  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"
  
linter:
  rules:
    # Estilo
    - prefer_const_constructors
    - prefer_const_literals_to_create_immutables
    - prefer_final_locals
    - prefer_single_quotes
    
    # Documentação
    - public_member_api_docs
    - comment_references
    
    # Segurança
    - avoid_web_libraries_in_flutter
    - secure_pubspec_urls
```

### Formatação

```bash
# Formatar código
dart format lib/ test/

# Verificar formatação
dart format --set-exit-if-changed lib/ test/
```

### Análise Estática

```bash
# Executar análise
flutter analyze

# Análise com métricas
dart run dart_code_metrics:metrics analyze lib/
```

## Testes

### Estrutura de Testes

```
test/
├── unit/                   # Testes unitários
│   ├── core/
│   ├── features/
│   └── shared/
├── widget/                 # Testes de widget
│   ├── pages/
│   └── widgets/
├── integration/            # Testes de integração
│   ├── flows/
│   └── scenarios/
└── helpers/                # Utilitários de teste
    ├── mocks/
    └── fixtures/
```

### Tipos de Teste

#### Testes Unitários

```dart
// test/unit/core/validation/validators_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:golffox/core/validation/validators.dart';

void main() {
  group('Validators', () {
    group('email', () {
      test('should return null for valid email', () {
        // Arrange
        const email = 'test@example.com';
        
        // Act
        final result = Validators.email(email);
        
        // Assert
        expect(result, isNull);
      });

      test('should return error message for invalid email', () {
        // Arrange
        const email = 'invalid-email';
        
        // Act
        final result = Validators.email(email);
        
        // Assert
        expect(result, isNotNull);
        expect(result, contains('email'));
      });
    });
  });
}
```

#### Testes de Widget

```dart
// test/widget/pages/route_details_page_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golffox/features/routes/presentation/pages/route_details_page.dart';

void main() {
  group('RouteDetailsPage', () {
    testWidgets('should display route information', (tester) async {
      // Arrange
      final route = Route(
        id: '1',
        name: 'Test Route',
        distance: 100,
      );

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: RouteDetailsPage(route: route),
        ),
      );

      // Assert
      expect(find.text('Test Route'), findsOneWidget);
      expect(find.text('100km'), findsOneWidget);
    });
  });
}
```

#### Testes de Integração

```dart
// test/integration/flows/route_creation_flow_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:golffox/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Route Creation Flow', () {
    testWidgets('should create route successfully', (tester) async {
      // Arrange
      app.main();
      await tester.pumpAndSettle();

      // Act
      await tester.tap(find.byIcon(Icons.add));
      await tester.pumpAndSettle();

      await tester.enterText(find.byKey(Key('route_name_field')), 'Test Route');
      await tester.enterText(find.byKey(Key('route_distance_field')), '100');

      await tester.tap(find.text('Save'));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('Route created successfully'), findsOneWidget);
    });
  });
}
```

### Cobertura de Testes

```bash
# Executar testes com cobertura
flutter test --coverage

# Gerar relatório HTML
genhtml coverage/lcov.info -o coverage/html

# Visualizar relatório
open coverage/html/index.html
```

### Mocks e Fixtures

```dart
// test/helpers/mocks/route_repository_mock.dart
import 'package:mockito/mockito.dart';
import 'package:golffox/features/routes/domain/repositories/route_repository.dart';

class MockRouteRepository extends Mock implements RouteRepository {}

// test/helpers/fixtures/route_fixtures.dart
import 'package:golffox/features/routes/domain/entities/route.dart';

class RouteFixtures {
  static Route get basicRoute => Route(
    id: '1',
    name: 'Test Route',
    distance: 100,
    createdAt: DateTime(2023, 1, 1),
  );

  static List<Route> get routeList => [
    basicRoute,
    Route(
      id: '2',
      name: 'Another Route',
      distance: 200,
      createdAt: DateTime(2023, 1, 2),
    ),
  ];
}
```

## Documentação

### Tipos de Documentação

1. **README**: Visão geral e setup
2. **API Docs**: Documentação da API
3. **Code Comments**: Comentários no código
4. **Architecture**: Documentação da arquitetura
5. **User Guide**: Guia do usuário

### Padrões de Documentação

#### Comentários de Código

```dart
/// Calculates the total distance of a golf route.
/// 
/// This method takes into account the distance of each hole
/// and the walking distance between holes.
/// 
/// Parameters:
/// - [holes]: List of holes in the route
/// - [includeWalking]: Whether to include walking distance
/// 
/// Returns the total distance in meters.
/// 
/// Throws [ArgumentError] if holes list is empty.
/// 
/// Example:
/// ```dart
/// final holes = [hole1, hole2, hole3];
/// final distance = calculateTotalDistance(holes, true);
/// print('Total distance: ${distance}m');
/// ```
double calculateTotalDistance(List<Hole> holes, bool includeWalking) {
  if (holes.isEmpty) {
    throw ArgumentError('Holes list cannot be empty');
  }
  
  // Implementation...
}
```

#### README Sections

```markdown
# Feature Name

## Overview
Brief description of the feature

## Usage
How to use the feature

## API Reference
Link to detailed API documentation

## Examples
Code examples

## Testing
How to test the feature

## Contributing
How to contribute to this feature
```

## Pull Requests

### Template de PR

```markdown
## Descrição
Breve descrição das mudanças realizadas.

## Tipo de Mudança
- [ ] Bug fix (mudança que corrige um problema)
- [ ] Nova funcionalidade (mudança que adiciona funcionalidade)
- [ ] Breaking change (mudança que quebra compatibilidade)
- [ ] Documentação (mudança apenas na documentação)

## Como Testar
Passos para testar as mudanças:
1. 
2. 
3. 

## Checklist
- [ ] Meu código segue os padrões do projeto
- [ ] Realizei uma auto-revisão do meu código
- [ ] Comentei meu código, especialmente em áreas difíceis
- [ ] Fiz mudanças correspondentes na documentação
- [ ] Minhas mudanças não geram novos warnings
- [ ] Adicionei testes que provam que minha correção é efetiva
- [ ] Testes novos e existentes passam localmente

## Screenshots (se aplicável)
Adicione screenshots para ajudar a explicar suas mudanças.

## Issues Relacionadas
Fixes #(número da issue)
```

### Processo de Review

1. **Automated Checks**: CI/CD deve passar
2. **Code Review**: Pelo menos um revisor
3. **Testing**: Testes manuais se necessário
4. **Documentation**: Documentação atualizada
5. **Approval**: Aprovação do maintainer

## Issues

### Template de Bug Report

```markdown
## Descrição do Bug
Descrição clara e concisa do bug.

## Para Reproduzir
Passos para reproduzir o comportamento:
1. Vá para '...'
2. Clique em '....'
3. Role para baixo até '....'
4. Veja o erro

## Comportamento Esperado
Descrição clara do que você esperava que acontecesse.

## Screenshots
Se aplicável, adicione screenshots para ajudar a explicar o problema.

## Informações do Ambiente
- OS: [ex: iOS 15.0, Android 12]
- Dispositivo: [ex: iPhone 13, Samsung Galaxy S21]
- Versão da App: [ex: 1.2.0]
- Flutter Version: [ex: 3.0.0]

## Contexto Adicional
Adicione qualquer outro contexto sobre o problema aqui.
```

### Template de Feature Request

```markdown
## Resumo da Funcionalidade
Descrição clara e concisa da funcionalidade desejada.

## Motivação
Por que esta funcionalidade seria útil? Qual problema ela resolve?

## Solução Proposta
Descrição clara de como você gostaria que funcionasse.

## Alternativas Consideradas
Descrição de soluções alternativas que você considerou.

## Contexto Adicional
Adicione qualquer outro contexto ou screenshots sobre a solicitação.
```

### Labels

- **bug**: Algo não está funcionando
- **enhancement**: Nova funcionalidade ou solicitação
- **documentation**: Melhorias ou adições à documentação
- **good first issue**: Bom para novos contribuidores
- **help wanted**: Ajuda extra é necessária
- **question**: Mais informações são necessárias
- **wontfix**: Isso não será trabalhado

## Versionamento

### Semantic Versioning

Seguimos o [Semantic Versioning](https://semver.org/):

- **MAJOR**: Mudanças incompatíveis na API
- **MINOR**: Funcionalidades adicionadas de forma compatível
- **PATCH**: Correções de bugs compatíveis

### Changelog

Mantemos um `CHANGELOG.md` atualizado:

```markdown
# Changelog

## [1.2.0] - 2023-12-01

### Added
- Nova funcionalidade de compartilhamento de rotas
- Suporte para múltiplos idiomas

### Changed
- Melhorada a performance do carregamento de rotas
- Atualizada a interface do perfil do usuário

### Fixed
- Corrigido bug no cálculo de distância
- Resolvido problema de login em dispositivos Android

### Deprecated
- Método `oldCalculateDistance` será removido na v2.0.0

### Removed
- Removido suporte para Android API < 21

### Security
- Corrigida vulnerabilidade de segurança no sistema de autenticação
```

## Recursos Adicionais

### Links Úteis

- [Flutter Documentation](https://flutter.dev/docs)
- [Dart Style Guide](https://dart.dev/guides/language/effective-dart/style)
- [Material Design Guidelines](https://material.io/design)
- [Accessibility Guidelines](https://flutter.dev/docs/development/accessibility-and-localization/accessibility)

### Comunidade

- **Discord**: [Link do servidor Discord]
- **Slack**: [Link do workspace Slack]
- **Forum**: [Link do fórum]
- **Stack Overflow**: Use a tag `golffox`

### Suporte

Se você precisar de ajuda:

1. Verifique a documentação existente
2. Procure em issues abertas e fechadas
3. Abra uma nova issue com a label `question`
4. Entre em contato através dos canais da comunidade

---

Obrigado por contribuir com o GolfFox! Sua participação é fundamental para o sucesso do projeto. 🏌️‍♂️