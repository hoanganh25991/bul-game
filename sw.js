self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('tankgame-v1').then(function(cache) {
      // Cache files that actually exist
      const urlsToCache = [
        './',
        './index.html',
        './tank.html',
        './game.js',
        './config.js',
        './styles.css',
        './manifest.json',
        './my-love-don-t-let-love-fade.mp3',
        './bullet.png',
        './icon-192.png',
        './icon-512.png',
        './favicon.ico',
        // Core systems
        './core/game-core.js',
        './core/camera-system.js',
        './core/world-system.js',
        // Input systems
        './input/input-manager.js',
        './input/joystick-controller.js',
        // Game entities
        './entities/tank.js',
        './entities/enemies.js',
        './entities/bullets.js',
        './entities/weapons.js',
        // Rendering systems
        './rendering/renderer.js',
        './rendering/ui-renderer.js',
        './rendering/effects-renderer.js',
        // Utilities
        './utils/math-utils.js',
        './utils/performance.js'
      ];
      
      // Add files one by one to handle missing files gracefully
      return Promise.all(
        urlsToCache.map(url => {
          return cache.add(url).catch(err => {
            console.warn('Failed to cache:', url, err);
            // Don't fail the entire installation if one file fails
            return Promise.resolve();
          });
        })
      );
    }).catch(err => {
      console.error('Service worker installation failed:', err);
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // Delete old caches
          if (cacheName !== 'tankgame-v1') {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      // Return cached version if available
      if (response) {
        return response;
      }
      
      // Otherwise fetch from network
      return fetch(e.request).then(function(response) {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response as it can only be consumed once
        const responseToCache = response.clone();
        
        caches.open('tankgame-v1').then(function(cache) {
          cache.put(e.request, responseToCache);
        });
        
        return response;
      }).catch(function() {
        // Return a fallback for HTML requests when offline
        if (e.request.destination === 'document') {
          return caches.match('./tank.html');
        }
      });
    })
  );
});
