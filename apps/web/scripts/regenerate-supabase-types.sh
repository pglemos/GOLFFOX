#!/bin/bash
# Script para regenerar tipos do Supabase
# Uso: ./scripts/regenerate-supabase-types.sh [TOKEN]

set -e

PROJECT_ID="vmoxzesvjcfmrebagcwo"
OUTPUT_FILE="types/supabase.ts"

# Verificar se o token foi fornecido
if [ -z "$1" ] && [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ Erro: Access token não fornecido!"
    echo ""
    echo "Uso:"
    echo "  $0 [TOKEN]"
    echo "  OU"
    echo "  export SUPABASE_ACCESS_TOKEN='seu-token'"
    echo "  $0"
    echo ""
    echo "Para obter um token:"
    echo "  1. Acesse: https://supabase.com/dashboard/account/tokens"
    echo "  2. Gere um novo token"
    echo "  3. Copie e use no comando acima"
    exit 1
fi

# Usar token fornecido como argumento ou variável de ambiente
if [ -n "$1" ]; then
    export SUPABASE_ACCESS_TOKEN="$1"
fi

echo "🔄 Regenerando tipos do Supabase..."
echo "   Project ID: $PROJECT_ID"
echo "   Output: $OUTPUT_FILE"
echo ""

# Fazer backup do arquivo atual se existir
if [ -f "$OUTPUT_FILE" ]; then
    BACKUP_FILE="${OUTPUT_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📦 Fazendo backup do arquivo atual..."
    cp "$OUTPUT_FILE" "$BACKUP_FILE"
    echo "   Backup salvo em: $BACKUP_FILE"
    echo ""
fi

# Gerar tipos
echo "⚙️  Executando comando de geração..."
if npx supabase gen types typescript --project-id "$PROJECT_ID" > "$OUTPUT_FILE" 2>&1; then
    # Verificar se o arquivo foi criado e não está vazio
    if [ -f "$OUTPUT_FILE" ] && [ -s "$OUTPUT_FILE" ]; then
        FILE_SIZE=$(wc -c < "$OUTPUT_FILE")
        echo ""
        echo "✅ Tipos gerados com sucesso!"
        echo "   Arquivo: $OUTPUT_FILE"
        echo "   Tamanho: $FILE_SIZE bytes"
        echo ""
        echo "📝 Próximos passos:"
        echo "   1. Verificar se os erros TS2306 foram resolvidos"
        echo "   2. Executar: npm run type-check"
        echo "   3. Corrigir qualquer erro de tipo restante"
    else
        echo ""
        echo "❌ Erro: Arquivo gerado está vazio ou não foi criado!"
        echo "   Verifique a saída acima para mais detalhes."
        exit 1
    fi
else
    echo ""
    echo "❌ Erro ao gerar tipos!"
    echo "   Verifique se:"
    echo "   - O token está correto e válido"
    echo "   - Você tem acesso ao projeto $PROJECT_ID"
    echo "   - Sua conexão com a internet está funcionando"
    exit 1
fi

