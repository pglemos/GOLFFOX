# 📊 GolfFox - Documentação do Fluxograma Arquitetural

**ID do Documento**: GOLFFOX-DIAG-001  
**Versão**: v1.0.0  
**Data de Criação**: 11/01/2025  
**Autor**: Equipe GolfFox  
**Formato Original**: .drawio (Draw.io)  
**Compatibilidade**: .vsdx (Visio), .drawio (Draw.io), Lucidchart

---

## 📋 Índice

1. [Legenda e Convenções](#legenda-e-convenções)
2. [Glossário Técnico](#glossário-técnico)
3. [Estrutura do Diagrama](#estrutura-do-diagrama)
4. [Fluxos Principais](#fluxos-principais)
5. [Histórico de Versões](#histórico-de-versões)
6. [Instruções de Atualização](#instruções-de-atualização)
7. [Dependências Externas](#dependências-externas)
8. [Controles de Qualidade](#controles-de-qualidade)

---

## 🎨 Legenda e Convenções

### Símbolos ISO 5807

| Símbolo | Forma | Cor | Descrição |
|---------|-------|-----|-----------|
| **Início/Fim** | Elipse | Verde/Vermelho | Pontos de entrada e saída do sistema |
| **Processo** | Retângulo com cantos arredondados (0.2cm) | Azul claro | Operações e ações do sistema |
| **Decisão** | Losango perfeito (1cm x 1cm) | Amarelo | Pontos de decisão e bifurcação |
| **Conector** | Círculo (0.8cm de diâmetro) | Cinza | Pontos de conexão entre fluxos |
| **Entrada/Saída** | Paralelogramo (ângulo 45°) | Verde | Dados de entrada e saída |

### Padronização Visual

#### Paleta de Cores Categorizada

**Cores Primárias (6 cores com 3 tons cada):**

1. **Azul** (Frontend Web)
   - Primária: `#3B82F6` (RGB: 59, 130, 246)
   - Secundária: `#2563EB` (RGB: 37, 99, 235)
   - Terciária: `#1E40AF` (RGB: 30, 64, 175)

2. **Verde** (Mobile/Flutter)
   - Primária: `#10B981` (RGB: 16, 185, 129)
   - Secundária: `#059669` (RGB: 5, 150, 105)
   - Terciária: `#047857` (RGB: 4, 120, 87)

3. **Laranja** (Transportadora/transportadora)
   - Primária: `#F59E0B` (RGB: 245, 158, 11)
   - Secundária: `#D97706` (RGB: 217, 119, 6)
   - Terciária: `#B45309` (RGB: 180, 83, 9)

4. **Roxo** (Motorista/motorista)
   - Primária: `#9333EA` (RGB: 147, 51, 234)
   - Secundária: `#7C3AED` (RGB: 124, 58, 237)
   - Terciária: `#6D28D9` (RGB: 109, 40, 217)

5. **Ciano** (Passageiro/passageiro)
   - Primária: `#06B6D4` (RGB: 6, 182, 212)
   - Secundária: `#0891B2` (RGB: 8, 145, 178)
   - Terciária: `#0E7490` (RGB: 14, 116, 144)

6. **Vermelho** (API/Backend)
   - Primária: `#EF4444` (RGB: 239, 68, 68)
   - Secundária: `#DC2626` (RGB: 220, 38, 38)
   - Terciária: `#991B1B` (RGB: 153, 27, 27)

#### Tipografia

- **Fonte**: Arial
- **Tamanho de conteúdo**: 10pt (regular)
- **Tamanho de títulos**: 12pt (bold)
- **Cores de texto**:
  - Fundo claro: `#1F2937` (preto suave)
  - Fundo escuro: `#FFFFFF` (branco)

#### Espaçamento

- **Entre elementos**: 1cm
- **Entre grupos**: 2cm
- **Margens da página**: 1cm (todas as bordas)
- **Grade de alinhamento**: 0.5cm (snap ativado)

#### Bordas

- **Elementos principais**: 2pt de espessura
- **Elementos secundários**: 1pt de espessura
- **Linhas de conexão**:
  - Fluxo principal: linha contínua (2pt)
  - Fluxo secundário: linha tracejada (1pt)

---

## 📚 Glossário Técnico

### Termos e Acrônimos

| Termo | Descrição |
|-------|-----------|
| **RLS** | Row Level Security - Segurança no nível de linha do PostgreSQL |
| **API** | Application Programming Interface - Interface de programação de aplicações |
| **REST** | Representational State Transfer - Arquitetura de serviços web |
| **JWT** | JSON Web Token - Token de autenticação baseado em JSON |
| **CSRF** | Cross-Site Request Forgery - Ataque de falsificação de requisição entre sites |
| **GPS** | Global Positioning System - Sistema de posicionamento global |
| **WebSocket** | Protocolo de comunicação bidirecional em tempo real |
| **SDK** | Software Development Kit - Kit de desenvolvimento de software |
| **CRUD** | Create, Read, Update, Delete - Operações básicas de banco de dados |
| **KPI** | Key Performance Indicator - Indicador chave de performance |
| **MV** | Materialized View - Visão materializada no banco de dados |
| **SLA** | Service Level Agreement - Acordo de nível de serviço |
| **SDK** | Software Development Kit - Kit de desenvolvimento de software |

### Componentes do Sistema

| Componente | Descrição |
|------------|-----------|
| **Middleware** | Camada intermediária que processa requisições antes de chegarem às rotas |
| **Supabase Client** | Cliente JavaScript/TypeScript para interação com Supabase |
| **Row Level Security** | Políticas de segurança que filtram dados por usuário/role |
| **Real-time Subscriptions** | Assinaturas em tempo real para atualizações instantâneas |
| **Cron Jobs** | Tarefas agendadas executadas periodicamente |
| **Materialized Views** | Views pré-calculadas para otimização de consultas |

---

## 🏗️ Estrutura do Diagrama

### Hierarquia de Componentes

```
GolfFox Sistema Completo
├── Camada de Apresentação (Frontend)
│   ├── Next.js Web App
│   │   ├── Painel Admin (/admin)
│   │   ├── Painel Operador (/operador)
│   │   └── Painel Transportadora (/transportadora)
│   └── Flutter Mobile App
│       ├── App Motorista
│       └── App Passageiro
├── Camada de API (Backend)
│   ├── API Routes (Next.js)
│   │   ├── /api/auth/*
│   │   ├── /api/admin/*
│   │   ├── /api/operador/*
│   │   ├── /api/transportadora/*
│   │   ├── /api/costs/*
│   │   ├── /api/reports/*
│   │   ├── /api/cron/*
│   │   └── /api/notifications/*
│   └── Middleware (middleware.ts)
├── Camada de Serviços
│   ├── Supabase Client
│   ├── Supabase Backend
│   │   ├── PostgreSQL Database
│   │   ├── Authentication
│   │   ├── Realtime
│   │   └── Storage
│   └── Serviços Externos
│       ├── Google Maps API
│       ├── Sentry (Monitoramento)
│       └── Vercel (Hosting)
└── Camada de Dados
    ├── Tabelas Principais
    ├── RLS Policies
    ├── Real-time Subscriptions
    └── Materialized Views
```

---

## 🔄 Fluxos Principais

### 1. Fluxo de Autenticação

```
Usuário → Login Page → API /api/auth/login → Supabase Auth → 
Verificação users table → Criação cookie golffox-session → 
Middleware valida cookie → Redirecionamento baseado em role →
Painel correspondente (Admin/operador/transportadora/motorista/passageiro)
```

### 2. Fluxo de Dados (Painéis Web)

```
Painel → API Route → Supabase Client → Supabase Backend → 
RLS Policy verifica permissões → Query na tabela → 
Retorno dos dados → API Route → Painel (atualização)
```

### 3. Fluxo de Tempo Real

```
Evento no Banco (INSERT/UPDATE/DELETE) → Supabase Realtime → 
WebSocket Subscription → Cliente (Web/Mobile) → 
Atualização da Interface
```

### 4. Fluxo de Notificações

```
Evento do Sistema → Trigger de Notificação → 
API /api/notifications/* → Inserção em gf_notifications → 
Supabase Realtime → Push para Cliente → 
Exibição de Notificação
```

### 5. Fluxo de Rastreamento GPS

```
App Motorista → Captura GPS → Envio para driver_positions → 
Supabase Realtime → Painéis Web → Atualização no Mapa → 
Google Maps API → Visualização
```

### 6. Fluxo de Relatórios

```
Solicitação de Relatório → API /api/reports/run → 
Consulta Materialized Views → Processamento de Dados → 
Geração PDF/Excel/CSV → Envio por Email (opcional) → 
Download pelo Usuário
```

---

## 📝 Histórico de Versões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| v1.0.0 | 11/01/2025 | Equipe GolfFox | Criação inicial do fluxograma completo |

---

## 🔧 Instruções de Atualização

### Pré-requisitos

- Draw.io (web ou desktop) OU Microsoft Visio 2019+ OU Lucidchart
- Acesso ao arquivo `.drawio` original
- Conhecimento básico dos componentes do sistema

### Fluxo de Trabalho

1. **Abra o arquivo original**
   - Draw.io: `GOLFFOX_FLUXOGRAMA_COMPLETO.drawio`
   - Visio: Importe o arquivo .drawio ou use o .vsdx exportado

2. **Faça as alterações necessárias**
   - Mantenha a paleta de cores padrão
   - Preserve o espaçamento entre elementos
   - Atualize metadados (cabeçalho e rodapé)

3. **Atualize a versão**
   - Incremente a versão (v1.0.0 → v1.0.1 para patches, v1.1.0 para features)
   - Atualize a data no cabeçalho
   - Registre mudanças no histórico de versões

4. **Exporte em múltiplos formatos**
   - `.vsdx` (edição completa no Visio)
   - `.png` (300dpi, fundo transparente)
   - `.pdf` (vetorial, A4)
   - `.svg` (para web)

5. **Valide o diagrama**
   - Execute checklist de qualidade
   - Teste abertura em todas as plataformas
   - Verifique legibilidade em zoom 100% e 200%

### Regras de Versionamento

- **vX.Y.Z** (Semantic Versioning)
  - **X**: Mudanças arquiteturais maiores
  - **Y**: Adição de novos componentes/fluxos
  - **Z**: Correções e ajustes visuais

---

## 📦 Dependências Externas

### Templates e Bibliotecas

- **Draw.io Shapes**: ISO 5807 shapes library
- **Fontes**: Arial (sistema padrão)
- **Cores**: Paleta customizada GolfFox (definida neste documento)

### Arquivos de Configuração

- **Paleta de Cores**: Salvar como `golffox-colors.xml` (Draw.io) ou `.clr` (Visio)
- **Estilos Padrão**: Salvar como `golffox-template.drawio` ou `.vstx` (Visio)

### Serviços Externos Referenciados

- Google Maps API (chave necessária)
- Supabase (projeto e credenciais)
- Sentry (configuração opcional)
- Vercel (para cron jobs)

---

## ✅ Controles de Qualidade

### Checklist de Validação

#### Estrutural
- [ ] 100% dos elementos nomeados corretamente
- [ ] Todos os fluxos logicamente consistentes
- [ ] Sem elementos órfãos ou desconectados
- [ ] Hierarquia de componentes respeitada

#### Visual
- [ ] Legibilidade em zoom 100%
- [ ] Legibilidade em zoom 200%
- [ ] Impressão em A4 sem cortes ou distorções
- [ ] Paleta de cores consistente
- [ ] Tipografia uniforme
- [ ] Espaçamento respeitado

#### Documental
- [ ] Metadados completos e corretos
- [ ] Cabeçalho com informações atualizadas
- [ ] Rodapé com informações corretas
- [ ] Histórico de versões atualizado

#### Técnico
- [ ] Abertura funcional em Draw.io
- [ ] Abertura funcional em Visio
- [ ] Abertura funcional em Lucidchart
- [ ] Edição de elementos sem corrupção
- [ ] Exportação para todos os formatos requeridos
- [ ] Links externos funcionais (se aplicável)

### Testes Obrigatórios

1. **Teste de Abertura**
   ```bash
   # Draw.io
   - Abrir .drawio no draw.io
   - Verificar carregamento completo
   
   # Visio
   - Importar .drawio ou abrir .vsdx
   - Verificar elementos renderizados
   
   # Lucidchart
   - Importar .drawio
   - Verificar conversão correta
   ```

2. **Teste de Edição**
   ```bash
   # Testar edição de um elemento
   # Verificar que não corrompe o arquivo
   # Salvar e reabrir para confirmar
   ```

3. **Teste de Exportação**
   ```bash
   # Exportar para .vsdx
   # Exportar para .png (300dpi)
   # Exportar para .pdf (A4)
   # Exportar para .svg
   # Verificar qualidade de cada formato
   ```

4. **Teste de Impressão**
   ```bash
   # Imprimir em A4 (100% scale)
   # Verificar margens e corte
   # Verificar legibilidade
   ```

---

## 📄 Formato de Arquivo

### Nomenclatura

**Padrão**: `GOLFFOX_DIAGRAMA_TIPO_vX.Y.Z.extensão`

**Exemplo**: `GOLFFOX_FLUXOGRAMA_COMPLETO_v1.0.0.vsdx`

### Estrutura de Diretórios

```
docs/
├── diagrams/
│   ├── GOLFFOX_FLUXOGRAMA_COMPLETO.drawio (original)
│   ├── GOLFFOX_FLUXOGRAMA_COMPLETO.vsdx (exportado)
│   ├── GOLFFOX_FLUXOGRAMA_COMPLETO.png (visualização)
│   ├── GOLFFOX_FLUXOGRAMA_COMPLETO.pdf (impressão)
│   ├── GOLFFOX_FLUXOGRAMA_COMPLETO.svg (web)
│   ├── README_VSX.md (esta documentação)
│   └── golffox-colors.xml (paleta de cores)
```

---

## 🔗 Links Úteis

- [Documentação Draw.io](https://drawio-app.com/doc/)
- [Documentação Visio](https://support.microsoft.com/visio)
- [ISO 5807 Standard](https://www.iso.org/standard/11955.html)
- [Semantic Versioning](https://semver.org/)

---

## 📞 Suporte

Para questões sobre este diagrama, consulte:
- README.md principal do projeto
- Documentação técnica em `docs/`
- Issues no repositório GitHub

---

**Última atualização**: 11/01/2025  
**Próxima revisão**: Quando houver mudanças arquiteturais significativas
