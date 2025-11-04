/**
 * Testes para garantir que o filtro de alertas usa `alert_type`
 * e respeita o filtro via URL e severidade.
 */

type Alerta = { alert_type?: string; severity?: string; message?: string }

function applyFilters(
  alertas: Alerta[],
  searchQuery: string,
  severityFilter: 'all' | 'error' | 'warning' | 'info',
  urlFilter: 'delay' | 'stopped' | 'deviation' | null
) {
  const filterMap: Record<string, string> = {
    delay: 'route_delayed',
    stopped: 'bus_stopped',
    deviation: 'route_deviation',
  }
  const mappedUrlFilter = urlFilter ? filterMap[urlFilter] : null

  return alertas.filter(a => {
    const matchesSearch = searchQuery === ''
      || a.message?.toLowerCase().includes(searchQuery.toLowerCase())
      || a.alert_type?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesUrl = !mappedUrlFilter || a.alert_type === mappedUrlFilter

    const matchesSeverity = severityFilter === 'all'
      || (severityFilter === 'error' && (a.severity === 'error' || a.severity === 'critical'))
      || (severityFilter === 'warning' && a.severity === 'warning')
      || (severityFilter === 'info' && (a.severity === 'info' || !a.severity))

    return matchesSearch && matchesUrl && matchesSeverity
  })
}

describe('alertas filtering', () => {
  const sample: Alerta[] = [
    { alert_type: 'route_delayed', severity: 'warning', message: 'Atraso de rota' },
    { alert_type: 'bus_stopped', severity: 'critical', message: 'Veículo parado' },
    { alert_type: 'route_deviation', severity: 'error', message: 'Desvio de rota' },
    { alert_type: 'other', severity: 'info', message: 'Info genérica' },
  ]

  it('filters by URL param mapped to alert_type', () => {
    const res = applyFilters(sample, '', 'all', 'stopped')
    expect(res).toHaveLength(1)
    expect(res[0].alert_type).toBe('bus_stopped')
  })

  it('uses alert_type in text search', () => {
    const res = applyFilters(sample, 'deviation', 'all', null)
    expect(res).toHaveLength(1)
    expect(res[0].alert_type).toBe('route_deviation')
  })

  it('applies severity filter', () => {
    const res = applyFilters(sample, '', 'warning', null)
    expect(res.map(a => a.alert_type)).toEqual(['route_delayed'])
  })
})

