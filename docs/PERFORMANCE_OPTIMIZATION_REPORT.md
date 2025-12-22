# Relatório de Otimização de Performance

Data: 2025-01-XX

Este documento identifica problemas de performance e oportunidades de otimização no código, com sugestões concretas para cada problema encontrado.

---

## 1. Componentes sem React.memo()

### 🔴 Problema 1.1: DataTableMobile
**Arquivo**: `apps/web/components/ui/data-table-mobile.tsx`

**Problema**: Componente renderiza todos os itens da lista sem memoização. Cada vez que o componente pai re-renderiza, todos os cards são recriados, mesmo que os dados não tenham mudado.

**Impacto**: 
- Em listas com 50+ itens, causa re-renderizações desnecessárias
- Em dispositivos móveis com menor poder de processamento, pode causar lag perceptível
- Consome memória desnecessariamente

**Solução**:
```typescript
// Adicionar React.memo no componente principal
export const DataTableMobile = React.memo(function DataTableMobile<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  className,
  emptyMessage = "Nenhum registro encontrado"
}: DataTableMobileProps<T>) {
  // ... código existente
}) as typeof DataTableMobile

// Criar componente memoizado para cada card/row
const TableRowCard = React.memo(function TableRowCard<T>({
  row,
  columns,
  onRowClick
}: {
  row: T
  columns: Array<{ key: string; label: string; render?: (value: any, row: T) => React.ReactNode }>
  onRowClick?: (row: T) => void
}) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all touch-manipulation",
        onRowClick && "hover:shadow-md active:scale-[0.98]",
        "border border-border"
      )}
      onClick={() => onRowClick?.(row)}
    >
      {/* conteúdo do card */}
    </Card>
  )
})
```

---

### 🔴 Problema 1.2: CostDetailTable
**Arquivo**: `apps/web/components/costs/cost-detail-table.tsx`

**Problema**: Componente renderiza linhas de tabela e cards sem memoização. Em tabelas com centenas de custos, isso causa re-renderizações massivas.

**Impacto**:
- Com 100+ custos, cada mudança de estado (sort, filter, pagination) re-renderiza todas as linhas
- Performance degrada significativamente com grandes volumes de dados
- Scroll pode ficar travado durante re-renderizações

**Solução**:
```typescript
// Memoizar componente principal
export const CostDetailTable = React.memo(function CostDetailTable({
  costs,
  onReconcile,
  loading
}: CostDetailTableProps) {
  // ... código existente
})

// Memoizar cards de mobile
const CostCard = React.memo(function CostCard({
  cost,
  onReconcile
}: {
  cost: CostDetail
  onReconcile?: (cost: CostDetail) => void
}) {
  return (
    <Card key={cost.id} className="mobile-table-card p-4">
      {/* conteúdo */}
    </Card>
  )
}, (prev, next) => prev.cost.id === next.cost.id && prev.cost.amount === next.cost.amount)

// Memoizar linhas de tabela desktop
const CostTableRow = React.memo(function CostTableRow({
  cost,
  onReconcile
}: {
  cost: CostDetail
  onReconcile?: (cost: CostDetail) => void
}) {
  return (
    <tr>
      {/* conteúdo da linha */}
    </tr>
  )
}, (prev, next) => {
  // Comparação customizada para evitar re-renders desnecessários
  return prev.cost.id === next.cost.id &&
    prev.cost.amount === next.cost.amount &&
    prev.cost.date === next.cost.date
})
```

---

### 🔴 Problema 1.3: KpiCard (implícito)
**Arquivo**: `apps/web/app/transportadora/page.tsx`

**Problema**: Componente KpiCard renderizado múltiplas vezes no dashboard sem memoização. Cada mudança de estado causa re-render de todos os KPIs.

**Impacto**:
- Dashboard re-renderiza 7 KPI cards a cada atualização
- Cálculos de trend são refeitos desnecessariamente
- Impacto visual de "flickering" em atualizações frequentes

**Solução**:
Verificar se `KpiCard` está memoizado. Se não estiver:
```typescript
const KpiCard = React.memo(function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  onClick,
  hint
}: KpiCardProps) {
  // ... código existente
}, (prev, next) => 
  prev.value === next.value &&
  prev.trend === next.trend &&
  prev.label === next.label
)
```

---

