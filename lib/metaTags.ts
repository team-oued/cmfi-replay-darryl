// lib/metaTags.ts

export interface MetaTagsData {
    title: string;
    description: string;
    image?: string;
    url: string;
    type?: 'website' | 'video.movie' | 'video.episode' | 'video.tv_show';
}

/**
 * Met à jour les métadonnées Open Graph dans le head du document
 */
export const updateMetaTags = (data: MetaTagsData) => {
    const head = document.head;
    
    // Créer ou mettre à jour les métadonnées Open Graph
    const tags = [
        { property: 'og:title', content: data.title },
        { property: 'og:description', content: data.description },
        { property: 'og:url', content: data.url },
        { property: 'og:type', content: data.type || 'website' },
        { property: 'og:site_name', content: 'CMFI Replay' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: data.title },
        { name: 'twitter:description', content: data.description },
        { name: 'twitter:site', content: '@CMFI_Replay' }
    ];

    // Ajouter l'image si disponible
    if (data.image) {
        tags.push(
            { property: 'og:image', content: data.image },
            { property: 'og:image:alt', content: data.title },
            { property: 'og:image:width', content: '1200' },
            { property: 'og:image:height', content: '630' },
            { name: 'twitter:image', content: data.image }
        );
    }

    // Mettre à jour ou créer chaque tag
    tags.forEach(tag => {
        const selector = tag.property 
            ? `meta[property="${tag.property}"]`
            : `meta[name="${tag.name}"]`;
        
        let element = head.querySelector(selector) as HTMLMetaElement;
        
        if (!element) {
            element = document.createElement('meta');
            if (tag.property) {
                element.setAttribute('property', tag.property);
            } else {
                element.setAttribute('name', tag.name);
            }
            head.appendChild(element);
        }
        
        element.setAttribute('content', tag.content);
    });

    // Mettre à jour le titre de la page
    const titleElement = head.querySelector('title');
    if (titleElement) {
        titleElement.textContent = `${data.title} - CMFI Replay`;
    }
};

/**
 * Nettoie les métadonnées Open Graph personnalisées
 */
export const clearMetaTags = () => {
    const head = document.head;
    const selectors = [
        'meta[property^="og:"]',
        'meta[name^="twitter:"]'
    ];

    selectors.forEach(selector => {
        const elements = head.querySelectorAll(selector);
        elements.forEach(element => {
            // Garder les tags de base si nécessaire
            const property = element.getAttribute('property');
            const name = element.getAttribute('name');
            
            // Supprimer uniquement nos tags personnalisés
            if (property && property.startsWith('og:')) {
                element.remove();
            }
            if (name && name.startsWith('twitter:')) {
                element.remove();
            }
        });
    });

    // Restaurer le titre par défaut
    const titleElement = head.querySelector('title');
    if (titleElement) {
        titleElement.textContent = 'CMFI Replay';
    }
};
