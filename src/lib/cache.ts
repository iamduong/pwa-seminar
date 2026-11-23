const MEDIA_CACHE = "media-cache";
const API_ENDPOINT = import.meta.env.VITE_API_BASE_URL;

export const prefetchMedia = async (resources: string[]) => {
    const urls = resources.map((rs) => API_ENDPOINT + rs);
    const cache = await caches.open(MEDIA_CACHE);

    await Promise.allSettled(
        urls.map(async (url) => {
            if (!url) return;

            if (await cache.match(url)) return;
            
            const response = await fetch(url, {
                headers: {
                    "ngrok-skip-browser-warning": "true",
                }
            });
            if (response.ok) {
                await cache.put(url, response.clone());
            }
        })
    )
}

export const useCache = (resource: string) => {
    return API_ENDPOINT + resource;
}
