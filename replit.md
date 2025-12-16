# GolfFox - Sistema de Gestão de Transporte Corporativo

## Overview
GolfFox é uma plataforma de gestão de frotas e transporte corporativo com aplicações web e mobile.

## Project Structure
- `apps/web/` - Aplicação Web (Next.js 16 + React 19) - Deploy na Vercel
- `apps/mobile/` - Aplicativo Mobile (React Native/Expo) - Desenvolvimento local

## Key Technologies

### Web (apps/web)
- **Framework**: Next.js 16 com React 19
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Maps**: Google Maps API
- **UI Components**: Radix UI, Framer Motion
- **Authentication**: Custom com Supabase Auth

### Mobile (apps/mobile)
- **Framework**: React Native / Expo
- **UI Library**: React Native Paper (Material Design 3)
- **Navigation**: Expo Router
- **State**: React Context API

## Design System - Paleta de Cores Unificada

A paleta de cores foi unificada entre web e mobile:

### Cores Principais
- **Brand/Primary**: `#F97316` (Laranja)
- **Brand Light**: `#FB923C`
- **Brand Background**: `#FFF7ED`
- **Success**: `#10B981` (Verde)
- **Warning**: `#F59E0B` (Amarelo)
- **Error**: `#EF4444` (Vermelho)
- **Info**: `#3B82F6` (Azul)

### Cores de Texto
- **Text Primary**: `#0F172A`
- **Text Secondary**: `#64748B`
- **Text Muted**: `#94A3B8`

### Cores de Background
- **Background**: `#F8FAFC`
- **Surface**: `#FFFFFF`
- **Surface Variant**: `#F1F5F9`
- **Border**: `#E2E8F0`

## Environment Variables
A aplicação web requer:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key

## Deployment
- **Web**: Vercel (https://golffox.vercel.app)
- **Mobile**: Desenvolvimento local (localhost:8081)

## Recent Changes (2025-01-06)

### Correções Aplicadas

1. **Web - layout.tsx**: 
   - Movido `themeColor` de metadata para viewport export (correção Next.js 16 warning)

2. **Mobile - _layout.tsx**:
   - Atualizada paleta de cores do tema para usar laranja (#F97316) como cor primária
   - Alinhamento visual com a aplicação web

3. **Mobile - login.tsx**:
   - Título e botão atualizados para usar cor laranja (#F97316)

4. **Mobile - driver/index.tsx**:
   - Todas as referências de cores teal substituídas por laranja
   - Gradientes, tabs, labels, avatars e ícones atualizados

5. **Mobile - passenger/index.tsx**:
   - Header gradient atualizado para laranja
   - Botões e ícones principais usando a nova paleta

### Problemas Conhecidos (TODOs)

1. **CSRF Bypass Temporário** (apps/web/app/api/auth/login/route.ts):
   - Há um bypass de CSRF temporário para produção na Vercel para diagnóstico
   - TODO: Remover após identificar problema de cookies na Vercel

2. **Dados Mock em Produção**:
   - Dashboard do motorista e passageiro usam dados mock
   - Implementar integração com Supabase para dados reais

## Development Notes

- Este projeto NÃO roda no Replit - apenas análise de código
- Web está deployado na Vercel
- Mobile roda localmente com Expo
