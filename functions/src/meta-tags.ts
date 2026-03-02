import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { movieService, serieService, episodeSerieService } from "../../lib/firestore.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    
    // Expected format: /api/meta/{contentType}/{uid}
    const contentType = pathParts[3] // movie, serie, podcast
    const uid = pathParts[4]

    if (!contentType || !uid) {
      return new Response(
        JSON.stringify({ error: 'Missing contentType or uid' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let metaTags = {
      title: 'CMFI Replay',
      description: 'Découvrez les contenus CMFI Replay',
      image: '/cmfireplay.svg',
      url: url.href,
      type: 'website'
    }

    // Récupérer les données en fonction du type de contenu
    switch (contentType) {
      case 'movie':
        const movie = await movieService.getMovieByUid(uid)
        if (movie) {
          metaTags = {
            title: movie.title,
            description: movie.overview || `Découvrez "${movie.title}" sur CMFI Replay`,
            image: movie.picture_path || '/cmfireplay.svg',
            url: url.href,
            type: 'video.movie'
          }
        }
        break

      case 'serie':
        const serie = await serieService.getSerieByUid(uid)
        if (serie) {
          metaTags = {
            title: serie.title,
            description: serie.overview || `Découvrez la série "${serie.title}" sur CMFI Replay`,
            image: serie.picture_path || '/cmfireplay.svg',
            url: url.href,
            type: 'video.tv_show'
          }
        }
        break

      case 'podcast':
        // Implémenter si vous avez un service pour les podcasts
        break

      case 'watch':
        // Pour les pages de lecture, essayer de récupérer soit un film soit un épisode
        let videoData = null
        
        // Essayer de récupérer comme film
        const movieForWatch = await movieService.getMovieByUid(uid)
        if (movieForWatch) {
          videoData = movieForWatch
          metaTags = {
            title: movieForWatch.title,
            description: movieForWatch.overview || `Regardez "${movieForWatch.title}" sur CMFI Replay`,
            image: movieForWatch.picture_path || '/cmfireplay.svg',
            url: url.href,
            type: 'video.movie'
          }
        } else {
          // Essayer de récupérer comme épisode
          const episode = await episodeSerieService.getEpisodeByUid(uid)
          if (episode) {
            const episodeTitle = episode.title && episode.title.trim() 
              ? episode.title 
              : `${episode.title_serie} - Épisode ${episode.episode_number || episode.episode_numero || ''}`
            
            metaTags = {
              title: episodeTitle,
              description: episode.overview || episode.overviewFr || `Épisode ${episode.episode_number || episode.episode_numero} de ${episode.title_serie}`,
              image: episode.picture_path || '/cmfireplay.svg',
              url: url.href,
              type: 'video.episode'
            }
          }
        }
        break
    }

    return new Response(
      JSON.stringify(metaTags),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in meta-tags function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