## 2. Funções sem useCallback()

### 🔴 Problema 2.1: DataTable - Handlers inline
**Arquivo**: `apps/web/components/transportadora/data-table.tsx`

**Problema**: Funções `handleSort`, `getUserInitials`, `getStatusBadge`, `handleSelectAll`, `handleSelectRow` são recriadas a cada render.

**Impacto**:
- Cada re-render cria novas referências de função
- Componentes filhos que recebem essas funções como props re-renderizam mesmo que não precisem
- Callbacks inline em JSX criam closures desnecessários

**Solução**:
```typescript
const handleSort = useCallback((columnKey: string) => {
  if (sortColumn === columnKey) {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
  } else {
    setSortColumn(columnKey)
    setSortDirection('asc')
  }
}, [sortColumn, sortDirection])

const getUserInitials = useCallback((name?: string) => {
  if (!name) return 'U'
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}, [])

const getStatusBadge = useCallback((status: string) => {
  const statusLower = status?.toLowerCase() || ''
  // ... lógica existente
}, [])

const handleSelectAll = useCallback((checked: boolean) => {
  // ... lógica existente
}, [currentPage, pageSize, sortedData.length, selectedRows])

const handleSelectRow = useCallback((index: number, checked: boolean) => {
  // ... lógica existente
}, [sortedData.length])
```

---

### 🔴 Problema 2.2: CostDetailTable - Handlers
**Arquivo**: `apps/web/components/costs/cost-detail-table.tsx`

**Problema**: `toggleGroup`, `handleSort`, `handleExport` são recriadas a cada render.

**Impacto**:
- Em listas grandes, essas funções são recriadas centenas de vezes
- Callbacks passados para linhas da tabela causam re-renders cascata

**Solução**:
```typescript
const toggleGroup = useCallback((group: string) => {
  setExpandedGroups(prev => {
    const newExpanded = new Set(prev)
    if (newExpanded.has(group)) {
      newExpanded.delete(group)
    } else {
      newExpanded.add(group)
    }
    return newExpanded
  })
}, [])

const handleSort = useCallback((column: keyof CostDetail) => {
  if (sortColumn === column) {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
  } else {
    setSortColumn(column)
    setSortDirection('desc')
  }
}, [sortColumn, sortDirection])

const handleExport = useCallback((format: 'csv' | 'excel' | 'pdf') => {
  // ... lógica existente usando 'costs' do escopo
}, [costs])
```

---

### 🔴 Problema 2.3: TransportadoraVeiculosPage - handleDelete
**Arquivo**: `apps/web/app/admin/transportadoras/veiculos/page.tsx`

**Problema**: `handleDelete` é passado inline para cada card, criando nova função a cada render.

**Impacto**:
- Com 100 veículos, 100 novas funções são criadas a cada render
- Cards re-renderizam mesmo quando não necessário

**Solução**:
```typescript
const handleDelete = useCallback(async (vehicleId: string, vehiclePlate: string) => {
  if (!confirm(`Excluir veículo "${vehiclePlate}"?`)) return

  try {
    const response = await fetch(`/api/admin/veiculos/delete?id=${vehicleId}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Erro ao excluir')
    notifySuccess('Veículo excluído')
    loadVehicles()
  } catch (error) {
    notifyError(error, "Erro ao excluir veículo")
  }
}, [loadVehicles])
```

---

### 🔴 Problema 2.4: Callbacks inline em map()
**Arquivo**: `apps/web/app/transportadora/page.tsx`

**Problema**: Callbacks inline em `.map()` criam novas funções a cada render:
```typescript
onClick={() => router.push('/transportadora/veiculos')}
onClick={() => {
  try {
    router.push('/transportadora/motoristas')
  } catch (err) {
    window.location.href = '/transportadora/motoristas'
  }
}}
```

**Impacto**:
- Cada KPI card recebe nova função a cada render
- Mesmo com memoização, props mudam constantemente

**Solução**:
```typescript
const handleNavigateVeiculos = useCallback(() => {
  router.push('/transportadora/veiculos')
}, [router])

const handleNavigateMotoristas = useCallback(() => {
  try {
    router.push('/transportadora/motoristas')
  } catch (err) {
    console.error('❌ Router.push failed, using window.location:', err)
    window.location.href = '/transportadora/motoristas'
  }
}, [router])

