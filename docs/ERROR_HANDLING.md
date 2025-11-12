# GolfFox — Tratamento de Erros e Conectividade

Este documento descreve os comportamentos padronizados implementados para tratamento de erros, validação de operações assíncronas e robustez de conectividade.

## ErrorService

- Padroniza o registro de erros com `LoggerService`, incluindo `stackTrace` e dados adicionais.
- `executeWithHandling(operation, context, additionalData)` envolve operações assíncronas, captura exceções específicas (`PlatformException`, `PostgrestException`, `TimeoutException`, etc.) e repropaga após registrar.
- `withRetry(operation, retryPolicy, context)` executa com reintentos exponenciais e registra cada tentativa.
- Histórico de erros acessível via `ErrorService.instance.history`.

## CreateDriverPage

- Formulário com `autovalidateMode: onUserInteraction` para validação em tempo real.
- Ao salvar, usa `ErrorService.executeWithHandling` para chamadas de criação/atualização e exibe feedback visual consistente (SnackBar e estado de carregamento).
- Garante `mounted` antes de interações com `context` após await.

## MapaPage

- Marcadores com tamanho adaptativo ao nível de zoom usando `onMapEvent`.
- Overlay de carregamento durante busca de pontos de parada e mensagens de erro amigáveis via `SnackBarService`.
- Uso de `ErrorService.reportError` em falhas de contato com motorista e carregamento de paradas.

## SupabaseConfig

- Inicialização com retry exponencial e logs usando `ErrorService.withRetry`.
- `validateConnection()` realiza uma chamada de rede (`auth.getUser`) e retorna `true/false`.
- `ensureAuthenticated()` tenta renovar tokens com `auth.refreshSession` quando há sessão.
- `checkReadyOrThrow()` valida configuração e conectividade antes de operações críticas.

## Testes

- Testes unitários cobrindo categorização, histórico e execution wrapper do `ErrorService`.
- Teste de widget básico para validação em tempo real na `CreateDriverPage`.

## Boas Práticas

- Sempre registrar `context` e `additionalData` relevantes.
- Usar severidade apropriada (`info`, `warning`, `error`) para priorização.
- Evitar UI ativa após `await` quando `mounted` for `false`.
