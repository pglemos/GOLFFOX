# 📝 Passo a Passo: Adicionar Colunas no Supabase

## 🎯 Objetivo
Adicionar as colunas `photo_url`, `capacity`, `is_active` e `company_id` à tabela `vehicles` no Supabase.

---

## 📋 PASSO 1: Acessar o Supabase

1. Abra seu navegador
2. Acesse: **https://app.supabase.com**
3. Faça login com suas credenciais
4. Selecione o projeto **GOLFFOX**

---

## 📋 PASSO 2: Abrir o SQL Editor

1. No menu lateral esquerdo, procure por **"SQL Editor"**
2. Clique em **"SQL Editor"**
3. Clique no botão **"New Query"** (ou "+ New query")

---

## 📋 PASSO 3: Copiar o Script SQL

Abra o arquivo:
```
database/migrations/v47_add_vehicle_columns.sql
```

**Selecione TODO o conteúdo** (Ctrl+A) e **copie** (Ctrl+C)

---

## 📋 PASSO 4: Colar no Supabase

1. No SQL Editor do Supabase, **cole** o script (Ctrl+V)
2. Você verá um script SQL grande (217 linhas)
3. **NÃO MODIFIQUE NADA**

---

## 📋 PASSO 5: Executar o Script

1. Clique no botão **"Run"** (canto inferior direito)
   - Ou pressione **Ctrl+Enter**
2. Aguarde a execução (2-5 segundos)
3. Você verá mensagens de sucesso:

```
NOTICE: Migration v47 completed successfully!
NOTICE: Added columns: photo_url, capacity, is_active, company_id to vehicles table
NOTICE: Created storage bucket: vehicle-photos
NOTICE: Updated view: v_live_vehicles

Success. No rows returned
```

✅ **Se vir estas mensagens, está tudo certo!**

---

## 📋 PASSO 6: Verificar as Colunas

Execute esta query para confirmar:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'vehicles'
ORDER BY ordinal_position;
```

**Resultado esperado:**
Você deve ver as novas colunas:
- `photo_url` - text - YES - NULL
- `capacity` - integer - YES - NULL
- `is_active` - boolean - NO - true
- `company_id` - uuid - YES - NULL

---

## 📋 PASSO 7: Verificar o Storage

1. No menu lateral, clique em **"Storage"**
2. Você deve ver um novo bucket: **"vehicle-photos"**
3. Clique nele para confirmar que está vazio (por enquanto)

---

## 📋 PASSO 8: Testar no Sistema

1. Acesse o sistema GOLF FOX
2. Vá para **"Veículos"**
3. Tente **criar um novo veículo**
4. Tente **adicionar uma foto**
5. Verifique se a **capacidade** aparece
6. Verifique se o **status ativo/inativo** aparece

✅ **Se tudo funcionar, a migração foi bem-sucedida!**

---

## ⚠️ Problemas Comuns

### Erro: "relation vehicles does not exist"
**Solução:** A tabela `vehicles` não existe. Você precisa criá-la primeiro.

### Erro: "permission denied"
**Solução:** Você não tem permissões de admin. Entre em contato com o administrador do projeto.

### Erro: "column already exists"
**Solução:** A coluna já foi adicionada anteriormente. Isso é normal, o script verifica antes de adicionar.

### Erro: "bucket already exists"
**Solução:** O bucket já foi criado anteriormente. Isso é normal, o script usa `ON CONFLICT DO NOTHING`.

---

## 🔄 Rollback (Se Necessário)

Se algo der errado e você quiser reverter:

```sql
-- CUIDADO: Isso apaga as colunas e todos os dados nelas!
ALTER TABLE public.vehicles DROP COLUMN IF EXISTS photo_url;
ALTER TABLE public.vehicles DROP COLUMN IF EXISTS capacity;
ALTER TABLE public.vehicles DROP COLUMN IF EXISTS is_active;
ALTER TABLE public.vehicles DROP COLUMN IF EXISTS company_id;

DROP INDEX IF EXISTS idx_vehicles_is_active;
DROP INDEX IF EXISTS idx_vehicles_company_id;
DROP INDEX IF EXISTS idx_vehicles_plate;

-- CUIDADO: Isso apaga todas as fotos!
DELETE FROM storage.buckets WHERE id = 'vehicle-photos';
```

---

## ✅ Checklist Final

Marque conforme for completando:

- [ ] Acessei o Supabase
- [ ] Abri o SQL Editor
- [ ] Copiei o script v47
- [ ] Colei no SQL Editor
- [ ] Executei o script (Run)
- [ ] Vi as mensagens de sucesso
- [ ] Verifiquei as colunas
- [ ] Verifiquei o storage
- [ ] Testei no sistema
- [ ] Tudo funcionando!

---

## 📞 Precisa de Ajuda?

Se encontrar problemas:
1. Tire um print da tela do erro
2. Copie a mensagem de erro completa
3. Entre em contato com o suporte

---

**Tempo estimado:** 5-10 minutos  
**Dificuldade:** Fácil  
**Reversível:** Sim (com rollback)

🎉 **Boa sorte!**