// Usar nos componentes:
<KpiCard
  onClick={handleNavigateVeiculos}
  // ...
/>
```

---

## 3. Cálculos sem useMemo()

### 🔴 Problema 3.1: Cálculos de Trend inline
**Arquivo**: `apps/web/app/transportadora/page.tsx`

**Problema**: Cálculos de porcentagem de trend são feitos inline no JSX:
```typescript
trend={previousKpis.totalFleet > 0 ? Math.round(((kpis.totalFleet - previousKpis.totalFleet) / previousKpis.totalFleet) * 100) : 0}
```

**Impacto**:
- Cálculo executado 7 vezes a cada render (um para cada KPI)
- Cálculo complexo com divisão e arredondamento
- Re-execução mesmo quando valores não mudaram

**Solução**:
```typescript
const kpiTrends = useMemo(() => ({
  totalFleet: previousKpis.totalFleet > 0 
    ? Math.round(((kpis.totalFleet - previousKpis.totalFleet) / previousKpis.totalFleet) * 100) 
    : 0,
  onRoute: previousKpis.onRoute > 0 
    ? Math.round(((kpis.onRoute - previousKpis.onRoute) / previousKpis.onRoute) * 100) 
    : 0,
  activeDrivers: previousKpis.activeDrivers > 0 
    ? Math.round(((kpis.activeDrivers - previousKpis.activeDrivers) / previousKpis.activeDrivers) * 100) 
    : 0,
  criticalAlerts: previousKpis.criticalAlerts > 0 
    ? Math.round(((kpis.criticalAlerts - previousKpis.criticalAlerts) / previousKpis.criticalAlerts) * 100) 
    : 0,
  totalCostsThisMonth: previousKpis.totalCostsThisMonth > 0 
    ? Math.round(((kpis.totalCostsThisMonth - previousKpis.totalCostsThisMonth) / previousKpis.totalCostsThisMonth) * 100) 
    : 0,
  totalTrips: previousKpis.totalTrips > 0 
    ? Math.round(((kpis.totalTrips - previousKpis.totalTrips) / previousKpis.totalTrips) * 100) 
    : 0,
  delayed: previousKpis.delayed > 0 
    ? Math.round(((kpis.delayed - previousKpis.delayed) / previousKpis.delayed) * 100) 
    : 0,
}), [kpis, previousKpis])

// Usar:
<KpiCard trend={kpiTrends.totalFleet} />
```

---

### 🔴 Problema 3.2: Dados de gráficos recalculados
**Arquivo**: `apps/web/app/transportadora/page.tsx`

**Problema**: `lineChartData`, `fleetStatusData`, `topDriversData` são recalculados a cada render:
```typescript
const lineChartData = hours.map((hour) => ({
  hora: `${hour.toString().padStart(2, '0')}:00`,
  emRota: hour >= 6 && hour <= 22 ? Math.floor(onRouteCount * (0.7 + Math.random() * 0.3)) : Math.floor(onRouteCount * 0.2)
}))
```

**Impacto**:
- Arrays são recriados mesmo quando dados não mudaram
- Gráficos re-renderizam desnecessariamente
- `Math.random()` causa valores diferentes a cada render (bug adicional!)

**Solução**:
```typescript
const lineChartData = useMemo(() => {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  return hours.map((hour) => ({
    hora: `${hour.toString().padStart(2, '0')}:00`,
    emRota: hour >= 6 && hour <= 22 
      ? Math.floor(onRouteCount * 0.85) 
      : Math.floor(onRouteCount * 0.2) // Remover Math.random() - é um bug!
  }))
}, [onRouteCount])

const fleetStatusData = useMemo(() => [
  { name: 'Em Rota', value: onRouteCount },
  { name: 'Disponível', value: availableCount },
  { name: 'Em Manutenção', value: maintenanceCount },
], [onRouteCount, availableCount, maintenanceCount])

