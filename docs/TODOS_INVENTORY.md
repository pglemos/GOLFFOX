# Inventário de TODOs - GolfFox

**Data:** 2025-12-26  
**Total Encontrado:** 6 (excluindo falsos positivos)

## Lista de TODOs Pendentes

| Arquivo | Linha | Descrição | Prioridade |
|---------|-------|-----------|------------|
| `app/empresa/suporte/page.tsx` | 35 | Implementar envio real via API/Banco | 🟡 Média |
| `app/admin/rotas/rotas-content.tsx` | 200 | Implementar filtro de data | 🟢 Baixa |
| `app/api/notifications/email/route.ts` | 34 | Implementar envio de email real | 🔴 Alta |
| `components/advanced-route-map.tsx` | 65 | Implementar useReducedMotion | 🟢 Baixa |

## Detalhes

### 🔴 Alta Prioridade

#### 1. Email Notifications (`app/api/notifications/email/route.ts:34`)
```typescript
// TODO: Implementar envio de email real via serviço de email (SendGrid, Resend, etc.)
```
- **Impacto:** Funcionalidade de notificações por email não funcional
- **Solução:** Integrar com Resend (já instalado no package.json)

### 🟡 Média Prioridade

#### 2. Suporte Form (`app/empresa/suporte/page.tsx:35`)
```typescript
// TODO: Implementar envio real via API/Banco
```
- **Impacto:** Formulário de suporte não persiste dados
- **Solução:** Criar endpoint de API e tabela Supabase

### 🟢 Baixa Prioridade

#### 3. Filtro de Data (`app/admin/rotas/rotas-content.tsx:200`)
- Filtro de data nas rotas sempre retorna true
- Pode ser implementado depois

#### 4. Reduced Motion (`components/advanced-route-map.tsx:65`)
- Hook de acessibilidade para preferências de animação
- Baixo impacto, melhoria de UX

## Observações

- Comentários contendo "TODOS" (plural de TODO) foram filtrados
- `lib/api-auth.ts:253` e `lib/services/map/map-services/vehicle-loader.ts:247` usam "TODOS" como palavra, não como marcador
