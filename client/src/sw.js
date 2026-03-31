// src/sw.js
import { precacheAndRoute } from 'workbox-precaching';

// Force the waiting service worker to become the active service worker
self.skipWaiting();

// Tell the new active service worker to take control of the page immediately
self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});

// 1. OFFLINE CACHING (The Robot)
// Vite will automatically inject all your offline files into this variable during the build.
precacheAndRoute(self.__WB_MANIFEST);

// -----------------------------------------
// 2. PUSH NOTIFICATIONS (The Mailman)
// -----------------------------------------
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error("Push data was not JSON. Falling back to text.");
      data = { title: "CuTe Learning", body: event.data.text(), link: "/" };
    }
  }

  const options = {
    body: data.body || 'You have a new message!',
    icon: "https://res.cloudinary.com/da6jhcsmm/image/upload/v1773202841/CuTe_Logo_dlmvw9.png",
    badge: "https://res.cloudinary.com/da6jhcsmm/image/upload/v1774941782/badge_t5uyws.png",
    vibrate: [100, 50, 100],
    data: { url: data.link || '/' }
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Alert', options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // 1. Get the link from the payload (Default to home if missing)
  const rawLink = event.notification.data.url || '/';
  
  // 2. Strip the slash for the Dashboard check (just like we did in React)
  const pathWord = rawLink.replace(/^\//, '').toLowerCase();
  
  const dashboardViews = [
    "schedule", "syllabus", "profile", "settings", "my-posts", 
    "saved-posts", "report", "management", "my-courses", "whatsapp-crm"
  ];

  // 3. Construct the Full URL
  let targetUrl = '';
  if (dashboardViews.includes(pathWord)) {
    // 🚨 SW cannot use React 'state', so we pass it as a URL Query Parameter!
    targetUrl = self.location.origin + `/dashboard?view=${pathWord}`;
  } else {
    // Standard absolute path (e.g., /posts/123)
    const absolutePath = rawLink.startsWith('/') ? rawLink : `/${rawLink}`;
    targetUrl = self.location.origin + absolutePath;
  }

  event.waitUntil(
    // includeUncontrolled: true ensures we find the tab even if it just refreshed
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      
      for (const client of clientList) {
        // If the user already has your site open in a tab
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          // Force that open tab to navigate to the new URL, then bring it to the front
          client.navigate(targetUrl); 
          return client.focus();
        }
      }
      
      // If the app is completely closed, open a brand new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});