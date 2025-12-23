# k6 Performance Tests - GolfFox

**Data:** 2025-01-27  
**Status:** ✅ **CONFIGURADO**

---

## 📋 Resumo

Configuração de testes de performance usando k6 para validar capacidade, performance e resiliência das APIs críticas do GolfFox.

---

## ✅ Testes Criados

### 1. Load Tests (`load-tests.js`)
Testes de carga gradual para validar performance sob carga normal.

**Características:**
- Ramp up gradual: 0 → 10 → 20 usuários
- Duração total: ~4 minutos
- Thresholds: 95% das requisições < 2s, taxa de erro < 10%

**APIs testadas:**
- `GET /api/health` - Health check
- `GET /api/admin/usuarios-list` - Listar usuários
- `GET /api/admin/kpis` - KPIs administrativos
- `GET /api/admin/empresas` - Listar empresas

### 2. Stress Tests (`stress-tests.js`)
Testes de stress para identificar limites do sistema.

**Características:**
- Carga alta: até 100 usuários simultâneos
- Duração total: ~7 minutos
- Thresholds: 95% das requisições < 5s, taxa de erro < 20%

**APIs testadas:**
- `GET /api/health` - Health check
- `GET /api/admin/kpis` - KPIs (endpoint mais pesado)
- `GET /api/admin/usuarios-list` - Listar usuários

### 3. Spike Tests (`spike-tests.js`)
Testes de pico para simular tráfego súbito.

**Características:**
- Spike súbito: 10 → 100 usuários em 1 segundo
- Duração total: ~52 segundos
- Thresholds: Taxa de erro < 30% (tolerante para spike)

**APIs testadas:**
- `GET /api/health` - Health check

---

## 🚀 Como Executar

### Pré-requisitos

1. **Instalar k6:**
   ```bash
   # macOS
   brew install k6
   
   # Linux
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   
   # Windows
   choco install k6
   ```

2. **Configurar variáveis de ambiente:**
   ```bash
   export BASE_URL=http://localhost:3000
   export ADMIN_TOKEN=your-admin-token-here
   ```

### Executar Testes

#### Load Tests
```bash
cd apps/web
k6 run k6/load-tests.js
```

Com opções customizadas:
```bash
k6 run --vus 10 --duration 30s k6/load-tests.js
```

#### Stress Tests
```bash
k6 run k6/stress-tests.js
```

Com opções customizadas:
```bash
k6 run --vus 50 --duration 2m k6/stress-tests.js
```

#### Spike Tests
```bash
k6 run k6/spike-tests.js
```

### Executar em Produção

⚠️ **ATENÇÃO:** Testes de carga em produção devem ser executados com cuidado!

```bash
export BASE_URL=https://golffox.vercel.app
export ADMIN_TOKEN=your-production-admin-token
k6 run k6/load-tests.js
```

---

## 📊 Interpretando Resultados

### Métricas Importantes

1. **http_req_duration**
   - Tempo de resposta das requisições
   - p(95) = 95% das requisições foram mais rápidas que este valor
   - p(99) = 99% das requisições foram mais rápidas que este valor

2. **http_req_failed**
   - Taxa de falha das requisições
   - Deve ser < 10% em load tests
   - Pode ser < 20% em stress tests

3. **http_reqs**
   - Número total de requisições
   - Throughput do sistema

4. **vus**
   - Número de usuários virtuais (Virtual Users)
   - Simula usuários simultâneos

### Exemplo de Saída

```
✓ health check status is 200
✓ users list status is 200
✓ kpis status is 200

checks.........................: 100.00% ✓ 300      ✗ 0
data_received..................: 1.2 MB  20 kB/s
data_sent......................: 45 kB   750 B/s
http_req_duration..............: avg=150ms  min=50ms  med=120ms  max=500ms  p(95)=300ms  p(99)=450ms
http_req_failed................: 0.00%   ✓ 0        ✗ 300
http_reqs.....................: 300     5.0/s
vus............................: 10      min=1      max=20
```

---

## 🎯 Thresholds Recomendados

### Load Tests (Carga Normal)
- `http_req_duration`: p(95) < 2000ms
- `http_req_failed`: rate < 0.1 (10%)

### Stress Tests (Carga Alta)
- `http_req_duration`: p(95) < 5000ms
- `http_req_failed`: rate < 0.2 (20%)

### Spike Tests (Pico Súbito)
- `http_req_failed`: rate < 0.3 (30%)

---

## 🔧 Customização

### Adicionar Novos Testes

1. Criar novo arquivo em `k6/`
2. Importar funções necessárias
3. Definir `options` com stages e thresholds
4. Implementar função `default` com testes

### Modificar Carga

Edite os `stages` em `options`:

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // 10 usuários em 30s
    { duration: '1m', target: 10 },   // Manter 10 usuários por 1min
    { duration: '30s', target: 0 },   // Reduzir a 0 em 30s
  ],
}
```

---

## 📝 Integração com CI/CD

Adicione ao `.github/workflows/test.yml`:

```yaml
- name: Run k6 load tests
  run: |
    k6 run k6/load-tests.js
  env:
    BASE_URL: ${{ secrets.BASE_URL }}
    ADMIN_TOKEN: ${{ secrets.ADMIN_TOKEN }}
```

---

## 🔗 Links Úteis

- [k6 Documentation](https://k6.io/docs/)
- [k6 Metrics](https://k6.io/docs/using-k6/metrics/)
- [k6 Thresholds](https://k6.io/docs/using-k6/thresholds/)
- [k6 Options](https://k6.io/docs/using-k6/options/)

---

**Última atualização:** 2025-01-27

