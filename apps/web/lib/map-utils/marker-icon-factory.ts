/**
 * Factory para criação de ícones de marcadores customizados
 */

const MAX_CACHE_SIZE = 50
const iconCache = new Map<string, google.maps.Icon>()

/**
 * Limpa o cache de ícones quando excede o tamanho máximo
 */
function cleanCache() {
  if (iconCache.size > MAX_CACHE_SIZE) {
    const firstKey = iconCache.keys().next().value
    if (firstKey) {
      iconCache.delete(firstKey)
    }
  }
}

/**
 * Cria um ícone SVG customizado para marcadores de rota
 * @param type Tipo de parada (pickup ou dropoff)
 * @param number Número da parada
 * @param isFocused Se o marcador está focado
 * @param isMobile Se é um dispositivo móvel
 * @returns Ícone do Google Maps
 */
export function createMarkerIcon(
  type: 'pickup' | 'dropoff',
  number: number,
  isFocused: boolean = false,
  isMobile: boolean = false
): google.maps.Icon {
  const size = isMobile ? 24 : 32
  const cacheKey = `${type}-${number}-${size}-${isFocused}`

  // Verificar cache primeiro
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!
  }

  const color = type === 'pickup' ? '#2E7D32' : '#1976D2'
  const shape = type === 'pickup' ? 'circle' : 'square'
  const focusRing = isFocused
    ? `<circle cx="16" cy="16" r="14" fill="none" stroke="#FFD700" stroke-width="2" opacity="0.8"/>`
    : ''

  // Otimizar SVG removendo elementos desnecessários em dispositivos móveis
  const shadowFilter = !isMobile
    ? `
      <defs>
        <filter id="shadow-${cacheKey}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>`
    : ''

  const filterAttr = !isMobile ? `filter="url(#shadow-${cacheKey})"` : ''

  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      ${shadowFilter}
      <g ${filterAttr}>
        ${focusRing}
        ${
          shape === 'circle'
            ? `<circle cx="16" cy="16" r="12" fill="${color}" stroke="#FFFFFF" stroke-width="3"/>`
            : `<rect x="4" y="4" width="24" height="24" rx="2" fill="${color}" stroke="#FFFFFF" stroke-width="3"/>`
        }
        <circle cx="16" cy="16" r="8" fill="#FFFFFF" opacity="0.9"/>
        <text x="16" y="20" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="${color}">
          ${number}
        </text>
      </g>
    </svg>
  `

  const icon: google.maps.Icon = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    size: new google.maps.Size(size, size),
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  }

  // Armazenar no cache
  cleanCache()
  iconCache.set(cacheKey, icon)

  return icon
}

/**
 * Limpa todo o cache de ícones
 */
export function clearIconCache() {
  iconCache.clear()
}
