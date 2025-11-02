# Componentes UI - GOLF FOX

## 📦 Componentes Criados

### Componentes Base (`components/ui/`)

1. **Button** (`button.tsx`)
   - Variantes: default, destructive, outline, secondary, ghost, link
   - Tamanhos: default, sm, lg, icon
   - Animações com hover scale

2. **Card** (`card.tsx`)
   - Card principal + CardHeader, CardTitle, CardDescription, CardContent, CardFooter
   - Bordas arredondadas (rounded-2xl)
   - Background com backdrop-blur

3. **Input** (`input.tsx`)
   - Input estilizado com foco ring
   - Placeholder estilizado
   - Estados disabled

4. **Badge** (`badge.tsx`)
   - Variantes: default, secondary, destructive, outline, success, warning
   - Bordas arredondadas (rounded-full)

5. **Dialog** (`dialog.tsx`)
   - Modal/Dialog com Radix UI
   - Animações de entrada/saída
   - Overlay com backdrop-blur
   - DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogContent

6. **Select** (`select.tsx`)
   - Dropdown select com Radix UI
   - Scroll buttons
   - Animações
   - SelectTrigger, SelectContent, SelectItem, SelectLabel, SelectSeparator

7. **Table** (`table.tsx`)
   - Tabela completa com header, body, footer
   - TableRow, TableHead, TableCell, TableCaption
   - Hover states
   - Bordas estilizadas

### Componentes Customizados (`components/`)

1. **AppShell** (`app-shell.tsx`)
   - Layout principal com sidebar animada
   - Topbar com badge "Admin • Premium"
   - Sidebar com 11 abas animadas (Framer Motion)
   - Responsivo com menu mobile

2. **FleetMap** (`fleet-map.tsx`)
   - Mapa Google Maps com veículos em tempo real
   - Veículos coloridos por status (VERDE/AMARELO/VERMELHO/AZUL)
   - Filtros: Empresa, Rota, Status, Turno
   - Painel lateral do veículo selecionado
   - Ações flutuantes: Recentrar, Hoje, Histórico, Camadas
   - Legenda de cores
   - Realtime via Supabase

3. **KpiCard** (`kpi-card.tsx`)
   - Card de KPI com ícone, label, value, hint
   - Animações hover (scale, y)
   - Trend indicator
   - Tipos de ícone (Lucide React)

## 🎨 Design System

### Cores (CSS Variables)
- `--bg`: Fundo principal
- `--bg-soft`: Fundo suave (cards)
- `--ink`: Texto principal
- `--muted`: Texto secundário
- `--brand`: Azul principal (#2563FF)
- `--accent`: Laranja (#FF6B35)
- `--ok`: Verde (#16A34A)
- `--warn`: Amarelo (#F59E0B)
- `--err`: Vermelho (#DC2626)

### Bordas
- `rounded-xl`: 16px (padrão)
- `rounded-2xl`: 24px (cards grandes)

### Sombras
- `shadow-md`: Sombra padrão
- `shadow-lg`: Sombra hover
- `shadow-xl`: Sombra destacada

### Animações
- Hover scale: `scale-[1.02]` ou `scale-105`
- Transições: `transition-all duration-180`
- Framer Motion: Para animações complexas

## 📝 Uso dos Componentes

### Button
```tsx
<Button variant="default" size="default">
  Click me
</Button>
```

### Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Dialog
```tsx
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    Content
  </DialogContent>
</Dialog>
```

### Select
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Table
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Item 1</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### KpiCard
```tsx
<KpiCard
  icon={Users}
  label="Total Users"
  value={156}
  hint="+12% vs yesterday"
  trend={12}
/>
```

## ✅ Dependências

Todas as dependências necessárias já estão instaladas:
- `@radix-ui/react-dialog`
- `@radix-ui/react-select`
- `framer-motion`
- `lucide-react`
- `clsx` e `tailwind-merge` (via `lib/utils.ts`)

## 🎯 Componentes Usados nas Páginas

### Admin Dashboard
- KpiCard (4 cards de KPI)
- Card (Quick Actions, Recent Activities)
- Badge (Status)
- Button (Actions)

### Mapa da Frota
- FleetMap (Componente principal)
- Card (Filtros, Painel lateral)
- Input (Busca)
- Button (Ações flutuantes)
- Badge (Status do veículo)

### Rotas
- Card (Lista de rotas)
- Button (Ações)
- Input (Busca)
- Select (Filtros)

### Outras Páginas
- Card (Layout principal)
- Button (Ações)
- Input (Forms)
- Badge (Status)
- Dialog (Modais futuros)
- Select (Dropdowns)
- Table (Listas futuras)

---

**Todos os componentes estão prontos para uso!**