const topDriversData = useMemo(() => {
  return (motoristas || [])
    .sort((a, b) => (b.trips_count || 0) - (a.trips_count || 0))
    .slice(0, 5)
    .map(m => ({
      name: m.name || 'Sem nome',
      viagens: m.trips_count || 0
    }))
}, [motoristas])
```

---

### 🔴 Problema 3.3: Activities array recriado
**Arquivo**: `apps/web/app/transportadora/page.tsx`

**Problema**: Array de atividades é recriado a cada render:
```typescript
const activities = [
  ...(alerts?.slice(0, 3).map((a: any) => ({ ... })),
  ...fleetData.slice(0, 2).map((v: any) => ({ ... }))
]
```

**Impacto**:
- Array novo a cada render causa re-render de componente filho
- Transformações de dados executadas desnecessariamente

**Solução**:
```typescript
const activities = useMemo(() => [
  ...(alerts?.slice(0, 3).map((a: any) => ({
    id: `alert-${a.id}`,
    type: 'alert' as const,
    title: `${t('transportadora', 'activity_alert')}: ${a.document_type}`,
    // ...
  })) || []),
  ...fleetData.slice(0, 2).map((v: any) => ({
    id: `veiculo-${v.id}`,
    type: 'veiculo' as const,
    // ...
  }))
], [alerts, fleetData, t])
```

---

## 4. Listas grandes sem virtualização

### 🔴 Problema 4.1: DataTableMobile sem virtualização
**Arquivo**: `apps/web/components/ui/data-table-mobile.tsx`

**Problema**: Renderiza todos os itens da lista de uma vez, mesmo que apenas alguns estejam visíveis.

**Impacto**:
- Com 100+ itens, renderiza 100+ componentes DOM
- Consome muita memória e CPU
- Scroll lento em dispositivos móveis
- Tempo inicial de renderização alto

**Solução**: Implementar virtualização com `react-window` ou `@tanstack/react-virtual`:
```bash
npm install @tanstack/react-virtual
```

```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

export function DataTableMobile<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  className,
  emptyMessage = "Nenhum registro encontrado"
}: DataTableMobileProps<T>) {
  const isMobile = useMobile()
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // altura estimada de cada card
    overscan: 5, // renderizar 5 itens extras fora da viewport
  })

  if (isMobile && data.length > 50) {
    // Usar virtualização para listas grandes
    return (
      <div
        ref={parentRef}
        className={cn("space-y-3 h-[600px] overflow-auto", className)}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = data[virtualRow.index]
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <TableRowCard row={row} columns={columns} onRowClick={onRowClick} />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Fallback para listas pequenas
  // ... código existente
}
```

**Impacto da otimização**:
- Reduz renderização inicial de 100+ componentes para ~10-15
- Melhora performance de scroll em 70-90%
- Reduz uso de memória em ~80%

---

### 🔴 Problema 4.2: CostDetailTable sem virtualização
**Arquivo**: `apps/web/components/costs/cost-detail-table.tsx`

**Problema**: Tabela renderiza todas as linhas, mesmo com paginação. Em modo "expand all groups", pode renderizar centenas de linhas.

**Impacto**:
- Com 500+ custos agrupados e expandidos, renderiza todas as linhas
- Performance degrada linearmente com número de itens
- Browser pode travar temporariamente

**Solução**: Adicionar virtualização para a viewport visível:
```typescript
// Aplicar virtualização quando há muitos itens visíveis
const shouldVirtualize = paginatedCosts.length > 100 || (grouping !== 'none' && Object.keys(groupedData.groups || {}).length > 20)

if (shouldVirtualize && !isMobile) {
  // Usar react-window ou similar para virtualizar linhas da tabela
  // ...
}
```

---

### 🔴 Problema 4.3: Lista de veículos sem virtualização
**Arquivo**: `apps/web/app/admin/transportadoras/veiculos/page.tsx`

**Problema**: Renderiza todos os veículos filtrados sem virtualização:
```typescript
filteredVehicles.map((veiculo) => (
  <motion.div key={veiculo.id}>
    <Card>...</Card>
  </motion.div>
))
```

**Impacto**:
- Com 200+ veículos, renderiza 200+ cards
- Animations do framer-motion multiplicam o custo
- Scroll pesado

**Solução**: Virtualizar lista quando > 50 itens:
```typescript
const shouldVirtualize = filteredVehicles.length > 50

{shouldVirtualize ? (
  <VirtualizedVehicleList 
    vehicles={filteredVehicles}
    onEdit={handleEdit}
    onDelete={handleDelete}
  />
) : (
  // Renderização normal para listas pequenas
  filteredVehicles.map(...)
)}
```

---

## 5. Imagens não otimizadas

### 🔴 Problema 5.1: Uso de <img> ao invés de Next.js Image
**Arquivos**:
- `apps/web/components/ui/document-card.tsx` (linha 239)
- `apps/web/app/admin/transportadoras/veiculos/page.tsx` (linha 232)
- `apps/web/components/empresa/empresa-logo-section.tsx` (linha 28)

**Problema**: Usa tag `<img>` HTML nativa ao invés do componente `Image` do Next.js.

**Impacto**:
- Sem otimização automática de imagens
- Sem lazy loading eficiente
- Sem geração de srcsets para diferentes resoluções
- Sem WebP/AVIF quando suportado
- Maior consumo de banda
- Imagens bloqueiam renderização

**Solução**:
```typescript
// Substituir em document-card.tsx:
import Image from 'next/image'

// Antes:
<img
  src={fileUrl}
  alt={documentLabel}
  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
  onClick={handleView}
/>

// Depois:
<Image
  src={fileUrl}
  alt={documentLabel}
  fill
  className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
  onClick={handleView}
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="lazy"
  quality={85}
/>

// Para veiculos/page.tsx:
<Image
  src={veiculo.photo_url}
  alt={veiculo.plate}
  width={80}
  height={80}
  className="rounded-lg object-cover border-2 border-border flex-shrink-0"
  loading="lazy"
  quality={80}
/>

// Para empresa-logo-section.tsx:
<Image
  src={logoUrl}
  alt={companyName || 'Empresa'}
  width={40}
  height={40}
  className="h-8 sm:h-10 w-auto object-contain"
  loading="lazy"
  decoding="async"
  onError={() => setImgFailed(true)}
/>
```

**Impacto da otimização**:
- Reduz tamanho de imagens em 30-50% (WebP/AVIF)
- Melhora LCP (Largest Contentful Paint) em 20-40%
- Reduz consumo de banda em mobile
- Lazy loading reduz carga inicial

---

### 🔴 Problema 5.2: Imagens sem dimensões explícitas
**Arquivo**: `apps/web/components/ui/document-card.tsx`

**Problema**: Imagem em container com `aspect-video` mas sem dimensões fixas causa layout shift.

**Impacto**:
- CLS (Cumulative Layout Shift) negativo
- Imagens carregam sem espaço reservado
- Experiência visual ruim

**Solução**: Adicionar dimensões ou usar aspect ratio do Next.js Image:
```typescript
<div className="relative aspect-video rounded-lg overflow-hidden bg-muted w-full">
  <Image
    src={fileUrl}
    alt={documentLabel}
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, 50vw"
  />
</div>
```

---

## Resumo de Impacto

### Prioridade Alta (Implementar imediatamente)
1. ✅ Virtualização de listas grandes (>50 itens)
2. ✅ useCallback para handlers principais
3. ✅ Next.js Image para todas as imagens
4. ✅ React.memo para componentes de lista

**Impacto esperado**: Melhoria de 40-60% em performance geral

### Prioridade Média (Implementar em breve)
1. ⚠️ useMemo para cálculos de gráficos e trends
2. ⚠️ React.memo para KpiCard e componentes filhos
3. ⚠️ Otimização de callbacks inline

**Impacto esperado**: Melhoria adicional de 20-30% em performance

### Prioridade Baixa (Melhorias incrementais)
1. ℹ️ Otimizações menores de useMemo em cálculos simples
2. ℹ️ Refinamentos de comparações em React.memo

**Impacto esperado**: Melhoria adicional de 10-15% em performance

---

## Métricas de Sucesso

Após implementação, medir:
- **FCP (First Contentful Paint)**: Redução esperada de 20-30%
- **LCP (Largest Contentful Paint)**: Redução esperada de 30-40%
- **TTI (Time to Interactive)**: Redução esperada de 25-35%
- **CLS (Cumulative Layout Shift)**: Redução esperada de 50-70%
- **Scroll FPS**: Manter 60fps mesmo com 100+ itens
- **Memory Usage**: Redução de 30-50% em listas grandes

---

## Próximos Passos

1. Criar branch `perf/optimizations`
2. Implementar otimizações de prioridade alta
3. Adicionar testes de performance
4. Medir métricas antes/depois
5. Criar PR com resultados

