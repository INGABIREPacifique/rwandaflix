export function isConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

export function reportClientError(error, context = 'app') {
  if (import.meta.env.DEV) console.error(`[RwandaFlix:${context}]`, error)
}
