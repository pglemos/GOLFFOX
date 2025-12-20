# Configuração de Testes de Performance - GolfFox

**Data:** 2025-01-27  
**Status:** ✅ **CONFIGURADO**

---

## 📋 Resumo

Sistema de testes de performance configurado usando k6 para validar capacidade, performance e resiliência das APIs críticas.

---

## ✅ O Que Foi Implementado

### 1. Testes k6 Criados
- ✅ `k6/load-tests.js` - Testes de carga gradual
- ✅ `k6/stress-tests.js` - Testes de stress (limites)
- ✅ `k6/spike-tests.js` - Testes de pico súbito

### 2. Scripts npm
- ✅ `npm run test:load` - Executar load tests
- ✅ `npm run test:stress` - Executar stress tests
- ✅ `npm run test:spike` - Executar spike tests
- ✅ `npm run test:performance` - Executar todos os testes de performance

### 3. Documentação
- ✅ `k6/README.md` - Guia completo de uso
- ✅ `docs/PERFORMANCE_TESTS_SETUP.md` - Este documento

---

## 🚀 Quick Start

### 1. Instalar k6

```bash
# macOS
brew install k6

# Linux (Ubuntu/Debian)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

### 2. Configurar Variáveis

```bash
export BASE_URL=http://localhost:3000
export ADMIN_TOKEN=your-admin-token-here
```

### 3. Executar Testes

```bash
cd apps/web

# Load tests
npm run test:load

# Stress tests
npm run test:stress

# Spike tests
npm run test:spike

# Todos os testes
npm run test:performance
```

---

## 📊 Tipos de Testes

### Load Tests
- **Objetivo:** Validar performance sob carga normal
- **Carga:** 0 → 10 → 20 usuários
- **Duração:** ~4 minutos
- **Thresholds:** 95% < 2s, erro < 10%

### Stress Tests
- **Objetivo:** Identificar limites do sistema
- **Carga:** 0 → 50 → 100 usuários
- **Duração:** ~7 minutos
- **Thresholds:** 95% < 5s, erro < 20%

### Spike Tests
- **Objetivo:** Simular tráfego súbito
- **Carga:** 10 → 100 usuários em 1s
- **Duração:** ~52 segundos
- **Thresholds:** Erro < 30%

---

## 🎯 APIs Testadas

### Load Tests
- `GET /api/health` - Health check
- `GET /api/admin/users-list` - Listar usuários
- `GET /api/admin/kpis` - KPIs administrativos
- `GET /api/admin/companies` - Listar empresas

### Stress Tests
- `GET /api/health` - Health check
- `GET /api/admin/kpis` - KPIs (endpoint mais pesado)
- `GET /api/admin/users-list` - Listar usuários

### Spike Tests
- `GET /api/health` - Health check

---

## 📈 Métricas Coletadas

1. **http_req_duration** - Tempo de resposta
2. **http_req_failed** - Taxa de falha
3. **http_reqs** - Throughput (req/s)
4. **vus** - Usuários virtuais simultâneos
5. **errors** - Taxa de erro customizada

---

## 🔧 Customização

### Modificar Carga

Edite os `stages` em cada arquivo de teste:

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // 10 usuários em 30s
    { duration: '1m', target: 10 },   // Manter 10 usuários por 1min
  ],
}
```

### Adicionar Novos Testes

1. Criar novo arquivo em `k6/`
2. Importar funções necessárias
3. Definir `options`
4. Implementar função `default`

---

## ⚠️ Avisos

1. **Testes em Produção:** Execute com cuidado e avise a equipe
2. **Rate Limiting:** Testes podem ser bloqueados por rate limiting
3. **Recursos:** Testes de stress consomem muitos recursos
4. **Autenticação:** Configure `ADMIN_TOKEN` para testar rotas protegidas

---

## 🔗 Links Úteis

- [k6 Documentation](https://k6.io/docs/)
- [k6 Metrics](https://k6.io/docs/using-k6/metrics/)
- [k6 Thresholds](https://k6.io/docs/using-k6/thresholds/)

---

**Última atualização:** 2025-01-27

