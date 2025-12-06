/**
 * Compatibilidade entre @swc/helpers 0.3.17 e 0.5.15
 * 
 * O fontkit precisa de applyDecoratedDescriptor (0.3.17)
 * mas o Next.js usa _apply_decorated_descriptor (0.5.15)
 * 
 * Este módulo cria um alias para compatibilidade usando a versão do Next.js
 */

// Importar da versão 0.5.15 (Next.js) - que é a que o Turbopack resolve
import { _apply_decorated_descriptor } from '@swc/helpers';

// Exportar com ambos os nomes para compatibilidade
export const applyDecoratedDescriptor = _apply_decorated_descriptor;
export { _apply_decorated_descriptor };

// Re-exportar tudo do @swc/helpers para manter compatibilidade total
export * from '@swc/helpers';

