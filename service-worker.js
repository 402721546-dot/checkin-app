// ===== 每日打卡 PWA Service Worker =====
const CACHE_NAME = 'checkin-v5'
const PRECACHE_ASSETS = [
  '/checkin-app/index.html',
  '/checkin-app/manifest.json',
]

// ── Install: 只预缓存 HTML 和 manifest（小文件，保证快速成功） ──
self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(PRECACHE_ASSETS).catch(() => {
        // 预缓存失败不影响安装
        console.log('Pre-cache completed (partial)')
      })
    )
  )
})

// ── Activate: 清理旧缓存 ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      const purge = keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      return Promise.all(purge)
    })
  )
  // 立即接管所有页面
  clients.claim()
})

// ── Fetch: Network-First 策略（优先用网络，离线时用缓存） ──
self.addEventListener('fetch', event => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 网络成功 → 更新缓存
        if (response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone)
          })
        }
        return response
      })
      .catch(() => {
        // 网络失败 → 从缓存读取
        return caches.match(event.request).then(cached => {
          if (cached) return cached
          // 连缓存都没有，返回离线提示
          return new Response('离线中，请连接网络后重试', {
            status: 503,
            statusText: 'Service Unavailable',
          })
        })
      })
  )
})

// ── 监听更新消息 ──
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
