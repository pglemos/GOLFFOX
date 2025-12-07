/**
 * Script para suprimir avisos de encoding do SWC no Windows
 * 
 * Este script intercepta e corrige mensagens de erro do SWC que aparecem
 * com encoding incorreto no console do Windows.
 */

// Interceptar console.warn para corrigir encoding de mensagens do SWC
const originalWarn = console.warn;
console.warn = function(...args) {
  const message = args.join(' ');
  
  // Detectar mensagens do SWC com encoding corrompido
  if (message.includes('inicializa') || message.includes('vínculo') || message.includes('dinâmico')) {
    // Corrigir encoding e exibir mensagem limpa
    const correctedMessage = message
      .replace(/inicializa´┐¢´┐¢o/g, 'inicialização')
      .replace(/v´┐¢nculo/g, 'vínculo')
      .replace(/din´┐¢mico/g, 'dinâmico')
      .replace(/biblioteca/g, 'biblioteca');
    
    // Suprimir aviso se for apenas sobre fallback do SWC (não é um erro crítico)
    if (correctedMessage.includes('SWC') && correctedMessage.includes('fallback')) {
      // Não exibir - é apenas um aviso informativo
      return;
    }
    
    // Exibir mensagem corrigida
    originalWarn.apply(console, [correctedMessage]);
  } else {
    // Exibir mensagem normal
    originalWarn.apply(console, args);
  }
};

// Interceptar console.error também
const originalError = console.error;
console.error = function(...args) {
  const message = args.join(' ');
  
  // Detectar mensagens do SWC com encoding corrompido
  if (message.includes('inicializa') || message.includes('vínculo') || message.includes('dinâmico')) {
    // Corrigir encoding
    const correctedMessage = message
      .replace(/inicializa´┐¢´┐¢o/g, 'inicialização')
      .replace(/v´┐¢nculo/g, 'vínculo')
      .replace(/din´┐¢mico/g, 'dinâmico')
      .replace(/biblioteca/g, 'biblioteca');
    
    // Se for apenas sobre fallback do SWC, tratar como aviso
    if (correctedMessage.includes('SWC') && correctedMessage.includes('fallback')) {
      // Não exibir como erro - é apenas um aviso
      return;
    }
    
    originalError.apply(console, [correctedMessage]);
  } else {
    originalError.apply(console, args);
  }
};

