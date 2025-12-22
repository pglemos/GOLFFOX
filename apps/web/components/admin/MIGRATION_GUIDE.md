# Guia de Migração: Modais Picker

## Status: ✅ GenericPickerModal Criado

Os modais duplicados foram substituídos por um componente genérico e reutilizável.

## Modais Deprecated

Os seguintes modais estão **deprecated** e devem ser substituídos pelo `GenericPickerModal`:

- ❌ `MotoristaPickerModal` → ✅ `GenericPickerModal`
- ❌ `VeiculoPickerModal` → ✅ `GenericPickerModal`
- ❌ `DriverPickerModal` → ✅ `GenericPickerModal`
- ❌ `VehiclePickerModal` → ✅ `GenericPickerModal`

## Como Migrar

### Antes (MotoristaPickerModal)

```tsx
import { MotoristaPickerModal } from "@/components/admin/motorista-picker-modal"

<MotoristaPickerModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSelect={(motorista) => handleSelect(motorista)}
  companyId={companyId}
/>
```

### Depois (GenericPickerModal)

```tsx
import { GenericPickerModal, type PickerItem } from "@/components/shared/generic-picker-modal"

const [motoristas, setMotoristas] = useState<PickerItem[]>([])
const [loading, setLoading] = useState(false)

useEffect(() => {
  if (isOpen && companyId) {
    setLoading(true)
    fetch(`/api/admin/motoristas-list?company_id=${companyId}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setMotoristas(result.motoristas.map((d: any) => ({
            id: d.id,
            name: d.name,
            cpf: d.cpf,
            documents_valid: !!d.cpf
          })))
        }
      })
      .finally(() => setLoading(false))
  }
}, [isOpen, companyId])

<GenericPickerModal
  open={isOpen}
  title="Selecionar Motorista"
  items={motoristas}
  isLoading={loading}
  onSelect={(item) => {
    handleSelect(item)
    setIsOpen(false)
  }}
  onClose={() => setIsOpen(false)}
  searchPlaceholder="Buscar por nome ou CPF..."
  columns={[
    { key: 'name', label: 'Nome', isPrimary: true },
    { key: 'cpf', label: 'CPF' }
  ]}
/>
```

## Benefícios

- ✅ Código reutilizável
- ✅ Menos duplicação
- ✅ Manutenção mais fácil
- ✅ Consistência de UI/UX
- ✅ Melhor acessibilidade

## Arquivos Migrados

- ✅ `app/admin/rotas/route-create-modal.tsx` - Migrado para GenericPickerModal

## Próximos Passos

1. Identificar outros usos dos modais deprecated
2. Migrar gradualmente para GenericPickerModal
3. Remover modais deprecated após migração completa

