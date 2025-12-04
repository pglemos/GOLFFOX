# Checklist de Execução - Atualizações de Dependências

## Status Atual: ✅ ATUALIZAÇÕES APLICADAS

Todas as atualizações foram aplicadas ao `package.json`. Este checklist guia os próximos passos.

## ✅ Fase 1: Preparação - CONCLUÍDA

- [x] Branch criada: `feat/update-dependencies`
- [x] Estado atual documentado
- [x] Versões modernas identificadas
- [x] Documentação criada

## ✅ Fase 2: Atualizações Aplicadas - CONCLUÍDA

### Dependências Atualizadas:

- [x] ✅ Radix UI - 14 pacotes atualizados
- [x] ✅ Framer Motion: 11.15.0 → 11.18.2
- [x] ✅ TanStack Query: 5.62.2 → 5.90.11
- [x] ✅ Zustand: 5.0.2 → 5.0.9
- [x] ✅ Jest: 29.7.0 → 30.2.0
- [x] ✅ Playwright: 1.48.2 → 1.57.0
- [x] ✅ Web Vitals: Já atualizado (5.1.0)
- [x] ✅ @vis.gl/react-google-maps: Adicionado (1.7.1)

## ⏭️ Fase 3: Instalação e Validação - PRÓXIMOS PASSOS

### Passo 1: Instalar Dependências

```bash
cd apps/web
npm install
```

- [ ] Executar `npm install`
- [ ] Verificar se não há erros de instalação
- [ ] Verificar se todas as dependências foram instaladas

### Passo 2: Instalar Browsers do Playwright

```bash
npx playwright install
```

- [ ] Executar instalação dos browsers
- [ ] Verificar se todos os browsers foram instalados

### Passo 3: Verificação de TypeScript

```bash
npm run type-check
```

- [ ] Executar verificação de tipos
- [ ] Corrigir erros de tipo se houver
- [ ] Verificar que não há erros críticos

### Passo 4: Build de Verificação

```bash
npm run build
```

- [ ] Executar build de produção
- [ ] Verificar se build completa sem erros
- [ ] Verificar warnings (se houver)

### Passo 5: Testes Unitários

```bash
npm test
```

- [ ] Executar testes unitários
- [ ] Verificar que todos os testes passam
- [ ] Corrigir testes quebrados (se houver)
- [ ] Verificar cobertura de testes

### Passo 6: Testes E2E

```bash
npm run test:e2e
```

- [ ] Executar testes E2E
- [ ] Verificar que todos os testes passam
- [ ] Corrigir testes quebrados (se houver)

### Passo 7: Teste Local

```bash
npm run dev
```

- [ ] Iniciar servidor de desenvolvimento
- [ ] Verificar que aplicação inicia sem erros
- [ ] Testar funcionalidades básicas

## 📋 Fase 4: Validação Manual de Componentes

### Radix UI

- [ ] Testar Dialog
- [ ] Testar Dropdown Menu
- [ ] Testar Select
- [ ] Testar Toast
- [ ] Testar Tooltip
- [ ] Testar outros componentes Radix UI usados

### Framer Motion

- [ ] Verificar animações funcionando
- [ ] Testar componentes com animações
- [ ] Verificar performance das animações

### TanStack Query

- [ ] Verificar queries funcionando
- [ ] Testar mutations
- [ ] Verificar cache e refetch

### Zustand

- [ ] Verificar stores funcionando
- [ ] Testar atualizações de estado

### Web Vitals

- [ ] Verificar que métricas estão sendo coletadas
- [ ] Verificar endpoint `/api/analytics/web-vitals`

## 📝 Fase 5: Documentação Final

- [x] Estado inicial documentado
- [x] Log de mudanças criado
- [x] Guia completo criado
- [x] Resumo final criado
- [x] Checklist de execução criado (este arquivo)

## 🚀 Fase 6: Deploy (Quando Pronto)

- [ ] Todos os testes passando
- [ ] Build bem-sucedido
- [ ] Validação manual completa
- [ ] Preparar PR para merge
- [ ] Revisar mudanças
- [ ] Merge para branch principal

## 🔄 Migração do Google Maps (Futuro)

A migração completa do Google Maps será feita em etapa separada:

- [ ] Planejar migração
- [ ] Migrar `components/address-autocomplete.tsx`
- [ ] Migrar `components/fleet-map.tsx`
- [ ] Migrar outros componentes de mapa
- [ ] Remover `@react-google-maps/api`
- [ ] Testar todos os mapas

## ⚠️ Notas Importantes

1. **Jest 30.x** - Versão major, pode requerer ajustes em testes
2. **Radix UI** - Testar componentes após instalação
3. **Compatibilidade** - Todas as atualizações são compatíveis com React 19 e Next.js 15.5.7

## 📚 Documentação Criada

1. `docs/dependencies-current-state.md` - Estado inicial
2. `docs/dependencies-update-log.md` - Log de mudanças
3. `docs/ATUALIZACOES-DEPENDENCIAS-COMPLETO.md` - Guia completo
4. `docs/RESUMO-FINAL-ATUALIZACOES.md` - Resumo executivo
5. `docs/CHECKLIST-EXECUCAO.md` - Este checklist
6. `package-updated.json` - Referência (backup)

## Comandos Rápidos

```bash
# Instalar tudo
npm install && npx playwright install

# Verificar tudo
npm run type-check && npm run build && npm test

# Rodar tudo
npm run dev
```

## Status Final

✅ **Atualizações aplicadas ao package.json**
⏭️ **Pronto para instalação e validação**

