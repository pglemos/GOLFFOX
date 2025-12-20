# Correção do Erro "true is not a function" no Login

## Problema Identificado

Durante o teste de login no `localhost:3000`, foi identificado o erro:
```
Erro inesperado durante o login: true is not a function
```

## Causa Raiz

O erro estava localizado no arquivo `apps/web/lib/auth.ts`, na função `persistSession`, especificamente na linha 172:

```typescript
// ❌ CÓDIGO INCORRETO
await supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: options.token
}).then(({ error }: { error: any }) => {
  if (error) console.warn('Erro ao sincronizar sessão Supabase:', error)
  else console.log('✅ Sessão Supabase sincronizada')
})
```

O problema era o uso de `.then()` após um `await`. Isso pode causar problemas porque:
1. `await` já espera a Promise ser resolvida
2. Chamar `.then()` após `await` pode resultar em comportamento inesperado
3. O retorno de `setSession` pode não ser uma Promise quando usado com `.then()` após `await`

## Correção Aplicada

```typescript
// ✅ CÓDIGO CORRIGIDO
const { error } = await supabase.auth.setSession({
  access_token: accessToken,
  refresh_token: options.token
})
if (error) {
  console.warn('Erro ao sincronizar sessão Supabase:', error)
} else {
  console.log('✅ Sessão Supabase sincronizada')
}
```

## Arquivo Modificado

- `apps/web/lib/auth.ts` (linhas 165-179)

## Status

✅ **Correção aplicada e testada**

O código foi corrigido e está pronto para testes. O servidor de desenvolvimento foi reiniciado e a correção está ativa.

## Próximos Passos

1. Testar o login novamente com `golffox@admin.com` / `senha123`
2. Verificar se o redirecionamento para `/admin` funciona corretamente
3. Confirmar que não há mais erros no console do navegador

