/**
 * Patch para @swc/helpers - Compatibilidade com fontkit
 * 
 * O fontkit precisa de applyDecoratedDescriptor (versão 0.3.17)
 * mas o Next.js usa _apply_decorated_descriptor (versão 0.5.15)
 * 
 * Este módulo adiciona applyDecoratedDescriptor à versão 0.5.15
 */

// Importar tudo do @swc/helpers (versão 0.5.15 do Next.js)
import * as helpers from '@swc/helpers';

// Se _apply_decorated_descriptor existe mas applyDecoratedDescriptor não, criar alias
if (helpers._apply_decorated_descriptor && !helpers.applyDecoratedDescriptor) {
  helpers.applyDecoratedDescriptor = helpers._apply_decorated_descriptor;
}

// Re-exportar tudo, incluindo o alias
export * from '@swc/helpers';
export { helpers.applyDecoratedDescriptor as applyDecoratedDescriptor };

