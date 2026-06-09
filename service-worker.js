// ===== 每日打卡 PWA Service Worker =====
const CACHE_NAME = 'checkin-v4'
const ASSETS = [
  '打卡表.html',
  'vue.global.prod.js',
  'manifest.json',
  'icon.svg',
]

// ── Install: 预缓存核心文件 ──
self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  )
})

// ── Activate: 清理旧缓存 ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
})

// ── Fetch: 缓存优先（离线友好） ──
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      // 缓存命中 → 返回缓存
      if (cached) return cached
      // 未命中 → 网络请求并缓存
      return fetch(event.request).then(res => {
        const clone = res.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        return res
      }).catch(() => {
        // 网络不可用且无缓存 → 返回离线页面
        return caches.match('打卡表.html')
      })
    })
  )
})
