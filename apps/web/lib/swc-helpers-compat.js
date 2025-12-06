/**
 * Compatibilidade entre @swc/helpers 0.3.17 e 0.5.15
 * 
 * O fontkit precisa de applyDecoratedDescriptor (0.3.17)
 * mas o Next.js usa _apply_decorated_descriptor (0.5.15)
 * 
 * Este módulo cria um alias para compatibilidade
 */

// Tentar importar da versão 0.5.15 (Next.js)
let _apply_decorated_descriptor;
try {
  const helpers = require('@swc/helpers');
  _apply_decorated_descriptor = helpers._apply_decorated_descriptor;
} catch (e) {
  // Se não encontrar, tentar da versão 0.3.17
  try {
    const helpers = require('@swc/helpers');
    _apply_decorated_descriptor = helpers.applyDecoratedDescriptor;
  } catch (e2) {
    console.warn('Não foi possível carregar @swc/helpers');
  }
}

// Exportar com ambos os nomes para compatibilidade
module.exports = {
  applyDecoratedDescriptor: _apply_decorated_descriptor,
  _apply_decorated_descriptor: _apply_decorated_descriptor,
};

