const CACHE_NAME = 'dradauto-v1'
const STATIC_ASSETS = [
  '/',
  '/agenda',
  '/pacientes',
  '/prontuarios',
  '/financeiro',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usamos block para garantir que se uma falhar, as outras continuem
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => console.warn(`Falha ao cachear ${url}`, err))
        )
      )
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Ignorar requisições de API, Clerk, Supabase e que não sejam GET
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('clerk') ||
    event.request.url.includes('supabase') ||
    event.request.method !== 'GET'
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request)
    })
  )
})
