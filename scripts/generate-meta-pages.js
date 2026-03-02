const fs = require('fs');
const path = require('path');

// Simuler les services (à adapter avec vos vrais services)
const mockMovies = [
  { id: 'movie1', title: 'Film Chrétien 1', overview: 'Description du film chrétien 1', picture_path: '/images/movie1.jpg' },
  { id: 'movie2', title: 'Film Chrétien 2', overview: 'Description du film chrétien 2', picture_path: '/images/movie2.jpg' }
];

const mockSeries = [
  { id: 'serie1', title: 'Série Chrétienne 1', overview: 'Description de la série chrétienne 1', picture_path: '/images/serie1.jpg' },
  { id: 'serie2', title: 'Série Chrétienne 2', overview: 'Description de la série chrétienne 2', picture_path: '/images/serie2.jpg' }
];

function generateMetaPage(content, type, uid) {
  const baseUrl = 'https://votre-domaine.com';
  const imageUrl = content.picture_path ? `${baseUrl}${content.picture_path}` : `${baseUrl}/cmfireplay.svg`;
  
  return `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/cmfireplay.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${content.title} - CMFI Replay</title>
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${type === 'movie' ? 'video.movie' : 'video.tv_show'}" />
  <meta property="og:url" content="${baseUrl}/${type}/${uid}" />
  <meta property="og:title" content="${content.title}" />
  <meta property="og:description" content="${content.overview || \`Découvrez "${content.title}" sur CMFI Replay\`}" />
  <meta property="og:site_name" content="CMFI Replay" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:alt" content="${content.title}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="${baseUrl}/${type}/${uid}" />
  <meta property="twitter:title" content="${content.title}" />
  <meta property="twitter:description" content="${content.overview || \`Découvrez "${content.title}" sur CMFI Replay\`}" />
  <meta property="twitter:site" content="@CMFI_Replay" />
  <meta property="twitter:image" content="${imageUrl}" />
  
  <!-- SEO Meta Tags -->
  <meta name="description" content="${content.overview || \`Découvrez "${content.title}" sur CMFI Replay\`}" />
  <meta name="keywords" content="${type === 'movie' ? 'film chrétien' : 'série chrétienne'}, ${content.title}, CMFI Replay" />
  <meta name="author" content="CMFI Replay" />
  
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

async function generateAllMetaPages() {
  const outputDir = path.join(__dirname, '../dist/meta');
  
  // Créer le répertoire de sortie s'il n'existe pas
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Générer les pages pour les films
  for (const movie of mockMovies) {
    const html = generateMetaPage(movie, 'movie', movie.id);
    const filePath = path.join(outputDir, `movie-${movie.id}.html`);
    fs.writeFileSync(filePath, html);
    console.log(`Generated: ${filePath}`);
  }

  // Générer les pages pour les séries
  for (const serie of mockSeries) {
    const html = generateMetaPage(serie, 'serie', serie.id);
    const filePath = path.join(outputDir, `serie-${serie.id}.html`);
    fs.writeFileSync(filePath, html);
    console.log(`Generated: ${filePath}`);
  }

  console.log('Meta pages generation completed!');
}

// Exécuter la génération
generateAllMetaPages().catch(console.error);
