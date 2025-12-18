---
description: Regras críticas do projeto GOLFFOX - NUNCA violar
---

# REGRAS CRÍTICAS DO PROJETO GOLFFOX

## 1. VERSÃO DO NEXT.JS
> [!CAUTION]
> **NUNCA ALTERAR A VERSÃO DO NEXT.JS**
> - O projeto DEVE usar **Next.js 16.x** (atualmente 16.0.10)
> - NÃO fazer downgrade para Next.js 15 ou anterior
> - NÃO sugerir alteração de versão do Next.js
> - Se houver problemas com Next.js 16, buscar outras soluções

## 2. PROBLEMA DO SWC NATIVO
O sistema do usuário (Windows 10 24H2) tem incompatibilidade com o binário SWC nativo (@next/swc-win32-x64-msvc).
- O erro "Uma rotina de inicialização da biblioteca de vínculo dinâmico (DLL) falhou" é conhecido
- Visual C++ Redistributable já está instalado (v14.44)
- Todas as DLLs necessárias estão presentes
- O problema é incompatibilidade do binário com Windows 10 24H2 (Build 26100)

## 3. SOLUÇÕES PERMITIDAS
- Usar webpack com WASM bindings (mais lento mas funcional)
- Aguardar atualização do Next.js que corrija o problema
- Buscar versões alternativas do SWC que sejam compatíveis
- NÃO fazer downgrade do Next.js

## 4. TECNOLOGIAS FIXAS
- Next.js: 16.x
- React: 19.x
- Node.js: 22.x
- Supabase: @supabase/supabase-js
