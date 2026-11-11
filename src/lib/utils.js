export const FLAGS = ['Question', 'Discussion', 'Opinion', 'Showcase']

export function shortId(id = '') {
  return id ? `dev_${id.replaceAll('-', '').slice(0, 6)}` : 'dev_guest'
}

export function timeAgo(dateString, now = Date.now()) {
  const seconds = Math.max(0, Math.floor((now - new Date(dateString).getTime()) / 1000))
  if (!Number.isFinite(seconds)) return 'just now'
  if (seconds < 60) return 'just now'
  const units = [
    [31536000, 'year'], [2592000, 'month'], [86400, 'day'],
    [3600, 'hour'], [60, 'minute'],
  ]
  for (const [scale, label] of units) {
    if (seconds >= scale) {
      const n = Math.floor(seconds / scale)
      return `${n} ${label}${n === 1 ? '' : 's'} ago`
    }
  }
  return 'just now'
}

export function isHttpUrl(input) {
  if (!input?.trim()) return true
  try {
    const url = new URL(input.trim())
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function embedVideo(input) {
  if (!input?.trim()) return null
  let url
  try { url = new URL(input.trim()) } catch { return null }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  const host = url.hostname.toLowerCase()
  let id
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0]
  if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v')
    else if (/^\/(embed|shorts)\//.test(url.pathname)) id = url.pathname.split('/')[2]
  }
  if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`
  if (host === 'vimeo.com' || host === 'www.vimeo.com') {
    const match = url.pathname.match(/^\/(\d+)(?:\/|$)/)
    if (match) return `https://player.vimeo.com/video/${match[1]}`
  }
  return null
}

export function validatePost(values) {
  if (!values.title?.trim()) return 'A title is required.'
  if (values.title.trim().length > 160) return 'Keep the title under 160 characters.'
  if ((values.content || '').length > 10000) return 'Post content must be at most 10,000 characters.'
  if (values.image_url && !isHttpUrl(values.image_url)) return 'Image URL must begin with http:// or https://.'
  if (values.video_url && !isHttpUrl(values.video_url)) return 'Video URL must begin with http:// or https://.'
  if (values.video_url && !embedVideo(values.video_url)) return 'Please use a YouTube or Vimeo video URL.'
  if (!FLAGS.includes(values.flag)) return 'Choose a valid post category.'
  return null
}

export function validateImage(file) {
  if (!file) return null
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) return 'Upload a JPEG, PNG, WebP, or GIF image.'
  if (file.size > 5 * 1024 * 1024) return 'Images must be 5 MB or smaller.'
  return null
}
