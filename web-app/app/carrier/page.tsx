"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CarrierMap } from "@/components/carrier-map"
import { 
  Truck, 
  Map, 
  Users, 
  Navigation,
  AlertCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function CarrierDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      setUser({ ...session.user, ...data })
      setLoading(false)
    }

    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[var(--muted)]">Loading...</p>
        </div>
      </div>
    )
  }

  const fleet = [
    { id: "BUS-01", driver: "João Silva", status: "on-route", route: "Matriz → Curvelo", lastUpdate: "há 2 min" },
    { id: "BUS-02", driver: "Maria Santos", status: "available", route: "Livre", lastUpdate: "há 5 min" },
    { id: "BUS-03", driver: "Pedro Costa", status: "delayed", route: "Distrito JK", lastUpdate: "há 15 min" },
    { id: "BUS-04", driver: "Ana Paula", status: "on-route", route: "Curvelo → Matriz", lastUpdate: "agora" },
  ]

  const drivers = [
    { name: "João Silva", trips: 12, rating: 4.8, status: "active" },
    { name: "Maria Santos", trips: 15, rating: 4.9, status: "active" },
    { name: "Pedro Costa", trips: 8, rating: 4.7, status: "active" },
    { name: "Ana Paula", trips: 10, rating: 4.6, status: "break" },
  ]

  return (
    <AppShell user={{
      id: user?.id || "",
      name: user?.name || "Carrier",
      email: user?.email || "",
      role: "carrier"
    }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Fleet Management</h1>
            <p className="text-[var(--muted)]">Monitor vehicles and drivers in real time</p>
          </div>
          <Button>
            <Truck className="h-4 w-4 mr-2" />
            Reports
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">Total Fleet</p>
                <p className="text-2xl font-bold mt-1">8</p>
              </div>
              <Truck className="h-8 w-8 text-[var(--brand)]" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">On Route</p>
                <p className="text-2xl font-bold mt-1">5</p>
              </div>
              <Navigation className="h-8 w-8 text-[var(--accent)]" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">Active Drivers</p>
                <p className="text-2xl font-bold mt-1">{drivers.filter(d => d.status === "active").length}</p>
              </div>
              <Users className="h-8 w-8 text-[var(--ok)]" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">Delayed</p>
                <p className="text-2xl font-bold mt-1">1</p>
              </div>
              <AlertCircle className="h-8 w-8 text-[var(--err)]" />
            </div>
          </Card>
        </div>

        {/* Fleet Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fleet Map */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Map className="h-5 w-5" />
                Fleet Map
              </h2>
              <Button size="sm" variant="outline">Expand</Button>
            </div>
            
            {/* Map */}
            <CarrierMap 
              vehicles={fleet.map(vehicle => ({
                id: vehicle.id,
                plate: vehicle.plate,
                lat: vehicle.lat || -14.235, // Default para centro do Brasil se não tiver coordenadas
                lng: vehicle.lng || -51.9253,
                status: vehicle.status as 'on_route' | 'available' | 'delayed'
              }))}
            />

            {/* Legend */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-[var(--brand)]" />
                <span>On Route</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-[var(--ok)]" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-[var(--err)]" />
                <span>Delayed</span>
              </div>
            </div>
          </Card>

          {/* Active Drivers */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Drivers
              </h2>
              <Button size="sm" variant="outline">View all</Button>
            </div>

            <div className="space-y-3">
              {drivers.map((driver, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg)] hover:bg-[var(--bg-soft)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--brand)]/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-[var(--brand)]" />
                    </div>
                    <div>
                      <p className="font-semibold">{driver.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {driver.trips} trip(s) • ⭐ {driver.rating}
                      </p>
                    </div>
                  </div>
                  <Badge className={driver.status === "active" ? "bg-[var(--ok)]" : "bg-[var(--muted)]"}>
                    {driver.status === "active" ? "Active" : "Break"}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Fleet Status Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Fleet Status
            </h2>
            <Button size="sm" variant="outline">
              Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--muted)]/20">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Vehicle</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Driver</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Route</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Last update</th>
                </tr>
              </thead>
              <tbody>
                {fleet.map((vehicle, i) => (
                  <tr key={i} className="border-b border-[var(--muted)]/10 hover:bg-[var(--bg)] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-[var(--brand)]" />
                        <span className="font-semibold">{vehicle.id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{vehicle.driver}</td>
                    <td className="py-3 px-4">
                      <Badge className={
                        vehicle.status === "on-route" ? "bg-[var(--brand)]" :
                        vehicle.status === "available" ? "bg-[var(--ok)]" :
                        "bg-[var(--err)]"
                      }>
                        {vehicle.status === "on-route" ? "On Route" :
                         vehicle.status === "available" ? "Available" : "Delayed"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{vehicle.route}</td>
                    <td className="py-3 px-4 text-sm text-[var(--muted)]">{vehicle.lastUpdate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
