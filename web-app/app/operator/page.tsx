"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  Truck, 
  Clock, 
  CheckCircle, 
  XCircle,
  MapPin,
  User
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function OperatorDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }

      const { data } = await supabase
        .from("users")
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
      vehicle: "Ônibus 03",
      driver: "João Silva",
      status: "inProgress",
      scheduled: "08:00",
      progress: 65
    },
    { 
      id: "TR-002", 
      route: "Curvelo → Matriz",
      vehicle: "Ônibus 12",
      driver: "Maria Santos",
      status: "scheduled",
      scheduled: "10:00",
      progress: 0
    },
    { 
      id: "TR-003", 
      route: "Distrito JK → Matriz",
      vehicle: "Ônibus 05",
      driver: "Pedro Costa",
      status: "completed",
      scheduled: "06:00",
      progress: 100
    },
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "inProgress":
        return "bg-[var(--accent)]"
      case "completed":
        return "bg-[var(--ok)]"
      case "scheduled":
        return "bg-[var(--brand)]"
      default:
        return "bg-[var(--muted)]"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "inProgress":
        return "In Progress"
      case "completed":
        return "Completed"
      case "scheduled":
        return "Scheduled"
      default:
        return status
    }
  }

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.driver.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = statusFilter === "all" || trip.status === statusFilter
    
    return matchesSearch && matchesFilter
  })

  return (
    <AppShell user={{
      id: user?.id || "",
      name: user?.name || "Operator",
      email: user?.email || "",
      role: "operator"
    }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Operator Panel</h1>
            <p className="text-[var(--muted)]">Manage trips and routes in real time</p>
          </div>
          <Button>
            <Truck className="h-4 w-4 mr-2" />
            New Trip
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
              <Input
                placeholder="Search by ID, route, vehicle, driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {["all", "scheduled", "inProgress", "completed"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "all" ? "All" : 
                   status === "inProgress" ? "In Progress" :
                   status === "completed" ? "Completed" : "Scheduled"}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">Total Trips</p>
                <p className="text-2xl font-bold mt-1">{trips.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-[var(--brand)]" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">In Progress</p>
                <p className="text-2xl font-bold mt-1">{trips.filter(t => t.status === "inProgress").length}</p>
              </div>
              <Clock className="h-8 w-8 text-[var(--warning)]" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--muted)]">Completed (Today)</p>
                <p className="text-2xl font-bold mt-1">{trips.filter(t => t.status === "completed").length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-[var(--ok)]" />
            </div>
          </Card>
        </div>

        {/* Trips List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Trips</h2>
            <span className="text-sm text-[var(--muted)]">{filteredTrips.length} trip(s)</span>
          </div>

          {filteredTrips.length === 0 ? (
            <Card className="p-12 text-center">
              <MapPin className="h-16 w-16 mx-auto mb-4 text-[var(--muted)]" />
              <h3 className="text-lg font-semibold mb-2">No trips found</h3>
              <p className="text-sm text-[var(--muted)]">Try adjusting the filters or create a new trip</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTrips.map((trip) => (
                <Card key={trip.id} className="p-4 hover:bg-[var(--bg)] transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      {/* Status Dot */}
                      <div className={`w-3 h-3 rounded-full mt-2 ${getStatusColor(trip.status)}`} />
                      
                      {/* Trip Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold">#{trip.id}</span>
                          <Badge className={getStatusColor(trip.status)}>
                            {getStatusLabel(trip.status)}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[var(--muted)]" />
                            <span>{trip.route}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-[var(--muted)]" />
                            <span>{trip.vehicle}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-[var(--muted)]" />
                            <span>{trip.driver}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[var(--muted)]" />
                            <span>{trip.scheduled}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {trip.progress > 0 && (
                          <div className="mt-3">
                            <div className="h-2 bg-[var(--bg-soft)] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] transition-all"
                                style={{ width: `${trip.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline">
                        View details
                      </Button>
                      {trip.status === "inProgress" && (
                        <Button size="sm" variant="ghost">
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
