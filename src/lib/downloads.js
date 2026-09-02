// Real offline downloads using the Cache Storage API.
// Scope/limits (intentional, not a bug):
// - Only works for direct video files (mp4/webm) served with CORS enabled.
//   HLS (.m3u8) or DRM-protected streams cannot be cached this way.
// - Subject to the browser's storage quota; large libraries won't all fit.
// - Downloads are per-device/per-browser, stored in Cache Storage, not synced
//   across devices (that would require native app storage, out of scope for
//   a web app).

const CACHE_NAME = 'rwandaflix-downloads-v1'
const META_KEY = 'rwandaflix_downloads_meta'

function readMeta() {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || '{}')
  } catch {
    return {}
  }
}

function writeMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta))
}

export function isDownloadSupported() {
  return typeof window !== 'undefined' && 'caches' in window
}

export function listDownloads() {
  return Object.values(readMeta())
}

export function isDownloaded(id) {
  return Boolean(readMeta()[id])
}

export async function deleteDownload(id) {
  const meta = readMeta()
  const entry = meta[id]
  if (!entry) return
  const cache = await caches.open(CACHE_NAME)
  await cache.delete(entry.videoUrl)
  delete meta[id]
  writeMeta(meta)
}

// Downloads a video with progress reporting. onProgress receives 0-100 (or
// null if the server didn't send a Content-Length, in which case we can only
// report "in progress" rather than a percentage).
export async function downloadForOffline(item, onProgress) {
  if (!isDownloadSupported()) throw new Error('Offline downloads are not supported in this browser.')
  if (!item?.videoUrl) throw new Error('This title has no published video file to download yet.')

  const response = await fetch(item.videoUrl)
  if (!response.ok || !response.body) throw new Error('Could not download this video (server did not allow it).')

  const total = Number(response.headers.get('content-length')) || 0
  const reader = response.body.getReader()
  const chunks = []
  let received = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    if (onProgress) onProgress(total ? Math.min(99, Math.round((received / total) * 100)) : null)
  }

  const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'video/mp4' })
  const cache = await caches.open(CACHE_NAME)
  await cache.put(item.videoUrl, new Response(blob, { headers: { 'Content-Type': blob.type } }))

  const meta = readMeta()
  meta[item.id] = {
    id: item.id,
    title: item.title,
    image: item.image,
    videoUrl: item.videoUrl,
    duration: item.duration || '',
    sizeBytes: blob.size,
    downloadedAt: new Date().toISOString(),
  }
  writeMeta(meta)
  if (onProgress) onProgress(100)
  return meta[item.id]
}

export async function getOfflinePlaybackUrl(id) {
  const meta = readMeta()[id]
  if (!meta) return null
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(meta.videoUrl)
  if (!cached) return null
  const blob = await cached.blob()
  return URL.createObjectURL(blob)
}
