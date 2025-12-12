@echo off
echo ==========================================
echo DIAGNOSTICO DE AMBIENTE MCP
echo ==========================================
echo.
echo [1/3] Verificando Versoes...
echo Node: 
node -v
echo NPX:
call npx --version
echo.
echo ==========================================
echo [2/3] Teste: Sequential Thinking
echo O comando abaixo vai tentar baixar e rodar o servidor basico.
echo SE FUNCIONAR: Vai ficar parado esperando input (cursor piscando) ou mostrar logs JSON.
echo SE FALHAR: Vai mostrar erro vermelho ou pedir confirmacao (Y/N).
echo.
echo Pressione ENTER para iniciar. Se funcionar, use CTRL+C para cancelar e ir para o proximo.
pause
call npx -y @modelcontextprotocol/server-sequential-thinking
echo.
echo ==========================================
echo [3/3] Teste: Supabase MCP
echo Este e o teste critico.
echo Pressione ENTER para iniciar.
pause
call npx -y @supabase/mcp-server-supabase@latest --access-token sbp_f988df0e27970143829ab66491f56fbaccf49b59
echo.
echo Diagnostico concluido. Envie um print se houver erros.
pause
