# Tarefa: Corrigir Bug de Formatação de CNPJ

## 📋 Descrição
O modal `create-operator-modal.tsx` está usando a função `formatCPF()` para formatar o campo CNPJ, o que está incorreto. CPF e CNPJ têm formatos diferentes.

## 🐛 Problema
- **Arquivo**: `apps/web/components/modals/create-operator-modal.tsx`
- **Linha**: 288
- **Código atual**:
```tsx
onChange={(e) => setFormData({ ...formData, cnpj: formatCPF(e.target.value) })}
```

## ✅ Solução
1. Criar função `formatCNPJ()` em `lib/format-utils.ts` com formato correto: XX.XXX.XXX/XXXX-XX
2. Adicionar função de validação `isValidCNPJFormat()`
3. Atualizar `create-operator-modal.tsx` para usar `formatCNPJ()` em vez de `formatCPF()`

## 📝 Formato Correto
- **CPF**: XXX.XXX.XXX-XX (11 dígitos)
- **CNPJ**: XX.XXX.XXX/XXXX-XX (14 dígitos)

## 🎯 Critérios de Aceitação
- [ ] Função `formatCNPJ()` criada e exportada de `format-utils.ts`
- [ ] Função `isValidCNPJFormat()` criada para validação
- [ ] Modal atualizado para usar a função correta
- [ ] CNPJ é formatado corretamente conforme usuário digita
- [ ] Placeholder atualizado para "00.000.000/0000-00"

## 🔗 Arquivos Afetados
- `apps/web/lib/format-utils.ts`
- `apps/web/components/modals/create-operator-modal.tsx`
