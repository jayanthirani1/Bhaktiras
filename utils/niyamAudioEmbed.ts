import { safeResourceUrl } from '~/utils/niyamChallenge'

export type NiyamAudioEmbedProvider = 'youtube' | 'spotify' | 'soundcloud'

export type NiyamAudioEmbed = {
  provider: NiyamAudioEmbedProvider
  embedUrl: string
  /** Suggested iframe height in px. */
  height: number
  title: string
}

function youtubeVideoId(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '')
  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0]
    return id && /^[\w-]{11}$/.test(id) ? id : null
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v')
      return id && /^[\w-]{11}$/.test(id) ? id : null
    }
    const short = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)
    if (short) return short[1]
  }
  return null
}

function spotifyEmbedPath(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '')
  if (host !== 'open.spotify.com' && host !== 'play.spotify.com') return null
  const parts = url.pathname.split('/').filter(Boolean)
  // open.spotify.com/track/ID or /intl-en/track/ID or /embed/track/ID
  const start = parts[0] === 'embed' ? 1 : parts[0]?.startsWith('intl-') ? 1 : 0
  const type = parts[start]
  const id = parts[start + 1]
  if (!type || !id) return null
  if (!['track', 'album', 'playlist', 'episode', 'show'].includes(type)) return null
  if (!/^[A-Za-z0-9]+$/.test(id)) return null
  return `/embed/${type}/${id}`
}

/**
 * Build a same-origin-safe iframe embed for known audio hosts.
 * Returns null for plain links / uploaded files — those use other UI.
 */
export function niyamAudioEmbed(rawUrl: string | null | undefined): NiyamAudioEmbed | null {
  const href = safeResourceUrl(rawUrl)
  if (!href) return null

  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }

  const ytId = youtubeVideoId(url)
  if (ytId) {
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?rel=0`,
      height: 200,
      title: 'YouTube player'
    }
  }

  const spotifyPath = spotifyEmbedPath(url)
  if (spotifyPath) {
    const type = spotifyPath.split('/')[2]
    return {
      provider: 'spotify',
      embedUrl: `https://open.spotify.com${spotifyPath}`,
      height: type === 'track' || type === 'episode' ? 152 : 352,
      title: 'Spotify player'
    }
  }

  const host = url.hostname.replace(/^www\./, '')
  if (host === 'soundcloud.com' || host === 'm.soundcloud.com' || host === 'on.soundcloud.com') {
    const encoded = encodeURIComponent(href)
    return {
      provider: 'soundcloud',
      embedUrl: `https://w.soundcloud.com/player/?url=${encoded}&color=%233d0066&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`,
      height: 166,
      title: 'SoundCloud player'
    }
  }

  return null
}
