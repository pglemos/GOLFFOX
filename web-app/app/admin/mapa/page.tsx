"use client"

import { useEffect, useState, Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import dynamic from "next/dynamic"
import { supabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { MapPin } from "lucide-react"

// Lazy load AdminMap (componente pesado)
const AdminMap = dynamic(() => import('@/components/admin-map').then(m => ({ default: m.AdminMap })), { 
  ssr: false,
  loading: () => <div className="w-full h-[600px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
    <p className="text-[var(--ink-muted)]">Carregando mapa...</p>
  </div>
})

function MapaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Ler parâmetros da URL para rota específica e filtros
  const routeId = searchParams?.get('route') || null
  const companyId = searchParams?.get('company') || null
  const vehicleId = searchParams?.get('vehicle') || null
  const latParam = searchParams?.get('lat')
  const lngParam = searchParams?.get('lng')
  const zoomParam = searchParams?.get('zoom')
  
  const initialCenter = latParam && lngParam 
    ? { lat: parseFloat(latParam), lng: parseFloat(lngParam) }
    : null
  const initialZoom = zoomParam ? parseInt(zoomParam, 10) : null

  useEffect(() => {
    const getUser = async () => {
      try {
        // Primeiro, tentar obter usuário do cookie de sessão customizado
        if (typeof document !== 'undefined') {
          const cookieMatch = document.cookie.match(/golffox-session=([^;]+)/)
          if (cookieMatch) {
            try {
              const decoded = atob(cookieMatch[1])
              const u = JSON.parse(decoded)
              if (u?.id && u?.email) {
                setUser({ id: u.id, email: u.email, name: u.email.split('@')[0], role: u.role || 'admin' })
                setLoading(false)
                return
              }
            } catch (err) {
              console.warn('⚠️ Erro ao decodificar cookie de sessão:', err)
            }
          }
        }

        // Fallback: tentar sessão do Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('❌ Erro ao obter sessão do Supabase:', sessionError)
        }
        
        if (!session) {
          // Sem sessão - deixar o middleware proteger o acesso (não redirecionar aqui para evitar loop)
          console.log('⚠️ Sem sessão detectada - middleware irá proteger acesso')
          setLoading(false)
          return
        }

        const { data, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle()

        if (userError) {
          console.error('❌ Erro ao buscar usuário:', userError)
          setUser({ 
            id: session.user.id, 
            email: session.user.email || '', 
            name: session.user.email?.split('@')[0] || 'Admin', 
            role: 'admin' 
          })
        } else if (data) {
          setUser({ ...session.user, ...data })
        } else {
          setUser({ 
            id: session.user.id, 
            email: session.user.email || '', 
            name: session.user.email?.split('@')[0] || 'Admin', 
            role: 'admin' 
          })
        }
        
        setLoading(false)
      } catch (err) {
        console.error('❌ Erro ao obter usuário:', err)
        setLoading(false)
        // Não redirecionar aqui - deixar o middleware proteger
      }
    }

    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="loader-spinner mx-auto"></div>
          <p className="mt-4 text-[var(--ink-muted)]">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell user={{
      id: user?.id || "",
      name: user?.name || "Admin",
      email: user?.email || "",
      role: "admin"
    }}>
      <div className="space-y-6 animate-fade-in">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="p-3 rounded-[var(--radius-lg)] bg-[var(--brand-light)]">
            <MapPin className="h-6 w-6 text-[var(--brand)]" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">Mapa da Frota</h1>
            <p className="text-[var(--ink-muted)] text-lg">Visualize veículos e rotas em tempo real</p>
          </div>
        </motion.div>

        <AdminMap 
          companyId={companyId || undefined}
          routeId={routeId || undefined}
          vehicleId={vehicleId || undefined}
          initialCenter={initialCenter || undefined}
          initialZoom={initialZoom || undefined}
        />
      </div>
    </AppShell>
  )
}

export default function MapaPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    }>
      <MapaContent />
    </Suspense>
  )
}
