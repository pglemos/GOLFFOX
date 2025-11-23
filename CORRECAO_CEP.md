# Correção do Buscador de CEP

## 🐛 Problema Identificado
**Erro:** "Erro ao buscar endereço pelo CEP" em todos os formulários

**Causa Raiz:**
O hook `useCep` estava chamando a API ViaCEP diretamente do navegador:
```typescript
fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
```

Isso causava erros de **CORS (Cross-Origin Resource Sharing)** porque o navegador bloqueia requisições diretas entre domínios diferentes por segurança.

---

## ✅ Solução Implementada

### 1. Criada API Route no Next.js
**Arquivo:** `app/api/cep/route.ts`

Esta rota funciona como um **proxy** entre o frontend e a API ViaCEP:
- Recebe requisições do frontend (mesmo domínio, sem CORS)
- Faz a chamada para ViaCEP do lado do servidor
- Retorna os dados para o frontend

**Vantagens:**
- ✅ Sem problemas de CORS
- ✅ Melhor segurança
- ✅ Validação centralizada
- ✅ Tratamento de erros consistente
- ✅ Cache possível no futuro

### 2. Atualizado Hook useCep
**Arquivo:** `hooks/use-cep.ts`

**Antes:**
```typescript
const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
```

**Depois:**
```typescript
const response = await fetch(`/api/cep?cep=${cleanCep}`)
```

---

## 🧪 Teste da Correção

### Teste Real da API:
```bash
curl "https://golffox.vercel.app/api/cep?cep=32604115"
```

**Resultado:**
```json
{
  "success": true,
  "address": {
    "cep": "32604-115",
    "logradouro": "Rua do Rosário - de 1699 - lado ímpar",
    "bairro": "Angola",
    "localidade": "Betim",
    "uf": "MG"
  }
}
```

✅ **API funcionando perfeitamente!**

---

## 📁 Arquivos Modificados

1. **NOVO:** `app/api/cep/route.ts` - API route para busca de CEP
2. **ATUALIZADO:** `hooks/use-cep.ts` - Hook atualizado para usar API interna

---

## 🎯 Formulários Corrigidos

A correção afeta **TODOS** os formulários que usam busca de CEP:

### Painel Admin:
- ✅ Criar Usuário (`/admin/usuarios`)
- ✅ Editar Usuário
- ✅ Criar Motorista (via Transportadoras)

### Painel Operador:
- ✅ Criar Funcionário
- ✅ Editar Funcionário

### Painel Transportadora:
- ✅ Criar Motorista
- ✅ Editar Motorista

---

## 🔄 Como Usar

1. **Digite o CEP** (com ou sem formatação): `32604115` ou `32604-115`
2. **Clique no botão de busca** (ícone de lupa) ou **saia do campo** (onBlur)
3. **Aguarde 1-2 segundos**
4. **Campos preenchidos automaticamente:**
   - Rua/Avenida
   - Bairro
   - Cidade
   - Estado

---

## 📊 Status

- ✅ Código commitado: `c06448b`
- ✅ Deploy no Vercel: Concluído
- ✅ API testada: Funcionando
- ✅ Todos os formulários: Corrigidos

---

## 🚀 Próximas Ações

1. **Teste em produção:** Abrir qualquer formulário e testar busca de CEP
2. **Monitorar logs:** Verificar se não há mais erros de CEP
3. **Feedback dos usuários:** Confirmar que a busca está funcionando

---

**Data:** 2025-11-23 04:15 AM  
**Commit:** `c06448b`  
**Status:** ✅ **CORRIGIDO E DEPLOYADO**
