# 🧪 Guia de Teste de Login - GolfFox

## 📋 Checklist de Teste

Use este guia para testar o fluxo de login após as correções aplicadas.

---

## ✅ Pré-requisitos

- [ ] Deploy do Vercel completado (aguarde 2-3 minutos após push)
- [ ] Cache do navegador limpo
- [ ] Credenciais de teste disponíveis

---

## 🧪 Teste 1: Acessar Página de Login

### Passos:
1. Acesse: `https://golffox.vercel.app/`
2. Verifique se a página de login carrega normalmente
3. Verifique se não fica em "Carregando..." indefinidamente

### Resultado Esperado:
- ✅ Página de login renderiza completamente
- ✅ Formulário de login está visível
- ✅ Campos de email e senha funcionam
- ✅ Botão "Entrar" está habilitado

### Se houver problema:
- Limpe o cache do navegador (Ctrl + Shift + Delete)
- Verifique o console do navegador (F12) para erros
- Verifique se o deploy do Vercel foi completado

---

## 🧪 Teste 2: Fazer Login

### Passos:
1. Preencha o email: `golffox@admin.com` (ou outro usuário válido)
2. Preencha a senha: `senha123` (ou senha do usuário)
3. Clique em "Entrar"
4. **OBSERVE:** Não deve ficar em loop de redirecionamento

### Resultado Esperado:
- ✅ Login processa (mostra "Validando credenciais...")
- ✅ Redireciona para `/admin` (ou painel correto baseado no role)
- ✅ **NÃO** fica atualizando a página sem parar
- ✅ Página do painel admin carrega normalmente

### Se houver problema:
- Abra o console do navegador (F12)
- Verifique os logs:
  - `🔐 Persistindo sessão do Supabase no cliente...`
  - `✅ Sessão do Supabase definida via setSession()` ou `✅ Sessão persistida manualmente`
  - `🚀 Preparando redirecionamento:`
- Verifique se há erros no console

---

## 🧪 Teste 3: Verificar Sessão Persistida

### Passos:
1. Após fazer login com sucesso
2. Abra o console do navegador (F12)
3. Vá na aba "Application" (Chrome) ou "Storage" (Firefox)
4. Verifique o localStorage

### Resultado Esperado:
- ✅ Deve existir uma chave: `sb-<project-ref>-auth-token`
- ✅ Deve conter os tokens de acesso
- ✅ Cookie `golffox-session` deve estar presente

### Verificar no Console:
```javascript
// Verificar localStorage
Object.keys(localStorage).filter(k => k.includes('supabase') || k.includes('auth'))

// Verificar cookie
document.cookie.includes('golffox-session')
```

---

## 🧪 Teste 4: Verificar Acesso ao Painel Admin

### Passos:
1. Após login bem-sucedido, você deve ser redirecionado para `/admin`
2. Verifique se a página do painel admin carrega
3. Verifique se os dados são carregados (KPIs, gráficos, etc.)

### Resultado Esperado:
- ✅ Página admin carrega sem erros
- ✅ Dados são exibidos (ou mensagem "Carregando..." temporária)
- ✅ Menu lateral funciona
- ✅ Navegação entre páginas funciona

### Se houver problema:
- Verifique se o usuário tem role `admin` na tabela `users`
- Verifique se o usuário está ativo (`is_active = true`)
- Verifique logs no console para erros de RLS

---

## 🧪 Teste 5: Verificar Navegação Entre Páginas

### Passos:
1. Após login, navegue para diferentes páginas do admin:
   - `/admin` (Dashboard)
   - `/admin/mapa` (Mapa)
   - `/admin/veiculos` (Veículos)
   - `/admin/rotas` (Rotas)
2. Verifique se não há redirecionamento para login

### Resultado Esperado:
- ✅ Todas as páginas carregam normalmente
- ✅ Não há redirecionamento para `/` (login)
- ✅ Sessão permanece ativa

---

## 🧪 Teste 6: Verificar Logout

### Passos:
1. Clique no botão de logout (se disponível)
2. Ou limpe os cookies manualmente
3. Tente acessar `/admin` novamente

### Resultado Esperado:
- ✅ Após logout, redireciona para `/` (login)
- ✅ Tentativa de acessar `/admin` sem sessão redireciona para login
- ✅ Não há loop de redirecionamento

---

## 🐛 Troubleshooting

### Problema: Página fica em "Carregando..."

**Solução:**
1. Limpe o cache do navegador
2. Verifique se o deploy do Vercel foi completado
3. Verifique o console para erros JavaScript
4. Verifique se as variáveis de ambiente estão configuradas no Vercel

### Problema: Loop de redirecionamento

**Solução:**
1. Verifique se a sessão do Supabase está sendo persistida
2. Verifique os logs no console:
   - `🔐 Persistindo sessão do Supabase no cliente...`
   - `✅ Sessão do Supabase definida via setSession()`
3. Verifique se o cookie `golffox-session` está presente
4. Verifique se o localStorage tem a chave do Supabase

### Problema: "Usuário não encontrado"

**Solução:**
1. Verifique se o usuário existe na tabela `users` do Supabase
2. Verifique se o email está correto
3. Verifique se o usuário está ativo (`is_active = true`)

### Problema: "Credenciais inválidas"

**Solução:**
1. Verifique se a senha está correta
2. Verifique se o usuário existe no Supabase Auth
3. Verifique se o email está correto

---

## 📊 Logs Esperados no Console

### Login Bem-Sucedido:
```
🔐 Persistindo sessão do Supabase no cliente...
✅ Sessão do Supabase definida via setSession()
✅ Login via API bem-sucedido (banco de dados verificado)
📊 Role obtido do banco de dados: admin
🚀 Preparando redirecionamento: { redirectUrl: '/admin', role: 'admin' }
📍 Redirecionando para: /admin
```

### Se usar fallback:
```
🔐 Persistindo sessão do Supabase no cliente...
⚠️ setSession não disponível, usando fallback
ℹ️ Usando fallback para persistir sessão manualmente
✅ Sessão persistida manualmente em localStorage (chave: sb-xxx-auth-token)
```

---

## ✅ Critérios de Sucesso

O teste é considerado **BEM-SUCEDIDO** se:

1. ✅ Página de login carrega normalmente
2. ✅ Login processa sem erros
3. ✅ **NÃO há loop de redirecionamento**
4. ✅ Redireciona para o painel correto
5. ✅ Sessão é persistida (localStorage + cookie)
6. ✅ Páginas admin carregam normalmente
7. ✅ Navegação entre páginas funciona
8. ✅ Logout funciona corretamente

---

## 📝 Notas Adicionais

- **Tempo de deploy:** Aguarde 2-3 minutos após push para o deploy completar
- **Cache:** Sempre limpe o cache do navegador antes de testar
- **Console:** Mantenha o console aberto (F12) para ver logs de debug
- **Variáveis de ambiente:** Verifique se estão configuradas no Vercel

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs no console do navegador
2. Verifique os logs do Vercel (Deployments > Logs)
3. Verifique se as variáveis de ambiente estão configuradas
4. Verifique se o usuário existe no banco de dados
5. Verifique se o usuário está ativo

---

**Última atualização:** $(date)
**Versão:** 1.0.0

