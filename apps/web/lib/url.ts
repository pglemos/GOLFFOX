export function normalizeOperatorUrl(urlString: string): string {
  try {
    const url = new URL(urlString, typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    if (url.pathname.startsWith('/operador') && url.searchParams.has('company')) {
      url.searchParams.delete('company')
    }
    return url.pathname + (url.search || '')
  } catch {
    // Se não for URL válida, retornar como veio
    return urlString
  }
}

// Helper para validar UUID (v1-v5)
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}
