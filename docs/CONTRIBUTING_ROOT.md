# 🤝 Guia de Contribuição - GOLFFOX

Obrigado por considerar contribuir para o GOLFFOX! Este documento fornece diretrizes e informações para ajudar você a contribuir de forma efetiva.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Posso Contribuir?](#como-posso-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Processo de Desenvolvimento](#processo-de-desenvolvimento)
- [Padrões de Código](#padrões-de-código)
- [Testes](#testes)
- [Documentação](#documentação)
- [Pull Requests](#pull-requests)

## 📜 Código de Conduta

Este projeto adere ao [Contributor Covenant](https://www.contributor-covenant.org/). Ao participar, você deve seguir este código de conduta.

## 🚀 Como Posso Contribuir?

### 🐛 Reportando Bugs

Antes de criar um issue de bug:
- Verifique se o bug já foi reportado
- Use o template de bug report
- Inclua informações detalhadas sobre o ambiente
- Adicione steps para reproduzir o problema

### ✨ Sugerindo Melhorias

Para sugerir uma nova funcionalidade:
- Use o template de feature request
- Explique claramente o problema que resolve
- Descreva a solução proposta
- Considere alternativas

### 💻 Contribuindo com Código

1. **Fork** o repositório
2. **Clone** seu fork localmente
3. **Configure** o ambiente de desenvolvimento
4. **Crie** uma branch para sua feature
5. **Implemente** suas mudanças
6. **Teste** suas mudanças
7. **Commit** seguindo os padrões
8. **Push** e abra um Pull Request

## 🔧 Configuração do Ambiente

### Pré-requisitos

- **Flutter SDK**: 3.24+
- **Node.js**: 22+
- **Git**: Última versão
- **VS Code**: Recomendado

### Setup Inicial

```bash
# Clone seu fork
git clone https://github.com/seu-usuario/GOLFFOX.git
cd GOLFFOX

# Configure o upstream
git remote add upstream https://github.com/pglemos/GOLFFOX.git

# Instale dependências Flutter
flutter pub get

# Instale dependências Next.js
cd web-app
npm install
cd ..

# Configure variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações
```

### Extensões VS Code Recomendadas

```json
{
  "recommendations": [
    "dart-code.flutter",
    "dart-code.dart-code",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "github.copilot"
  ]
}
```

## 🔄 Processo de Desenvolvimento

### Workflow Git

```bash
# Sempre comece com a main atualizada
git checkout main
git pull upstream main

# Crie uma nova branch
git checkout -b feature/nome-da-feature

# Faça suas mudanças e commits
git add .
git commit -m "feat: adiciona nova funcionalidade"

# Push para seu fork
git push origin feature/nome-da-feature

# Abra um Pull Request no GitHub
```

### Convenções de Branch

- `feature/nome-da-feature` - Novas funcionalidades
- `fix/nome-do-bug` - Correções de bugs
- `docs/nome-da-doc` - Documentação
- `refactor/nome-do-refactor` - Refatorações
- `test/nome-do-teste` - Testes

## 📝 Padrões de Código

### Commits Convencionais

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé opcional]
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (sem mudança de lógica)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

**Exemplos:**
```
feat(auth): adiciona autenticação com Google
fix(maps): corrige erro de carregamento do mapa
docs: atualiza README com instruções de setup
```

### Padrões Flutter/Dart

```dart
// ✅ Bom
class UserRepository {
  Future<User?> getUserById(String id) async {
    try {
      final response = await _apiClient.get('/users/$id');
      return User.fromJson(response.data);
    } catch (e) {
      logger.error('Erro ao buscar usuário: $e');
      return null;
    }
  }
}

// ❌ Evitar
class userRepository {
  getUserById(id) {
    return _apiClient.get('/users/' + id);
  }
}
```

### Padrões Next.js/TypeScript

```typescript
// ✅ Bom
interface UserProps {
  id: string;
  name: string;
  email: string;
}

export const UserCard: React.FC<UserProps> = ({ id, name, email }) => {
  const [loading, setLoading] = useState(false);
  
  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      await updateUser(id, { name, email });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    } finally {
      setLoading(false);
    }
  }, [id, name, email]);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-gray-600">{email}</p>
      <button onClick={handleClick} disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  );
};
```

## 🧪 Testes

### Flutter Tests

```bash
# Execute todos os testes
flutter test

# Execute com cobertura
flutter test --coverage

# Execute testes específicos
flutter test test/features/auth/
```

### Next.js Tests

```bash
cd web-app

# Execute testes unitários
npm test

# Execute com cobertura
npm run test:coverage

# Execute testes e2e
npm run test:e2e
```

### Padrões de Teste

```dart
// Flutter - Teste unitário
group('UserRepository', () {
  late UserRepository repository;
  late MockApiClient mockApiClient;

  setUp(() {
    mockApiClient = MockApiClient();
    repository = UserRepository(mockApiClient);
  });

  test('deve retornar usuário quando ID é válido', () async {
    // Arrange
    const userId = '123';
    const userData = {'id': userId, 'name': 'João'};
    when(() => mockApiClient.get('/users/$userId'))
        .thenAnswer((_) async => Response(data: userData));

    // Act
    final result = await repository.getUserById(userId);

    // Assert
    expect(result, isA<User>());
    expect(result?.id, equals(userId));
  });
});
```

```typescript
// Next.js - Teste de componente
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
  const mockProps = {
    id: '1',
    name: 'João Silva',
    email: 'joao@example.com'
  };

  it('deve renderizar informações do usuário', () => {
    render(<UserCard {...mockProps} />);
    
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('joao@example.com')).toBeInTheDocument();
  });

  it('deve mostrar loading ao clicar em salvar', async () => {
    render(<UserCard {...mockProps} />);
    
    const saveButton = screen.getByText('Salvar');
    fireEvent.click(saveButton);
    
    expect(screen.getByText('Salvando...')).toBeInTheDocument();
  });
});
```

## 📚 Documentação

### Comentários de Código

```dart
/// Repositório responsável por gerenciar dados de usuários.
/// 
/// Fornece métodos para CRUD de usuários, incluindo:
/// - Busca por ID
/// - Criação de novos usuários
/// - Atualização de dados
/// - Exclusão de usuários
class UserRepository {
  /// Busca um usuário pelo ID.
  /// 
  /// Retorna `null` se o usuário não for encontrado ou em caso de erro.
  /// 
  /// Exemplo:
  /// ```dart
  /// final user = await repository.getUserById('123');
  /// if (user != null) {
  ///   print('Usuário encontrado: ${user.name}');
  /// }
  /// ```
  Future<User?> getUserById(String id) async {
    // implementação...
  }
}
```

### README de Features

Cada feature deve ter seu próprio README:

```markdown
# Feature: Autenticação

## Descrição
Sistema de autenticação com suporte a múltiplos provedores.

## Arquivos Principais
- `auth_repository.dart` - Repositório de autenticação
- `auth_service.dart` - Serviço de autenticação
- `login_page.dart` - Tela de login

## Como Usar
```dart
final authService = AuthService();
final user = await authService.signInWithEmail(email, password);
```

## Testes
```bash
flutter test test/features/auth/
```
```

## 🔄 Pull Requests

### Checklist do PR

Antes de abrir um PR, verifique:

- [ ] Código segue os padrões estabelecidos
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] CI/CD está passando
- [ ] Não há conflitos com a main
- [ ] Descrição clara das mudanças

### Template do PR

Use o template fornecido e preencha todas as seções:

- **Descrição**: O que foi implementado
- **Tipo de mudança**: Bug fix, feature, etc.
- **Como foi testado**: Testes executados
- **Capturas de tela**: Se aplicável
- **Checklist**: Verificações realizadas

### Processo de Review

1. **Automated Checks**: CI/CD deve passar
2. **Code Review**: Pelo menos 1 aprovação
3. **Testing**: Testes manuais se necessário
4. **Merge**: Squash and merge preferido

## 🎯 Dicas para Contribuidores

### Performance

- Use `const` constructors quando possível
- Implemente `dispose()` em controllers
- Otimize builds com `Builder` widgets
- Use `useMemo` e `useCallback` no React

### Segurança

- Nunca commite credenciais
- Valide inputs do usuário
- Use HTTPS para APIs
- Implemente rate limiting

### UX/UI

- Siga o design system
- Implemente loading states
- Trate erros graciosamente
- Teste em diferentes dispositivos

## 🆘 Precisa de Ajuda?

- **Issues**: Para dúvidas técnicas
- **Discussions**: Para discussões gerais
- **Discord**: [Link do servidor] (se disponível)

## 🙏 Reconhecimento

Todos os contribuidores são reconhecidos no README principal. Obrigado por fazer o GOLFFOX melhor! 🚌✨