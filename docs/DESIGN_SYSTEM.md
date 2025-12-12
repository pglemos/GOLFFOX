# Design System - Componentes UI GolfFox

## Visão Geral
O GolfFox utiliza **shadcn/ui** como base do Design System, complementado com **Framer Motion** para animações e **Recharts** para visualização de dados.

## Componentes Base

### Cards (`@/components/ui/card`)
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>Conteúdo</CardContent>
</Card>
```

### Botões (`@/components/ui/button`)
Variantes: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
```tsx
<Button variant="default">Primário</Button>
<Button variant="outline">Secundário</Button>
<Button variant="destructive">Deletar</Button>
```

### Badges (`@/components/ui/badge`)
```tsx
<Badge>Default</Badge>
<Badge variant="secondary">Info</Badge>
<Badge variant="destructive">Erro</Badge>
<Badge variant="outline">Outline</Badge>
```

### Dialog (`@/components/ui/dialog`)
```tsx
<Dialog>
  <DialogTrigger asChild><Button>Abrir</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader><DialogTitle>Título</DialogTitle></DialogHeader>
    {/* conteúdo */}
    <DialogFooter><Button>Confirmar</Button></DialogFooter>
  </DialogContent>
</Dialog>
```

### Select (`@/components/ui/select`)
```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="opt1">Opção 1</SelectItem>
  </SelectContent>
</Select>
```

### Inputs
- `Input` - Campo de texto padrão
- `Textarea` - Área de texto multi-linha
- `Checkbox` - Caixas de seleção
- `Switch` - Toggle on/off

### DataTable (`@/components/ui/data-table-premium`)
Tabela avançada com paginação, ordenação e filtros.

### DateRangePicker (`@/components/ui/date-range-picker`)
Seleção de intervalo de datas com Popover.

### FileUpload (`@/components/ui/file-upload`)
Upload de arquivos com drag-and-drop.

## Layout

### AppShell (`@/components/app-shell`)
Container principal com Sidebar + Header + Conteúdo.
```tsx
<AppShell panel="admin" user={user}>
  {children}
</AppShell>
```

### PremiumSidebar (`@/components/premium-sidebar`)
Menu lateral colapsável por painel.

## Feedback Visual

### Toast (`@/lib/toast`)
```tsx
import { notifySuccess, notifyError } from "@/lib/toast"
notifySuccess("Operação realizada!")
notifyError("Erro ao processar")
```

### Loading States
```tsx
import { SkeletonList, SkeletonCard } from "@/components/ui/skeleton"
{loading ? <SkeletonList count={5} /> : <Content />}
```

## Cores (Tailwind CSS v4)
- `--primary`: Azul principal
- `--muted`: Cinza suave para fundos
- `--destructive`: Vermelho para erros
- `--accent`: Cor de destaque

## Tipografia
- `text-2xl font-bold` - Títulos de página
- `text-lg font-semibold` - Subtítulos
- `text-sm text-muted-foreground` - Texto secundário
