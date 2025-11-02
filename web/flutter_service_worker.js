// Flutter Service Worker - Versão temporária
// Este arquivo será substituído quando a compilação do Flutter funcionar corretamente

const CACHE_NAME = 'golffox-cache-v1';
const TEMP_CACHE_NAME = 'golffox-temp-cache';

// Recursos essenciais para cache
const CORE_RESOURCES = [
  '/',
  '/index.html',
  '/env.js',
  '/flutter_bootstrap.js',
  '/main.dart.js',
  '/manifest.json',
  '/favicon.png',
  '/icons/Icon-192.png',
  '/icons/Icon-512.png'
];

// Instalar o service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(TEMP_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        // Tenta fazer cache dos recursos essenciais, mas não falha se algum não existir
        return Promise.allSettled(
          CORE_RESOURCES.map(resource => 
            cache.add(resource).catch(err => {
              console.warn(`Service Worker: Não foi possível cachear ${resource}:`, err);
            })
          )
        );
      })
      .then(() => {
        console.log('Service Worker: Instalação concluída');
        return self.skipWaiting();
      })
  );
});

// Ativar o service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== TEMP_CACHE_NAME && cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Ativação concluída');
      return self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Só intercepta requisições GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignora requisições para APIs externas
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retorna do cache se encontrado
        if (response) {
          console.log('Service Worker: Servindo do cache:', event.request.url);
          return response;
        }

        // Senão, busca da rede
        console.log('Service Worker: Buscando da rede:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Verifica se a resposta é válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona a resposta para o cache
            const responseToCache = response.clone();

            caches.open(TEMP_CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('Service Worker: Erro ao buscar da rede:', error);
            
            // Retorna uma resposta de fallback para páginas HTML
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            throw error;
          });
      })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker: Carregado - versão temporária para GolfFox Transport');