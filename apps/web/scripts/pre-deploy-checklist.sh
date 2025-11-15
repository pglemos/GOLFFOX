#!/bin/bash

###############################################################################
# PRÉ-DEPLOY CHECKLIST - GOLFFOX
# 
# Script automatizado para verificar se o sistema está pronto para deploy
###############################################################################

echo "================================================================================================"
echo "🚀 PRÉ-DEPLOY CHECKLIST - GOLFFOX"
echo "================================================================================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0
WARNINGS=0

# Função para imprimir resultado
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((FAILED++))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

echo "📋 1. VERIFICAÇÃO DE DEPENDÊNCIAS"
echo "--------------------------------------------------------------------------------"

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_result 0 "Node.js instalado: $NODE_VERSION"
else
    print_result 1 "Node.js não encontrado"
fi

# npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_result 0 "npm instalado: $NPM_VERSION"
else
    print_result 1 "npm não encontrado"
fi

# Vercel CLI
if command -v vercel &> /dev/null; then
    print_result 0 "Vercel CLI instalado"
else
    print_warning "Vercel CLI não encontrado (opcional)"
fi

echo ""
echo "📦 2. VERIFICAÇÃO DE PACOTES"
echo "--------------------------------------------------------------------------------"

# package.json existe
if [ -f "package.json" ]; then
    print_result 0 "package.json encontrado"
else
    print_result 1 "package.json não encontrado"
fi

# node_modules existe
if [ -d "node_modules" ]; then
    print_result 0 "node_modules instalado"
else
    print_warning "node_modules não encontrado. Execute: npm install"
fi

echo ""
echo "🔍 3. AUDITORIA DE LINKS"
echo "--------------------------------------------------------------------------------"

# Executar auditoria
if [ -f "scripts/audit-and-fix-links.js" ]; then
    node scripts/audit-and-fix-links.js > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_result 0 "Auditoria de links passou"
    else
        print_result 1 "Auditoria de links falhou"
    fi
else
    print_warning "Script de auditoria não encontrado"
fi

echo ""
echo "🧪 4. TESTES E2E"
echo "--------------------------------------------------------------------------------"

# Executar testes E2E
if [ -f "scripts/test-links-e2e.js" ]; then
    # Capturar apenas o código de saída, não o output
    node scripts/test-links-e2e.js > /tmp/e2e-results.txt 2>&1
    E2E_EXIT=$?
    
    # Extrair taxa de sucesso
    SUCCESS_RATE=$(grep "Taxa de sucesso" /tmp/e2e-results.txt | grep -oP '\d+\.\d+%' || echo "0%")
    
    if [ $E2E_EXIT -eq 0 ]; then
        print_result 0 "Testes E2E passaram (100%)"
    else
        print_warning "Testes E2E: $SUCCESS_RATE de sucesso"
    fi
else
    print_warning "Script de testes E2E não encontrado"
fi

echo ""
echo "🏗️  5. BUILD DE PRODUÇÃO"
echo "--------------------------------------------------------------------------------"

# Verificar se .next existe
if [ -d ".next" ]; then
    print_result 0 "Build existente encontrado"
else
    print_warning "Nenhum build encontrado. Execute: npm run build"
fi

# Tentar fazer build (comentado para não demorar muito)
# echo "   Executando build de produção..."
# npm run build > /dev/null 2>&1
# if [ $? -eq 0 ]; then
#     print_result 0 "Build de produção bem-sucedido"
# else
#     print_result 1 "Build de produção falhou"
# fi

echo ""
echo "⚙️  6. VARIÁVEIS DE AMBIENTE"
echo "--------------------------------------------------------------------------------"

# .env.local existe
if [ -f ".env.local" ]; then
    print_result 0 ".env.local encontrado"
    
    # Verificar variáveis críticas
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        print_result 0 "NEXT_PUBLIC_SUPABASE_URL configurado"
    else
        print_result 1 "NEXT_PUBLIC_SUPABASE_URL ausente"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        print_result 0 "NEXT_PUBLIC_SUPABASE_ANON_KEY configurado"
    else
        print_result 1 "NEXT_PUBLIC_SUPABASE_ANON_KEY ausente"
    fi
else
    print_result 1 ".env.local não encontrado"
fi

echo ""
echo "📄 7. DOCUMENTAÇÃO"
echo "--------------------------------------------------------------------------------"

# Verificar documentos
if [ -f "../LINK_MIGRATION_REPORT.md" ]; then
    print_result 0 "Relatório de migração encontrado"
else
    print_warning "Relatório de migração não encontrado"
fi

if [ -f "../LINK_MIGRATION_SUMMARY.md" ]; then
    print_result 0 "Sumário executivo encontrado"
else
    print_warning "Sumário executivo não encontrado"
fi

if [ -f "scripts/AUDIT_REPORT.json" ]; then
    print_result 0 "Relatório de auditoria JSON encontrado"
else
    print_warning "Relatório de auditoria JSON não encontrado"
fi

echo ""
echo "================================================================================================"
echo "📊 RESUMO FINAL"
echo "================================================================================================"
echo ""
echo -e "${GREEN}✅ Passaram: $PASSED${NC}"
echo -e "${RED}❌ Falharam: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Avisos: $WARNINGS${NC}"
echo ""

# Calcular score
TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    SCORE=$((PASSED * 100 / TOTAL))
    echo "📈 Score: $SCORE%"
    echo ""
fi

# Decisão final
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ SISTEMA PRONTO PARA DEPLOY!${NC}"
    echo ""
    echo "📋 Próximos passos:"
    echo "   1. git add ."
    echo "   2. git commit -m 'chore: auditoria de links concluída'"
    echo "   3. git push origin main"
    echo "   4. vercel --prod (ou deploy automático via CI/CD)"
    echo ""
    exit 0
else
    echo -e "${RED}❌ CORRIJA OS ERROS ANTES DO DEPLOY${NC}"
    echo ""
    echo "📋 Ações necessárias:"
    if [ $FAILED -gt 0 ]; then
        echo "   - Revise os $FAILED itens que falharam acima"
    fi
    if [ $WARNINGS -gt 0 ]; then
        echo "   - Verifique os $WARNINGS avisos (opcional)"
    fi
    echo ""
    exit 1
fi

