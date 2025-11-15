"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  Clock, 
  MessageCircle, 
  AlertCircle,
  CheckCircle,
  Navigation
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function PassengerDashboard() {
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

  const trips = [
    {
      id: "TR-001",
      route: "Matriz → Curvelo",
      status: "inProgress",
      scheduled: "08:00",
      estimatedArrival: "09:30",
      vehicle: "Ônibus 03",
      driver: "João Silva",
      eta: "5 min"
    },
    {
      id: "TR-002",
      route: "Distrito JK → Matriz",
      status: "scheduled",
      scheduled: "14:00",
      estimatedArrival: "14:45",
      vehicle: "Ônibus 12",
    },
    {
      id: "TR-003",
      route: "Curvelo → Matriz",
      status: "completed",
      scheduled: "10:00",
      completedAt: "10:48"
    }
  ]

  const incidents = [
    { id: "INC-001", trip: "TR-001", type: "Atraso", time: "há 5 min", resolved: false },
    { id: "INC-002", trip: "TR-002", type: "Rota alterada", time: "há 2h", resolved: true },
  ]

  return (
    <AppShell user={{
      id: user?.id || "",
      name: user?.name || "Passenger",
      email: user?.email || "",
      role: "passenger"
    }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Trips</h1>
            <p className="text-[var(--muted)]">Track your trips in real time</p>
          </div>
        </div>

        {/* Active Trip */}
        {trips.find(t => t.status === "inProgress") && (
          <Card className="p-6 bg-gradient-to-br from-[var(--brand)] to-[var(--accent)] text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge className="bg-white/20 text-white border-0">
                  Active Trip
                </Badge>
                <p className="text-2xl font-bold mt-2">#{trips.find(t => t.status === "inProgress")!.id}</p>
                <p className="text-white/90">{trips.find(t => t.status === "inProgress")!.route}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">Time to arrival</p>
                <p className="text-3xl font-bold">{trips.find(t => t.status === "inProgress")!.eta}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20 text-sm">
              <div>
                <p className="opacity-80">Vehicle</p>
                <p className="font-semibold mt-1">{trips.find(t => t.status === "inProgress")!.vehicle}</p>
              </div>
              <div>
                <p className="opacity-80">Driver</p>
                <p className="font-semibold mt-1">{trips.find(t => t.status === "inProgress")!.driver}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1 bg-white/20 border-white/30 hover:bg-white/30 text-white">
                <MapPin className="h-4 w-4 mr-2" />
                View on map
              </Button>
              <Button variant="outline" className="flex-1 bg-white/20 border-white/30 hover:bg-white/30 text-white">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </div>
          </Card>
        )}

        {/* All Trips */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">All trips</h2>
          </div>

          <div className="space-y-3">
            {trips.map((trip) => (
              <Card key={trip.id} className="p-4 hover:bg-[var(--bg)] transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className={`w-3 h-3 rounded-full ${
                      trip.status === "inProgress" ? "bg-[var(--accent)]" :
                      trip.status === "completed" ? "bg-[var(--ok)]" :
                      "bg-[var(--brand)]"
                    }`} />

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">#{trip.id}</span>
                        <Badge variant="outline">
                          {trip.status === "inProgress" ? "In progress" :
                           trip.status === "completed" ? "Completed" : "Scheduled"}
                        </Badge>
                      </div>
                      
                      <p className="text-sm mb-2">{trip.route}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {trip.scheduled}
                        </span>
                        {trip.estimatedArrival && (
                          <span className="flex items-center gap-1">
                            <Navigation className="h-3 w-3" />
                            Arrival: {trip.estimatedArrival}
                          </span>
                        )}
                        {trip.completedAt && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Completed at {trip.completedAt}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Incidents */}
        {incidents.length > 0 && (
          <Card className="p-6 bg-[var(--warn)]/10 border-[var(--warn)]/20">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-[var(--warn)]" />
              <h2 className="text-xl font-bold">Recent incidents</h2>
            </div>

            <div className="space-y-3">
              {incidents.filter(i => !i.resolved).map((incident) => (
                <div key={incident.id} className="flex items-start justify-between p-3 rounded-xl bg-[var(--bg)]">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-[var(--warn)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{incident.type}</p>
                      <p className="text-sm text-[var(--muted)]">
                        Trip #{incident.trip} • {incident.time}
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning">Open</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
