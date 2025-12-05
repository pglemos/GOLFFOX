# 🚀 GolfFox Web App - Guia de Início Rápido

Aplicação web premium criada com **Next.js 16**, **Tailwind CSS v4**, **Framer Motion** e **Supabase**.

## Pré-requisitos

- **Node.js**: 22.x ou superior
- **npm**: 9.0.0 ou superior

## 📦 Instalação

```powershell
# 1. Entre na pasta do projeto web
cd web-app

# 2. Instale as dependências
npm install

# 3. Execute em modo desenvolvimento
npm run dev
```

A aplicação estará disponível em: **http://localhost:3000**

## 🎯 Contas de Demonstração

Todas as contas usam a senha: **`senha123`**

| Papel | Email |
|-------|-------|
| Admin | golffox@admin.com |
| Operador | operador@empresa.com |
| Transportadora | transportadora@trans.com |
| Motorista | motorista@trans.com |
| Passageiro | passageiro@empresa.com |

## 🎨 Features Implementadas

✅ **Tela de Login** com chips de contas demo  
✅ **AppShell** com topbar + sidebar glass effect  
✅ **Componentes base** (Button, Input, Card, Badge, KpiCard)  
✅ **Tema dark/light** com prefers-color-scheme  
✅ **Animações** com Framer Motion  
✅ **Dashboard Admin** com KPIs e métricas  
✅ **Design System** premium (Apple/Tesla/Nubank/Nike)  

## 📁 Estrutura de Arquivos

```
web-app/
├── app/
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx          # Login
│   ├── globals.css       # Tokens CSS
│   ├── admin/
│   │   └── page.tsx      # Dashboard Admin
│   └── ... (outras rotas)
├── components/
│   ├── ui/               # Componentes base
│   ├── app-shell.tsx     # Topbar + Sidebar
│   └── kpi-card.tsx      # Card de KPI
├── lib/
│   ├── supabase.ts      # Cliente Supabase
│   └── utils.ts         # Utilitários
└── package.json         # Dependências
```

## 🎯 Próximos Passos

Para completar a aplicação, ainda falta:

- [ ] Página Operator Dashboard
- [ ] Página Carrier Dashboard  
- [ ] Página Driver Dashboard
- [ ] Página Passenger Dashboard
- [ ] Integração completa com Supabase
- [ ] Mapas com markers
- [ ] Gráficos com Recharts

## 🔧 Troubleshooting

### Erro: "Module not found"

Execute:
```bash
npm install
```

### Erro: "Port 3000 already in use"

Execute:
```bash
npm run dev -- -p 3001
```

## 📚 Recursos

- [Documentação Next.js](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Supabase](https://supabase.com/docs)

## ✨ Design System

### Cores
- **Background:** `#0B1220` (dark) | `#F7F9FC` (light)
- **Brand:** `#2563FF` (azul vibrante)
- **Accent:** `#FF6B35` (laranja)
- **Status:** Success `#16A34A`, Warning `#F59E0B`, Error `#DC2626`

### Tipografia
- **Font:** Inter (Google Fonts)
- **Títulos:** 28-32px | Weight 700
- **Corpo:** 14-16px | Weight 400-500

### Espaçamento
- **Grid:** 12 colunas
- **Container max:** 1440px
- **Spacing:** 8px base
- **Radius:** 16px (xl) | 24px (2xl)

---

**Dúvidas?** Consulte o README.md dentro de `web-app/`
