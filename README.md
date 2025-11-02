# 🚌 GolfFox - Sistema de Gestão de Transporte Urbano

[![Flutter](https://img.shields.io/badge/Flutter-3.24+-blue.svg)](https://flutter.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI/CD](https://github.com/pglemos/GOLFFOX/workflows/CI/badge.svg)](https://github.com/pglemos/GOLFFOX/actions)
[![Deploy](https://github.com/pglemos/GOLFFOX/workflows/Deploy/badge.svg)](https://github.com/pglemos/GOLFFOX/actions)
[![Codecov](https://codecov.io/gh/pglemos/GOLFFOX/branch/main/graph/badge.svg)](https://codecov.io/gh/pglemos/GOLFFOX)
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-brightgreen.svg)](https://github.com/pglemos/GOLFFOX/network/dependencies)

## 📋 Sobre o Projeto

O **GolfFox** é uma plataforma completa de gestão de transporte urbano que oferece soluções integradas para empresas de ônibus, operadores, motoristas e passageiros. O sistema combina tecnologias modernas para fornecer rastreamento em tempo real, gestão de rotas, controle de custos e uma experiência de usuário excepcional.

### 🎯 Principais Funcionalidades

- **🚌 Gestão de Frota**: Controle completo de veículos, motoristas e rotas
- **📍 Rastreamento em Tempo Real**: Monitoramento GPS com atualizações instantâneas
- **👥 Multi-perfil**: Suporte para Admin, Operador, Motorista e Passageiro
- **📊 Dashboard Analytics**: Relatórios detalhados e métricas de performance
- **🔒 Segurança Avançada**: Rate limiting, sanitização de dados e logging seguro
- **📱 Multiplataforma**: Apps móveis (iOS/Android) e web responsivo
- **🌐 API RESTful**: Integração fácil com sistemas terceiros

## 🏗️ Arquitetura

O projeto utiliza uma arquitetura híbrida moderna:

- **Frontend Mobile**: Flutter (iOS/Android)
- **Frontend Web**: Next.js 14 com TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Arquitetura**: Clean Architecture + Domain Driven Design
- **Estado**: Provider Pattern (Flutter) + Zustand (Next.js)

```
📁 GOLFFOX/
├── 📱 lib/                    # Flutter App
│   ├── 🏗️ core/              # Camada Core (Shared)
│   ├── 🎯 features/          # Features por domínio
│   ├── 📊 models/            # Modelos de dados
│   └── 🎨 widgets/           # Componentes reutilizáveis
├── 🌐 web-app/               # Next.js Web App
├── 📚 docs/                  # Documentação técnica
├── 🧪 test/                  # Testes automatizados
└── 🔧 scripts/               # Scripts de automação
```

## 🚀 Quick Start

### Pré-requisitos

- **Flutter SDK**: 3.0+
- **Node.js**: 18+
- **Git**: Última versão
- **VS Code**: Recomendado com extensões Flutter/Dart

### 1️⃣ Clonagem e Setup Inicial

```bash
# Clone o repositório
git clone https://github.com/golffox/golffox.git
cd golffox

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 2️⃣ Setup Flutter (Mobile)

```bash
# Instale as dependências
flutter pub get

# Execute a análise de código
flutter analyze

# Execute os testes
flutter test

# Execute o app (desenvolvimento web)
flutter run -d web-server --web-port 8000

# Execute o app (Android/iOS)
flutter run
```

### 3️⃣ Setup Next.js (Web)

```bash
# Navegue para o diretório web
cd web-app

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

### 4️⃣ Acesso às Aplicações

- **Flutter Web**: http://localhost:8000
- **Next.js Web**: http://localhost:3000
- **Mobile**: Use o emulador ou dispositivo físico

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente Essenciais

```env
# API Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Maps Integration
GOOGLE_MAPS_API_KEY=your_google_maps_key

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Development
DEBUG_MODE=true
LOG_LEVEL=debug
```

### Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Configure as tabelas usando os scripts em `database/migrations/`
3. Configure as políticas RLS (Row Level Security)
4. Adicione as chaves no arquivo `.env`

## 👥 Perfis de Usuário

### 🔑 Admin
- Gestão completa do sistema
- Configuração de empresas e operadores
- Relatórios globais e analytics
- Gerenciamento de permissões

### 🏢 Operador (Empresa)
- Gestão de frota e motoristas
- Controle de rotas e horários
- Relatórios de custos e performance
- Monitoramento em tempo real

### 🚗 Motorista
- App móvel para check-in/check-out
- Navegação GPS integrada
- Comunicação com central
- Histórico de viagens

### 🎫 Passageiro
- Rastreamento de ônibus em tempo real
- Informações de rotas e horários
- Notificações de chegada
- Avaliação do serviço

## 🧪 Testes

### Executar Todos os Testes

```bash
# Flutter - Testes unitários
flutter test

# Flutter - Testes de integração
flutter test integration_test/

# Next.js - Testes
cd web-app
npm test
npm run test:e2e
```

### Cobertura de Testes

```bash
# Flutter - Relatório de cobertura
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html

# Next.js - Cobertura
cd web-app
npm run test:coverage
```

## 📦 Build e Deploy

### Flutter (Mobile)

```bash
# Android APK
flutter build apk --release

# Android App Bundle
flutter build appbundle --release

# iOS
flutter build ios --release

# Web
flutter build web --release
```

### Next.js (Web)

```bash
cd web-app

# Build para produção
npm run build

# Deploy (exemplo com Vercel)
npm run deploy
```

## 🔒 Segurança

O projeto implementa múltiplas camadas de segurança:

- **Rate Limiting**: Proteção contra ataques de força bruta
- **Sanitização de Dados**: Prevenção de XSS e SQL Injection
- **Logging Seguro**: Mascaramento de dados sensíveis
- **Validação Robusta**: Validação client-side e server-side
- **Autenticação JWT**: Tokens seguros com refresh automático

## 📊 Monitoramento e Logs

### Sistema de Logging

```dart
// Exemplo de uso do AppLogger
AppLogger.info('Usuário logado', extra: {'userId': user.id});
AppLogger.error('Erro na API', error: exception, stackTrace: stackTrace);
AppLogger.performance('Tempo de carregamento', duration: duration);
```

### Métricas Disponíveis

- Performance de carregamento
- Erros e exceções
- Uso de recursos
- Atividade de usuários
- Métricas de negócio

## 🤝 Contribuindo

Leia nosso [Guia de Contribuição](docs/CONTRIBUTING.md) para detalhes sobre:

- Código de conduta
- Processo de desenvolvimento
- Padrões de código
- Como submeter Pull Requests

### Desenvolvimento Local

```bash
# 1. Fork o projeto
# 2. Crie uma branch para sua feature
git checkout -b feature/nova-funcionalidade

# 3. Commit suas mudanças
git commit -m "feat: adiciona nova funcionalidade"

# 4. Push para a branch
git push origin feature/nova-funcionalidade

# 5. Abra um Pull Request
```

## 📚 Documentação

- **[Arquitetura](docs/ARCHITECTURE.md)**: Visão detalhada da arquitetura
- **[Padrões de Código](docs/CODING_STANDARDS.md)**: Convenções e boas práticas
- **[API Documentation](docs/api/)**: Documentação da API
- **[Guias](docs/guides/)**: Tutoriais e guias específicos

## 🛠️ Scripts Úteis

```bash
# Desenvolvimento
./scripts/dev/run_web.ps1          # Executa Flutter web
./scripts/dev/run_android.ps1     # Executa Flutter Android

# Deploy
./scripts/deploy/build_all.ps1    # Build completo
./scripts/deploy/deploy_web.ps1   # Deploy web

# Utilitários
./scripts/setup/install_deps.ps1  # Instala dependências
./scripts/setup/setup_env.ps1     # Configura ambiente
```

## 🐛 Troubleshooting

### Problemas Comuns

**Flutter não compila:**
```bash
flutter clean
flutter pub get
flutter pub deps
```

**Erro de dependências Next.js:**
```bash
cd web-app
rm -rf node_modules package-lock.json
npm install
```

**Problemas de permissão:**
- Verifique as configurações do Supabase RLS
- Confirme as chaves de API no `.env`

## 🔄 CI/CD e Qualidade

O projeto utiliza GitHub Actions para automação completa:

### 🧪 Pipeline de Testes
- **Testes Unitários**: Flutter e Next.js
- **Análise de Código**: Dart Analyzer e ESLint
- **Cobertura**: Codecov integration
- **Formatação**: Dart formatter e Prettier

### 🚀 Deploy Automático
- **Flutter Web**: GitHub Pages
- **Next.js**: Vercel
- **Releases**: Automático com changelog

### 🔒 Segurança
- **Dependabot**: Atualizações automáticas
- **Security Scanning**: Análise de vulnerabilidades
- **Secrets Detection**: Verificação de credenciais

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Veja como você pode ajudar:

### 📋 Como Contribuir

1. **Fork** o projeto
2. **Clone** seu fork: `git clone https://github.com/seu-usuario/GOLFFOX.git`
3. **Crie** uma branch: `git checkout -b feature/nova-funcionalidade`
4. **Commit** suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`
5. **Push** para a branch: `git push origin feature/nova-funcionalidade`
6. **Abra** um Pull Request

### 📝 Padrões de Commit

Utilizamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: manutenção
```

### 🧪 Antes de Contribuir

```bash
# Execute os testes
flutter test
cd web-app && npm test

# Verifique a formatação
flutter format --set-exit-if-changed .
cd web-app && npm run lint

# Execute a análise
flutter analyze
cd web-app && npm run type-check
```

## 📊 Status do Projeto

- [ ] **v2.0**: Integração com sistemas de pagamento
- [ ] **v2.1**: IA para otimização de rotas
- [ ] **v2.2**: App para tablets (operadores)
- [ ] **v2.3**: Integração com IoT (sensores de ônibus)
- [ ] **v3.0**: Plataforma white-label

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Issues**: [GitHub Issues](https://github.com/pglemos/GOLFFOX/issues)
- **Discussões**: [GitHub Discussions](https://github.com/pglemos/GOLFFOX/discussions)
- **Pull Requests**: [Contribuições](https://github.com/pglemos/GOLFFOX/pulls)
- **Documentação**: Veja a pasta `docs/` do projeto

## 🙏 Agradecimentos

- Equipe Flutter e Dart
- Comunidade Next.js
- Supabase pela infraestrutura
- Todos os contribuidores do projeto

---

**Desenvolvido com ❤️ pela equipe GolfFox**

*Para mais informações, visite nossa [documentação completa](docs/) ou entre em contato conosco.*
