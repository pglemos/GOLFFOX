/**
 * Next.js Instrumentation
 * 
 * Este arquivo é executado automaticamente pelo Next.js quando a aplicação inicia
 * Use para inicializar ferramentas de monitoramento, APM, etc.
 * 
 * Requer: next.config.js com experimental.instrumentationHook = true
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Inicializar Datadog APM apenas no servidor (Node.js)
    try {
      const { initializeDatadog } = await import('./lib/apm/datadog')
      initializeDatadog()
    } catch (error) {
      // Se Datadog não estiver configurado, continuar sem erro
      console.warn('Datadog APM não inicializado:', error)
    }
  }
}

