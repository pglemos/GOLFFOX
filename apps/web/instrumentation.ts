/**
 * Next.js Instrumentation
 * 
 * Este arquivo é executado automaticamente pelo Next.js quando a aplicação inicia
 * Use para inicializar ferramentas de monitoramento, APM, etc.
 * 
 * Requer: next.config.js com experimental.instrumentationHook = true
 */

export async function register() {
  // Não executar durante o build (apenas em runtime)
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return
  }

  // Só executar no servidor (Node.js runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Inicializar Datadog APM apenas no servidor (Node.js)
    // Usar try-catch para não quebrar o build se houver problemas
    try {
      // Importar dinamicamente para evitar erros durante o build
      const apmModule = await import('./lib/apm/datadog').catch(() => null)
      if (apmModule && typeof apmModule.initializeDatadog === 'function') {
        apmModule.initializeDatadog()
      }
    } catch (error) {
      // Se Datadog não estiver configurado ou houver erro, continuar sem erro
      // Não logar em produção para evitar poluição de logs
      if (process.env.NODE_ENV === 'development') {
        const { warn } = await import('@/lib/logger')
        warn('Datadog APM não inicializado:', { error: error instanceof Error ? error.message : String(error) }, 'Instrumentation')
      }
    }
  }
}

