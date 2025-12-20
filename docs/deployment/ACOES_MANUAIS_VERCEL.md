# ⚠️ Ações Manuais Necessárias na Vercel

## Status do Git

✅ **Commit realizado com sucesso!**

Agora você precisa fazer **2 ações manuais** na Vercel:

---

## 🔧 Passo 1: Configurar Variáveis de Ambiente (OBRIGATÓRIO)

**URL**: https://vercel.com/synvolt/golffox/settings/environment-variables

### Adicionar as 4 variáveis abaixo:

#### Variável 1:
```
Nome: NEXT_PUBLIC_SUPABASE_URL
Valor: https://vmoxzesvjcfmrebagcwo.supabase.co
Environments: ☑ Production  ☑ Preview  ☑ Development
```

#### Variável 2:
```
Nome: NEXT_PUBLIC_SUPABASE_ANON_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU
Environments: ☑ Production  ☑ Preview  ☑ Development
```

#### Variável 3:
```
Nome: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
Valor: AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM
Environments: ☑ Production  ☑ Preview  ☑ Development
```

#### Variável 4 (IMPORTANTE - apenas Production e Preview):
```
Nome: SUPABASE_SERVICE_ROLE
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A
Environments: ☑ Production  ☑ Preview  ❌ Development (NUNCA!)
```

**⚠️ ATENÇÃO**: A última variável (`SUPABASE_SERVICE_ROLE`) é uma chave privada. 
- ✅ Marque para **Production** e **Preview**
- ❌ **NUNCA** marque para **Development**

---

## 🚀 Passo 2: Fazer Push e Trigger do Deploy

Depois de configurar as variáveis, execute:

```bash
cd F:\GOLFFOX\web-app
git push origin main
```

**OU** se você já fez o push, a Vercel iniciará o deploy automaticamente.

---

## 📊 Passo 3: Monitorar Deploy

Após o push (ou se já estiver conectado):

1. Acesse: https://vercel.com/synvolt/golffox
2. Vá em **"Deployments"**
3. Clique no deployment mais recente
4. Acompanhe os **"Build Logs"**

**Aguardar ver:**
- ✅ "Installing dependencies..."
- ✅ "Running build command..."
- ✅ "Compiled successfully"
- ✅ "Linting and checking validity of types"
- ✅ "Generating static pages"

---

## ✅ Passo 4: Testar Após Deploy

URLs de produção:
- 🌐 Admin: https://golffox.vercel.app/admin
- 🌐 Operator: https://golffox.vercel.app/operator
- 🌐 Carrier: https://golffox.vercel.app/carrier
- 🌐 Login: https://golffox.vercel.app/login

**Contas de teste:**
- Admin: `golffox@admin.com` / `senha123`
- operador: `operador@empresa.com` / `senha123`
- transportadora: `transportadora@trans.com` / `senha123`

---

## 🆘 Se Algo Der Errado

### Build Falha
- Verifique logs na Vercel
- Compare com build local: `npm run build`
- Consulte `docs/TROUBLESHOOTING.md`

### Variáveis Não Funcionam
- Verifique se estão marcadas para o ambiente correto
- **Reinicie o deployment** após adicionar variáveis
- Verifique se nomes estão corretos (case-sensitive)

### Middleware Bloqueia
- Verifique logs no console do navegador
- Teste autenticação no Supabase
- Verifique role do usuário na tabela `users`

---

**Próximo passo**: Configure as variáveis na Vercel e depois execute `git push origin main`!

