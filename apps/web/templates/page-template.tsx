"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { supabase } from "@/lib/supabase"
import { useRouter } from "@/lib/next-navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { Plus, Search } from "lucide-react"

interface PageTemplateProps {
  title: string
  description: string
  icon: React.ReactNode
  children?: React.ReactNode
  showCreateButton?: boolean
  createButtonLabel?: string
  onCreateClick?: () => void
}

export default function PageTemplate({
  title,
  description,
  icon,
  children,
  showCreateButton = true,
  createButtonLabel = "Criar",
  onCreateClick
}: PageTemplateProps) {
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
      setUser({ ...session.user })
      setLoading(false)
    }
    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="loader-spinner mx-auto"></div>
          <p className="mt-4 text-ink-muted">Carregando...</p>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg-custom bg-brand-light">
              {icon}
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-1">{title}</h1>
              <p className="text-ink-muted text-lg">{description}</p>
            </div>
          </div>
          {showCreateButton && (
            <Button onClick={onCreateClick} className="shadow-md">
              <Plus className="h-4 w-4 mr-2" />
              {createButtonLabel}
            </Button>
          )}
        </div>

        {children}
      </div>
    </AppShell>
  )
}

