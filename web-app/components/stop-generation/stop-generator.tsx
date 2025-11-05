"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { toCSV, toJSON } from '../../lib/exports'

type LatLng = { lat: number; lng: number }

type ApiResponse = {
  routeId: string
  origin: LatLng
  stops: { id: string; fullName: string; sequence: number; etaMinutes: number; location: LatLng }[]
  validation: { id: string; fullName: string; addressStr: string; issues: string[] }[]
  geocoded: { id: string; fullName: string; lat?: number; lng?: number }[]
  metrics: { count: number; successRate: number; processingMs: number }
  errorColor: string
  logs: { ts: string; level: string; message: string }[]
}

export default function StopGenerator({ routeId }: { routeId: string }) {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avgSpeedKmh, setAvgSpeedKmh] = useState(30)
  const [employeeDb, setEmployeeDb] = useState<string | undefined>(undefined)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapObj = useRef<any>(null)
  const markers = useRef<any[]>([])

  const mapProvider = process.env.NEXT_PUBLIC_MAP_PROVIDER || 'google'
  const apiKey = process.env.NEXT_PUBLIC_MAPS_API_KEY

  useEffect(() => {
    if (mapProvider === 'google' && apiKey && mapRef.current) {
      // Carrega script do Maps se necessário
      const id = 'google-maps-js'
      if (!document.getElementById(id)) {
        const s = document.createElement('script')
        s.id = id
        s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`
        s.async = true
        document.body.appendChild(s)
        s.onload = initMap
      } else {
        initMap()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapRef.current])

  function initMap() {
    if (!mapRef.current || !('google' in window)) return
    const center = { lat: -23.55052, lng: -46.633308 }
    // @ts-ignore
    mapObj.current = new google.maps.Map(mapRef.current, { zoom: 11, center })
  }

  async function generate() {
    setError(null)
    setLoading(true)
    try {
      const resp = await fetch('/api/admin/generate-stops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId, avgSpeedKmh, employeeDb }),
      })
      const json = (await resp.json()) as ApiResponse
      setData(json)
      drawOnMap(json)
    } catch (e: any) {
      setError(e?.message || 'Falha ao gerar pontos')
    } finally {
      setLoading(false)
    }
  }

  function clearMarkers() {
    markers.current.forEach(m => m.setMap(null))
    markers.current = []
  }

  function drawOnMap(json: ApiResponse) {
    if (!mapObj.current || !json?.stops) return
    clearMarkers()
    // @ts-ignore
    const g = google
    // Origem
    markers.current.push(new g.maps.Marker({ position: json.origin, map: mapObj.current, icon: process.env.NEXT_PUBLIC_DESTINATION_ICON || undefined }))
    // Pontos
    json.stops.forEach(stop => {
      const marker = new g.maps.Marker({ position: stop.location, map: mapObj.current, icon: process.env.NEXT_PUBLIC_DEFAULT_ICON || undefined })
      const tooltip = new g.maps.InfoWindow({ content: `<div><strong>${stop.sequence}. ${stop.fullName}</strong><br/>ETA: ${stop.etaMinutes} min</div>` })
      marker.addListener('mouseover', () => tooltip.open({ map: mapObj.current, anchor: marker }))
      marker.addListener('mouseout', () => tooltip.close())
      marker.addListener('click', () => {
        alert(`${stop.fullName} (seq ${stop.sequence})\nETA: ${stop.etaMinutes} min`)
      })
      markers.current.push(marker)
    })
    if (json.stops.length > 0) {
      mapObj.current.setCenter(json.stops[0].location)
    }
  }

  const downloads = useMemo(() => {
    if (!data) return null
    return {
      json: toJSON(data.stops as any),
      csv: toCSV(data.stops as any),
    }
  }, [data])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', height: 'calc(100vh - 100px)', gap: 16 }}>
      <div style={{ padding: 16, overflow: 'auto' }}>
        <h2>Gerar pontos de parada</h2>
        <div>
          <label>
            Velocidade média (km/h)
            <input type="number" value={avgSpeedKmh} onChange={e => setAvgSpeedKmh(Number(e.target.value) || 30)} style={{ width: '100%', marginTop: 8 }} />
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <label>
            Fonte de funcionários (opcional)
            <input placeholder="ex.: gf_employee_company" value={employeeDb || ''} onChange={e => setEmployeeDb(e.target.value || undefined)} style={{ width: '100%', marginTop: 8 }} />
          </label>
        </div>
        <button onClick={generate} disabled={loading} style={{ marginTop: 12 }}>
          {loading ? 'Processando...' : 'Gerar'}
        </button>

        {error && <div style={{ color: 'red', marginTop: 12 }}>Erro: {error}</div>}

        {data && (
          <div style={{ marginTop: 16 }}>
            <h3>Resumo</h3>
            <div>Funcionários geocodificados: {Math.round((data.metrics.successRate || 0) * 100)}%</div>
            <div>Pontos gerados: {data.metrics.count}</div>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => {
                const blob = new Blob([downloads?.json || ''], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `route-${data.routeId}-stops.json`
                a.click()
                URL.revokeObjectURL(url)
              }}>Baixar JSON</button>
              <button style={{ marginLeft: 8 }} onClick={() => {
                const blob = new Blob([downloads?.csv || ''], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `route-${data.routeId}-stops.csv`
                a.click()
                URL.revokeObjectURL(url)
              }}>Baixar CSV</button>
            </div>

            <h3 style={{ marginTop: 16 }}>Endereços com problemas</h3>
            <ul>
              {data.validation.filter(v => v.issues.length > 0).map(v => (
                <li key={v.id} style={{ color: data.errorColor }}>
                  {v.fullName}: {v.addressStr} — {v.issues.join('; ')}
                </li>
              ))}
            </ul>

            <h3 style={{ marginTop: 16 }}>Logs</h3>
            <pre style={{ maxHeight: 200, overflow: 'auto', background: '#f7f7f7', padding: 8 }}>
              {data.logs.map(l => `${l.ts} [${l.level}] ${l.message}`).join('\n')}
            </pre>
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {!apiKey && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.9)' }}>
            <div>Configure `NEXT_PUBLIC_MAPS_API_KEY` para visualizar o mapa.</div>
          </div>
        )}
      </div>
    </div>
  )
}

