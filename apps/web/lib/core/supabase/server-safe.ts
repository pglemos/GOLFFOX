/**
 * Wrapper seguro para exports do servidor
 * Evita executar código do servidor no cliente
 */

// No cliente, exportar stubs
// No servidor, re-exportar do server.ts

if (typeof window === 'undefined') {
  // Servidor: re-exportar do server.ts
  module.exports = require('./server')
} else {
  // Cliente: exportar stubs que lançam erro se usados
  const stub = () => {
    throw new Error('Esta função só pode ser usada no servidor. Use apenas em Server Components ou API routes.')
  }
  
  module.exports = {
    getSupabaseAdmin: stub,
    supabaseServiceRole: new Proxy({} as Record<string, never>, {
      get() {
        throw new Error('supabaseServiceRole não pode ser usado no cliente. Use apenas em Server Components ou API routes.')
      }
    })
  }
}

