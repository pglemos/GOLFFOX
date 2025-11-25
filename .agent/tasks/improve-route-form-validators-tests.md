# Tarefa: Melhorar Testes de Validação de Formulário de Rotas

## 📋 Descrição
Os testes em `form-validators.spec.ts` validam apenas casos básicos e não cobrem edge cases importantes nem testam integração com componentes reais.

## 🧪 Problema Atual
- **Arquivo**: `apps/web/__tests__/form-validators.spec.ts`
- **Cobertura atual**: Apenas 4 testes básicos
- **Casos não cobertos**:
  - Validação de formato de horário (`scheduled_time`)
  - Validação de UUIDs no `company_id`
  - Valores limítrofes (boundary conditions)
  - Integração com componentes reais (`RouteForm`)

## ✅ Melhorias a Implementar

### 1. Adicionar Testes de Formato de Horário
```typescript
it("should validate time format (HH:mm)", () => {
  const invalidData = { ...validData, scheduled_time: "25:00" }
  expect(() => routeSchema.parse(invalidData)).toThrow()
})

it("should accept valid time format", () => {
  const validData = { ...validData, scheduled_time: "08:30" }
  expect(() => routeSchema.parse(validData)).not.toThrow()
})
```

### 2. Adicionar Testes de UUID
```typescript
it("should validate company_id as UUID", () => {
  const invalidData = { ...validData, company_id: "not-a-uuid" }
  expect(() => routeSchema.parse(invalidData)).toThrow()
})
```

### 3. Adicionar Testes de Edge Cases
```typescript
it("should reject very long route names", () => {
  const invalidData = { ...validData, name: "A".repeat(1000) }
  // Assumindo limite de 255 caracteres
  expect(() => routeSchema.parse(invalidData)).toThrow()
})

it("should validate all shift enum values", () => {
  const shifts = ["manha", "tarde", "noite"]
  shifts.forEach(shift => {
    const validData = { ...baseData, shift }
    expect(() => routeSchema.parse(validData)).not.toThrow()
  })
})
```

### 4. Adicionar Teste de Integração
```typescript
it("should integrate with RouteForm component", () => {
  // Teste renderizando o formulário real e validando submit
  render(<RouteForm {...props} />)
  // Testar validação no componente real
})
```

## 🎯 Critérios de Aceitação
- [ ] Mínimo de 10 testes cobrindo diversos cenários
- [ ] Cobertura de validação de formato de tempo
- [ ] Cobertura de validação de UUID
- [ ] Testes de valores limítrofes
- [ ] Pelo menos 1 teste de integração com componente
- [ ] Cobertura de código > 80% para o schema de validação

## 📊 Cobertura Esperada
- **Antes**: ~40% de cobertura de casos
- **Depois**: >80% de cobertura de casos

## 🔗 Arquivos Afetados
- `apps/web/__tests__/form-validators.spec.ts` (melhorias)
- Potencialmente criar novo arquivo: `apps/web/__tests__/route-form-integration.spec.tsx`

## 💡 Benefícios
- Maior confiança na validação de dados
- Detecção precoce de bugs
- Documentação viva do comportamento esperado
- Prevenção de regressões
