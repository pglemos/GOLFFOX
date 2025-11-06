/**
 * MarkerManager - Gerencia virtualização de marcadores
 * Renderiza apenas marcadores visíveis no viewport
 */

export class MarkerManager {
  private map: google.maps.Map
  private markers: Map<string, google.maps.Marker> = new Map()
  private visibleMarkers: Set<string> = new Set()
  private boundsListener: google.maps.MapsEventListener | null = null
  private debounceTimer: NodeJS.Timeout | null = null
  private readonly DEBOUNCE_MS = 300
  private readonly MAX_MARKERS = 100

  constructor(map: google.maps.Map) {
    this.map = map
    this.setupBoundsListener()
  }

  /**
   * Configura listener para mudanças no viewport
   */
  private setupBoundsListener(): void {
    this.boundsListener = this.map.addListener('bounds_changed', () => {
      // Debounce para evitar muitas atualizações
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }

      this.debounceTimer = setTimeout(() => {
        this.updateVisibleMarkers()
      }, this.DEBOUNCE_MS)
    })

    // Atualizar imediatamente na primeira vez
    this.updateVisibleMarkers()
  }

  /**
   * Atualiza quais marcadores estão visíveis
   */
  private updateVisibleMarkers(): void {
    const bounds = this.map.getBounds()
    if (!bounds) return

    const newVisibleMarkers = new Set<string>()
    let visibleCount = 0

    // Limitar a 100 marcadores mesmo que mais estejam visíveis
    for (const [id, marker] of this.markers) {
      if (visibleCount >= this.MAX_MARKERS) {
        break
      }

      const position = marker.getPosition()
      if (position && bounds.contains(position)) {
        newVisibleMarkers.add(id)
        visibleCount++

        // Mostrar marcador se não estava visível
        if (!this.visibleMarkers.has(id)) {
          marker.setMap(this.map)
        }
      } else {
        // Esconder marcador se não está mais visível
        if (this.visibleMarkers.has(id)) {
          marker.setMap(null)
        }
      }
    }

    this.visibleMarkers = newVisibleMarkers
  }

  /**
   * Adiciona ou atualiza um marcador
   */
  addMarker(id: string, marker: google.maps.Marker): void {
    // Remover marcador antigo se existir
    if (this.markers.has(id)) {
      this.removeMarker(id)
    }

    this.markers.set(id, marker)

    // Verificar se deve estar visível
    const bounds = this.map.getBounds()
    if (bounds) {
      const position = marker.getPosition()
      if (position && bounds.contains(position)) {
        // Verificar se não excedeu o limite
        if (this.visibleMarkers.size < this.MAX_MARKERS) {
          marker.setMap(this.map)
          this.visibleMarkers.add(id)
        }
      } else {
        marker.setMap(null)
      }
    } else {
      // Se bounds não disponível, mostrar temporariamente
      marker.setMap(this.map)
      this.visibleMarkers.add(id)
    }
  }

  /**
   * Remove um marcador
   */
  removeMarker(id: string): void {
    const marker = this.markers.get(id)
    if (marker) {
      marker.setMap(null)
      this.markers.delete(id)
      this.visibleMarkers.delete(id)
    }
  }

  /**
   * Limpa todos os marcadores
   */
  clear(): void {
    for (const [id] of this.markers) {
      this.removeMarker(id)
    }
    this.markers.clear()
    this.visibleMarkers.clear()
  }

  /**
   * Atualiza visibilidade manualmente (útil após mudanças no mapa)
   */
  refresh(): void {
    this.updateVisibleMarkers()
  }

  /**
   * Limpa recursos
   */
  destroy(): void {
    if (this.boundsListener) {
      google.maps.event.removeListener(this.boundsListener)
      this.boundsListener = null
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    this.clear()
  }
}

