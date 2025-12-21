/**
 * Utilitário para renderização de polylines em mapas
 */

export interface StopPoint {
  lat: number
  lng: number
}

/**
 * Cria e renderiza uma polyline no mapa com estilo customizado
 * @param map Instância do Google Maps
 * @param stops Pontos da rota
 * @param prefersReducedMotion Se deve usar movimento reduzido
 * @returns Instância da polyline criada
 */
export function createRoutePolyline(
  map: google.maps.Map,
  stops: StopPoint[],
  prefersReducedMotion: boolean = false
): google.maps.Polyline {
  if (stops.length < 2) {
    throw new Error('É necessário pelo menos 2 pontos para criar uma polyline')
  }

  // Criar caminho com todas as paradas
  const path = stops.map(stop => ({
    lat: stop.lat,
    lng: stop.lng,
  }))

  // Criar polyline com estilo customizado
  const polyline = new google.maps.Polyline({
    path,
    geodesic: true,
    strokeColor: '#2E7D32',
    strokeOpacity: 1.0,
    strokeWeight: 4,
    icons: prefersReducedMotion
      ? []
      : [
          {
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              strokeColor: '#2E7D32',
              fillColor: '#2E7D32',
              fillOpacity: 1,
            },
            offset: '100%',
            repeat: '50px',
          },
        ],
  })

  polyline.setMap(map)

  // Adicionar sombra sutil ao polyline apenas se não for movimento reduzido
  if (!prefersReducedMotion) {
    const shadowPolyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#000000',
      strokeOpacity: 0.2,
      strokeWeight: 6,
      zIndex: 1,
    })
    shadowPolyline.setMap(map)
  }

  return polyline
}
