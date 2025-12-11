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

- **Node.js**: Versão 22.x (recomendado) ou 18.17+
- **npm**: Versão 9.0.0 ou superior
- **Git**: Para controle de versão
- **IDE**: VS Code (recomendado)
- **Expo Go**: App para testes mobile (iOS/Android)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/pglemos/GOLFFOX.git
cd GOLFFOX

# 2. Instale as dependências Web
cd apps/web
npm install

# 3. Instale as dependências Mobile
cd ../mobile
npm install

# 4. Configure as variáveis de ambiente
cd ../web
cp .env.example .env.local
# Edite o arquivo .env.local com suas configurações

# 5. Execute a aplicação Web
npm run dev

# 6. Execute a aplicação Mobile (em outro terminal)
cd ../mobile
npx expo start
```

### Configuração do IDE

#### VS Code (Recomendado)

Instale as extensões recomendadas:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "dsznajder.es7-react-js-snippets",
    "formulahendry.auto-rename-tag"
  ]
}
```

Configurações recomendadas (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Verificação da Configuração

```bash
# Verificar instalação do Node.js
node --version  # Deve mostrar v22.x.x

# Verificar npm
npm --version  # Deve mostrar 9.x.x ou superior

# Verificar dependências do projeto Web
cd apps/web
npm list --depth=0

# Executar linting
npm run lint

# Executar type check
npm run type-check

# Executar testes
npm test
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

## Padrões de Código

### TypeScript

#### Configuração ESLint

O projeto usa ESLint com as seguintes regras principais:

```javascript
// eslint.config.js
export default [
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'error',
      'no-console': 'warn',
    },
  },
];
```

### Formatação

```bash
# Formatar código
npm run format

# Verificar formatação
npm run format:check
```

### Análise Estática

```bash
# Executar linting
npm run lint

# Corrigir problemas automaticamente
npm run lint:fix

# Type check
npm run type-check
```

### Convenções de Código

#### Componentes React

```typescript
// ✅ Correto - Componente funcional com TypeScript
interface Props {
  title: string;
  onPress: () => void;
}

export function MyComponent({ title, onPress }: Props) {
  return (
    <button onClick={onPress}>
      {title}
    </button>
  );
}

// ❌ Evitar - Componente de classe ou sem tipos
class MyComponent extends React.Component {
  // ...
}
```

#### Hooks Customizados

```typescript
// ✅ Correto - Hook com tipos e retorno claro
export function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading, error };
}
```

#### API Routes (Next.js)

```typescript
// ✅ Correto - API Route com tipos e tratamento de erros
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

## Testes

### Estrutura de Testes

```
apps/web/
├── __tests__/              # Testes unitários
│   ├── components/
│   ├── hooks/
│   └── lib/
├── e2e/                    # Testes E2E (Playwright)
│   ├── auth.spec.ts
│   └── admin.spec.ts
└── jest.config.js          # Configuração Jest

apps/mobile/
└── __tests__/              # Testes unitários
    └── components/
```

### Tipos de Teste

#### Testes Unitários (Jest + Testing Library)

```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Testes E2E (Playwright)

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
});
```

### Executando Testes

```bash
# Web - Testes unitários
cd apps/web
npm test

# Web - Testes com coverage
npm run test:coverage

# Web - Testes E2E
npm run test:e2e

# Mobile - Type check
cd apps/mobile
npx tsc --noEmit

# Mobile - Expo Doctor
npx expo-doctor
```

## Documentação

### Tipos de Documentação

1. **README**: Visão geral e setup
2. **API Docs**: Documentação da API (OpenAPI)
3. **Code Comments**: Comentários no código
4. **Architecture**: Documentação da arquitetura
5. **Guides**: Guias específicos em `docs/`

### Padrões de Documentação

#### Comentários de Código

```typescript
/**
 * Calcula a distância total de uma rota.
 * 
 * @param stops - Lista de paradas na rota
 * @param includeWalking - Se deve incluir distância a pé
 * @returns A distância total em metros
 * @throws Error se a lista de paradas estiver vazia
 * 
 * @example
 * ```typescript
 * const stops = [stop1, stop2, stop3];
 * const distance = calculateTotalDistance(stops, true);
 * console.log(`Total: ${distance}m`);
 * ```
 */
function calculateTotalDistance(
  stops: Stop[],
  includeWalking: boolean
): number {
  if (stops.length === 0) {
    throw new Error('Stops list cannot be empty');
  }
  // Implementation...
}
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

1. **Automated Checks**: CI/CD deve passar (lint, type-check, tests, build)
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
- OS: [ex: Windows 11, macOS Sonoma]
- Browser: [ex: Chrome 120, Safari 17]
- Node Version: [ex: 22.0.0]
- Versão da App: [ex: 1.2.0]

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

Mantemos um `CHANGELOG.md` atualizado seguindo o formato [Keep a Changelog](https://keepachangelog.com/):

```markdown
# Changelog

## [1.2.0] - 2024-12-11

### Added
- Nova funcionalidade de compartilhamento de rotas
- Suporte para múltiplos idiomas

### Changed
- Melhorada a performance do carregamento de rotas
- Atualizada a interface do perfil do usuário

### Fixed
- Corrigido bug no cálculo de distância
- Resolvido problema de login

### Security
- Corrigida vulnerabilidade no sistema de autenticação
```

## Recursos Adicionais

### Links Úteis

- [React Documentation](https://react.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)

### Comunidade

- **GitHub Issues**: Para bugs e feature requests
- **Pull Requests**: Para contribuições de código

### Suporte

Se você precisar de ajuda:

1. Verifique a documentação existente em `docs/`
2. Procure em issues abertas e fechadas
3. Abra uma nova issue com a label `question`

---

Obrigado por contribuir com o GolfFox! Sua participação é fundamental para o sucesso do projeto. 🚌