export interface FlickrPhoto {
  id: string
  title?: string
  server?: string
  secret?: string
  url_n?: string
  url_z?: string
  url_o?: string
}

export interface FlickrPhotoset {
  id: string
  title?: string
  owner?: string
  photo: FlickrPhoto[]
}

/** Flickr's public REST API is consumed with JSONP because it does not expose CORS. */
export function useFlickr() {
  const config = useRuntimeConfig().public

  function fetchFlickr(params: Record<string, string | number>): Promise<Record<string, unknown> | null> {
    if (import.meta.server) return Promise.resolve(null)
    return new Promise((resolve, reject) => {
      if (!config.flickrApiKey) {
        resolve(null)
        return
      }

      const callbackName = `flickr_jsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`
      const query = new URLSearchParams({
        api_key: String(config.flickrApiKey),
        format: 'json',
        ...Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)]))
      })
      const script = document.createElement('script')

      const cleanup = () => {
        delete (window as unknown as Record<string, unknown>)[callbackName]
        script.remove()
      }

      ;(window as unknown as Record<string, unknown>)[callbackName] = (data: Record<string, unknown>) => {
        cleanup()
        resolve(data)
      }
      script.src = `${String(config.flickrUrl)}?${query}&jsoncallback=${callbackName}`
      script.onerror = () => {
        cleanup()
        reject(new Error('Flickr request failed'))
      }
      document.body.appendChild(script)
    })
  }

  async function fetchPhotoset(photosetId: string): Promise<FlickrPhotoset | null> {
    try {
      const data = await fetchFlickr({
        method: 'flickr.photosets.getPhotos',
        photoset_id: photosetId,
        extras: 'url_n,url_z,url_o,title',
        per_page: 500
      })
      const photoset = data?.photoset
      if (!photoset || typeof photoset !== 'object') return null
      const value = photoset as FlickrPhotoset
      return { ...value, photo: Array.isArray(value.photo) ? value.photo : [] }
    } catch {
      return null
    }
  }

  function photoUrl(photo: FlickrPhoto, size: 'thumb' | 'large' = 'thumb') {
    if (size === 'large' && photo.url_o) return photo.url_o
    if (photo.url_z || photo.url_n || photo.url_o) return photo.url_z || photo.url_n || photo.url_o || ''
    return photo.server && photo.id && photo.secret
      ? `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_${size === 'large' ? 'b' : 'z'}.jpg`
      : ''
  }

  return { fetchPhotoset, photoUrl }
}
