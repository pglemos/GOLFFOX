# 🔧 Configuração Avançada do GitHub

Este guia detalha as configurações que devem ser realizadas através da interface web do GitHub para otimizar o projeto GOLFFOX.

## 📋 Índice

- [Proteção de Branches](#proteção-de-branches)
- [Configurações do Repositório](#configurações-do-repositório)
- [GitHub Actions Secrets](#github-actions-secrets)
- [Configurações de Segurança](#configurações-de-segurança)
- [GitHub Pages](#github-pages)
- [Configurações de Colaboração](#configurações-de-colaboração)

## 🛡️ Proteção de Branches

### 1. Acesse as Configurações de Branches

1. Vá para o repositório: `https://github.com/pglemos/GOLFFOX`
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Branches**
4. Clique em **Add rule** (Adicionar regra)

### 2. Configure a Proteção da Branch Main

**Branch name pattern:** `main`

**Configurações recomendadas:**

✅ **Restrict pushes that create files larger than 100 MB**
- Evita commits com arquivos muito grandes

✅ **Require a pull request before merging**
- **Require approvals:** 1
- ✅ **Dismiss stale PR approvals when new commits are pushed**
- ✅ **Require review from code owners** (se houver CODEOWNERS)

✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**
- **Status checks que devem passar:**
  - `test (Flutter Tests)`
  - `build (Flutter Build)`
  - `security (Security Scan)`
  - `next-js-test (Next.js Tests)`
  - `next-js-build (Next.js Build)`

✅ **Require conversation resolution before merging**
- Garante que todos os comentários sejam resolvidos

✅ **Require signed commits** (opcional, mas recomendado)
- Aumenta a segurança dos commits

✅ **Require linear history**
- Mantém o histórico limpo

✅ **Include administrators**
- Aplica as regras mesmo para administradores

### 3. Configure a Proteção da Branch Develop (se usar)

Repita o processo para a branch `develop` com configurações similares, mas menos restritivas:

**Branch name pattern:** `develop`

- **Require approvals:** 1
- **Status checks:** Mesmos da main
- **Não requer** linear history (permite merge commits)

## ⚙️ Configurações do Repositório

### General Settings

1. **Settings > General**
2. Configure as seguintes opções:

**Features:**
- ✅ **Issues**
- ✅ **Projects** (se usar GitHub Projects)
- ✅ **Wiki** (se quiser documentação wiki)
- ✅ **Discussions** (para discussões da comunidade)

**Pull Requests:**
- ✅ **Allow merge commits**
- ✅ **Allow squash merging** (recomendado como padrão)
- ✅ **Allow rebase merging**
- ✅ **Always suggest updating pull request branches**
- ✅ **Allow auto-merge**
- ✅ **Automatically delete head branches**

**Archives:**
- ✅ **Include Git LFS objects in archives**

## 🔐 GitHub Actions Secrets

### 1. Acesse Secrets and Variables

1. **Settings > Secrets and variables > Actions**
2. Clique em **New repository secret**

### 2. Adicione os Secrets Necessários

**Para Deploy:**
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

**Para Supabase:**
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Para Google Maps:**
```
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**Para Codecov (opcional):**
```
CODECOV_TOKEN=your_codecov_token
```

### 3. Variables de Ambiente

Em **Variables**, adicione:
```
FLUTTER_VERSION=3.24.0
NODE_VERSION=18
```

## 🔒 Configurações de Segurança

### 1. Security & Analysis

1. **Settings > Security & analysis**
2. Habilite as seguintes opções:

✅ **Dependency graph**
- Rastreia dependências do projeto

✅ **Dependabot alerts**
- Alertas de vulnerabilidades

✅ **Dependabot security updates**
- Atualizações automáticas de segurança

✅ **Secret scanning**
- Detecta credenciais commitadas

✅ **Push protection**
- Bloqueia push com secrets

### 2. Code Security and Analysis

✅ **CodeQL analysis** (se disponível)
- Análise estática de código

## 📄 GitHub Pages

### 1. Configure GitHub Pages

1. **Settings > Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `gh-pages` (será criada pelo workflow)
4. **Folder:** `/ (root)`

### 2. Custom Domain (opcional)

Se tiver um domínio personalizado:
1. Adicione o domínio em **Custom domain**
2. ✅ **Enforce HTTPS**

## 👥 Configurações de Colaboração

### 1. Manage Access

1. **Settings > Manage access**
2. Configure permissões para colaboradores:

**Roles recomendados:**
- **Admin:** Proprietário do projeto
- **Maintain:** Desenvolvedores principais
- **Write:** Contribuidores regulares
- **Triage:** Gerenciadores de issues
- **Read:** Visualizadores

### 2. Moderation Settings

1. **Settings > Moderation**
2. Configure limites de interação se necessário

## 🏷️ Labels e Milestones

### 1. Configure Labels

1. **Issues > Labels**
2. Adicione/edite labels:

**Tipos:**
- `bug` (vermelho)
- `enhancement` (azul)
- `documentation` (verde)
- `question` (roxo)

**Prioridades:**
- `priority: critical` (vermelho escuro)
- `priority: high` (laranja)
- `priority: medium` (amarelo)
- `priority: low` (verde claro)

**Status:**
- `status: needs-triage` (cinza)
- `status: in-progress` (azul)
- `status: blocked` (vermelho)

**Componentes:**
- `component: flutter` (azul)
- `component: nextjs` (preto)
- `component: backend` (verde)
- `component: ci/cd` (roxo)

### 2. Configure Milestones

1. **Issues > Milestones**
2. Crie milestones para versões:
- `v1.0.0 - MVP`
- `v1.1.0 - Melhorias`
- `v2.0.0 - Recursos Avançados`

## 📊 Insights e Analytics

### 1. Habilite Insights

1. **Insights > Community**
2. Complete o checklist da comunidade:
   - ✅ Description
   - ✅ README
   - ✅ Code of conduct
   - ✅ Contributing guidelines
   - ✅ License
   - ✅ Issue templates
   - ✅ Pull request template

### 2. Configure Traffic Analytics

1. **Insights > Traffic**
2. Monitore:
   - Views e clones
   - Referrers
   - Popular content

## 🔄 Webhooks (opcional)

### 1. Configure Webhooks

1. **Settings > Webhooks**
2. Adicione webhooks para:
   - Slack/Discord notifications
   - CI/CD externos
   - Monitoring tools

**Eventos recomendados:**
- Push
- Pull requests
- Issues
- Releases

## ✅ Checklist Final

Após configurar tudo:

- [ ] Proteção de branches configurada
- [ ] Secrets adicionados
- [ ] Security features habilitadas
- [ ] GitHub Pages configurado
- [ ] Labels e milestones criados
- [ ] Colaboradores adicionados
- [ ] Templates funcionando
- [ ] CI/CD executando
- [ ] Dependabot ativo

## 🆘 Troubleshooting

### Problemas Comuns

**CI/CD não executa:**
- Verifique se os secrets estão corretos
- Confirme que os workflows estão na pasta `.github/workflows/`

**Branch protection muito restritiva:**
- Temporariamente desabilite para pushes urgentes
- Configure bypass para emergências

**Dependabot não funciona:**
- Verifique se está habilitado em Security & analysis
- Confirme o arquivo `dependabot.yml`

## 📚 Recursos Adicionais

- [GitHub Docs - Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)

---

**⚠️ Importante:** Algumas configurações podem afetar o workflow de desenvolvimento. Teste em um repositório de exemplo primeiro se não tiver certeza.