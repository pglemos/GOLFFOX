// ========================================
// Script para Limpar Estado do Navegador
// Execute este script no console do navegador (F12)
// ========================================

console.log('🧹 Limpando estado do navegador...');

// Limpar localStorage
console.log('🧹 Limpando localStorage...');
const localStorageKeys = Object.keys(localStorage);
console.log('🧹 Chaves no localStorage:', localStorageKeys);
localStorage.clear();

// Limpar sessionStorage
console.log('🧹 Limpando sessionStorage...');
const sessionStorageKeys = Object.keys(sessionStorage);
console.log('🧹 Chaves no sessionStorage:', sessionStorageKeys);
sessionStorage.clear();

// Limpar cookies relacionados ao Supabase
console.log('🧹 Limpando cookies...');
document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

// Limpar cache do navegador (se possível)
if ('caches' in window) {
    console.log('🧹 Limpando cache...');
    caches.keys().then(function(names) {
        for (let name of names) {
            caches.delete(name);
        }
    });
}

console.log('✅ Limpeza concluída! Recarregue a página (F5)');
console.log('📋 Para usar: Abra o console (F12), cole este script e pressione Enter');