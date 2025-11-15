"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Navigation, 
  MapPin, 
  Clock, 
  PlayCircle, 
  Flag
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function DriverDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tracking, setTracking] = useState(false)

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

  const trips = [
    {
      id: "TR-001",
      route: "Matriz → Curvelo",
      scheduled: "08:00",
      status: "inProgress",
      estimatedArrival: "09:30",
      progress: 45,
      active: true
    },
    {
      id: "TR-002",
      route: "Curvelo → Distrito JK",
      scheduled: "14:00",
      status: "scheduled",
    },
    {
      id: "TR-003",
      route: "Distrito JK → Matriz",
      scheduled: "06:00",
      status: "completed",
      completedAt: "07:45"
    }
  ]

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

  const activeTrip = trips.find(t => t.active)

  return (
    <AppShell user={{
      id: user?.id || "",
      name: user?.name || "Driver",
      email: user?.email || "",
      role: "driver"
    }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Trips</h1>
            <p className="text-[var(--muted)]">Manage your routes and tracking</p>
          </div>
          <Button variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Active Trip Card */}
        {activeTrip && (
          <Card className="p-6 bg-gradient-to-br from-[var(--brand)] to-[var(--accent)] text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge className="bg-white/20 text-white border-0">
                  Active Trip
                </Badge>
                <p className="text-2xl font-bold mt-2">#{activeTrip.id}</p>
                <p className="text-white/90">{activeTrip.route}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={() => setTracking(!tracking)}
              >
                <Navigation className="h-4 w-4 mr-2" />
                {tracking ? "Tracking..." : "Start GPS"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-xs opacity-80">Scheduled time</p>
                <p className="text-lg font-semibold">{activeTrip.scheduled}</p>
              </div>
              <div>
                <p className="text-xs opacity-80">Estimated arrival</p>
                <p className="text-lg font-semibold">{activeTrip.estimatedArrival}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{activeTrip.progress}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: `${activeTrip.progress}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1 bg-white/20 border-white/30 hover:bg-white/30 text-white">
                View map
              </Button>
              <Button variant="destructive" className="flex-1 bg-red-500 hover:bg-red-600">
                <Flag className="h-4 w-4 mr-2" />
                Finish
              </Button>
            </div>
          </Card>
        )}

        {/* All Trips */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">All trips</h2>
            <span className="text-sm text-[var(--muted)]">{trips.length} trip(s)</span>
          </div>

          <div className="space-y-3">
            {trips.map((trip) => (
              <Card key={trip.id} className="p-4 hover:bg-[var(--bg)] transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      trip.status === "inProgress" ? "bg-[var(--accent)]" :
                      trip.status === "completed" ? "bg-[var(--ok)]" :
                      trip.status === "scheduled" ? "bg-[var(--brand)]" :
                      "bg-[var(--muted)]"
                    }`} />

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">#{trip.id}</span>
                        <Badge variant="outline">{trip.status === "inProgress" ? "In progress" :
                                  trip.status === "completed" ? "Completed" : "Scheduled"}</Badge>
                      </div>
                      <p className="text-sm text-[var(--muted)]">{trip.route}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted)]">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {trip.scheduled}
                        </span>
                        {trip.estimatedArrival && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Arrival: {trip.estimatedArrival}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {trip.status === "scheduled" && (
                      <Button size="sm">
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {trip.status === "inProgress" && (
                      <Button size="sm" variant="outline">
                        View details
                      </Button>
                    )}
                    {trip.status === "completed" && (
                      <Badge variant="success">{trip.completedAt}</Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {trips.length === 0 && (
          <Card className="p-12 text-center">
            <Navigation className="h-16 w-16 mx-auto mb-4 text-[var(--muted)]" />
            <h3 className="text-lg font-semibold mb-2">No trips found</h3>
            <p className="text-sm text-[var(--muted)]">
              Your trips will appear here when available
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
