// Service Worker pour le prérendu des balises meta
const CACHE_NAME = 'cmfi-replay-v1';

// URLs qui nécessitent des balises meta dynamiques
const DYNAMIC_ROUTES = [
  /^\/movie\/[^\/]+$/,
  /^\/serie\/[^\/]+$/,
  /^\/podcast\/[^\/]+$/,
  /^\/watch\/[^\/]+$/
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/index.tsx',
        '/cmfireplay.svg'
      ]);
    })
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Vérifier si c'est une route dynamique et si c'est une requête de navigation
  const isDynamicRoute = DYNAMIC_ROUTES.some(route => route.test(url.pathname));
  const isNavigationRequest = event.request.mode === 'navigate';
  
  if (isDynamicRoute && isNavigationRequest) {
    event.respondWith(generateDynamicMetaPage(url.pathname));
  } else {
    // Gestion normale des autres requêtes
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// Générer une page avec les balises meta appropriées
async function generateDynamicMetaPage(pathname) {
  try {
    // Extraire l'UID de l'URL
    const pathParts = pathname.split('/');
    const contentType = pathParts[1]; // movie, serie, podcast, watch
    const uid = pathParts[2];
    
    // Récupérer les données depuis Firestore via une edge function
    const metaTags = await fetchMetaTags(contentType, uid);
    
    // Générer le HTML avec les balises meta
    const html = generateHTML(metaTags);
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600' // Cache pour 1 heure
      }
    });
  } catch (error) {
    console.error('Error generating dynamic meta page:', error);
    // Fallback vers la page normale
    return fetch('/');
  }
}

// Récupérer les méta-données depuis une edge function
async function fetchMetaTags(contentType, uid) {
  try {
    // Utiliser une edge function pour récupérer les données
    const response = await fetch(`/api/meta/${contentType}/${uid}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching meta tags:', error);
    // Retourner des métadonnées par défaut
    return {
      title: 'CMFI Replay',
      description: 'Découvrez les contenus CMFI Replay',
      image: '/cmfireplay.svg',
      url: `https://votre-domaine.com${pathname}`,
      type: 'website'
    };
  }
}

// Générer le HTML complet avec les balises meta
function generateHTML(metaTags) {
  return `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/cmfireplay.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${metaTags.title} - CMFI Replay</title>
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${metaTags.type || 'website'}" />
  <meta property="og:url" content="${metaTags.url}" />
  <meta property="og:title" content="${metaTags.title}" />
  <meta property="og:description" content="${metaTags.description}" />
  <meta property="og:site_name" content="CMFI Replay" />
  ${metaTags.image ? `<meta property="og:image" content="${metaTags.image}" />
  <meta property="og:image:alt" content="${metaTags.title}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />` : ''}
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="${metaTags.url}" />
  <meta property="twitter:title" content="${metaTags.title}" />
  <meta property="twitter:description" content="${metaTags.description}" />
  <meta property="twitter:site" content="@CMFI_Replay" />
  ${metaTags.image ? `<meta property="twitter:image" content="${metaTags.image}" />` : ''}
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            background: {
              light: '#FBF9F3',
              dark: '#1a202c',
            },
          },
          fontFamily: {
            sans: ['Poppins', 'sans-serif'],
          },
        },
      }
    }
  </script>
  <style>
    /* For Webkit-based browsers (Chrome, Safari) */
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }

    /* For IE, Edge and Firefox */
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.75s ease-in-out;
    }
  </style>
  <script type="importmap">
{
  "imports": {
    "react/": "https://aistudiocdn.com/react@^19.2.0/",
    "react": "https://aistudiocdn.com/react@^19.2.0",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.0/"
  }
}
</script>
</head>

<body class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  <div id="root">
    <!-- Loading indicator while React app loads -->
    <div class="flex items-center justify-center h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
    </div>
  </div>
  <script type="module" src="/index.tsx"></script>
</body>
</html>`;
}
