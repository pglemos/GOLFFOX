export type EmployeeLite = {
  employee_id: string
  company_id: string
  first_name: string
  last_name: string
  cpf: string
  address: string
  city: string
  state: string
  zipcode: string
  lat: number | null
  lng: number | null
}

export type OptimizeRouteRequest = {
  companyId: string
  origin: { lat: number; lng: number }
  destination: { lat: number; lng: number }
  waypoints: Array<{ id: string; lat: number; lng: number }>
  departureTimeIso?: string
}

export type OptimizeRouteResponse = {
  ordered: Array<{ id: string; lat: number; lng: number; order: number }>
  polyline: string
  totalDistanceMeters: number
  totalDurationSeconds: number
  usedLiveTraffic: boolean
  warnings?: string[]
}

export type RouteFormData = {
  name: string
  company_id: string
  description?: string
  origin_address: string
  origin_lat: number
  origin_lng: number
  destination_address: string
  destination_lat: number
  destination_lng: number
  scheduled_time: string
  shift: 'manha' | 'tarde' | 'noite'
  days_of_week: number[]
  exceptions: string[]
  is_active: boolean
  motorista_id?: string
  veiculo_id?: string
  selected_employees: string[]
}

