## 📋 Descrição
Descreva brevemente as mudanças implementadas neste PR.

## 🔗 Issue Relacionada
Fixes #(número da issue)

## 🎯 Tipo de Mudança
- [ ] 🐛 Bug fix (mudança que corrige um problema)
- [ ] ✨ Nova funcionalidade (mudança que adiciona funcionalidade)
- [ ] 💥 Breaking change (correção ou funcionalidade que causaria quebra de funcionalidade existente)
- [ ] 📚 Documentação (mudanças apenas na documentação)
- [ ] 🎨 Refatoração (mudança de código que não corrige bug nem adiciona funcionalidade)
- [ ] ⚡ Performance (mudança que melhora performance)
- [ ] 🧪 Testes (adição ou correção de testes)
- [ ] 🔧 Chore (mudanças no processo de build, ferramentas auxiliares, etc.)

## 🧪 Como Foi Testado?
Descreva os testes que você executou para verificar suas mudanças.

- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Testes manuais
- [ ] Testes de performance

**Configuração de Teste:**
- Versão do Flutter:
- Versão do Node.js:
- Dispositivo/Browser:

## 📱 Capturas de Tela (se aplicável)
Adicione capturas de tela para demonstrar as mudanças visuais.

## ✅ Checklist
- [ ] Meu código segue as diretrizes de estilo deste projeto
- [ ] Eu realizei uma auto-revisão do meu próprio código
- [ ] Eu comentei meu código, particularmente em áreas difíceis de entender
- [ ] Eu fiz mudanças correspondentes na documentação
- [ ] Minhas mudanças não geram novos warnings
- [ ] Eu adicionei testes que provam que minha correção é efetiva ou que minha funcionalidade funciona
- [ ] Testes unitários novos e existentes passam localmente com minhas mudanças
- [ ] Quaisquer mudanças dependentes foram mescladas e publicadas em módulos downstream

## 🔍 Revisão de Código
- [ ] O código está limpo e bem estruturado
- [ ] As funções são pequenas e fazem apenas uma coisa
- [ ] Os nomes de variáveis e funções são descritivos
- [ ] Não há código duplicado
- [ ] Não há hardcoded values (valores fixos no código)
- [ ] Tratamento de erros adequado
- [ ] Performance considerada

## 📋 Notas Adicionais
Adicione quaisquer notas sobre o PR aqui.

---

## 🔒 Checklist de Segurança
- [ ] Cookies de sessão `httpOnly`, `secure`, `sameSite=lax` e payload mínimo confirmados
- [ ] Nenhum token/senha exposto em cookies, logs ou responses
- [ ] RLS v49 aplicada e verificada em `gf_user_company_map`
- [ ] Endpoints sensíveis com `withRateLimit`

## ⚡ Checklist de Performance
- [ ] Export/relatórios usam paginação e seleção de colunas
- [ ] Streaming CSV habilitado (custos/export, reports/run)
- [ ] Consultas supabase sem `.select('*')` em endpoints de alto custo

## 🛰️ Checklist de Observabilidade
- [ ] `@sentry/nextjs` habilitado condicionalmente (web)
- [ ] `sentry_flutter` integrado (mobile)
- [ ] Logs padronizados via `logger.ts`

## 📚 Checklist de Documentação
- [ ] `docs/ARQUITETURA_ATUAL.md` atualizado
- [ ] `docs/GUIA_MIGRACAO_REPERTORIO.md` atualizado
- [ ] OpenAPI publicado (`/api/docs/openapi`, `docs/api/openapi.json`)
- [ ] Conteúdos redundantes movidos para `archive/LEGADO_NAO_USAR`

## 📎 Anexos
- `docs/reports/V49_POLICY_REPORT.md` – relatório de políticas RLS v49
