"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { MapPin, Building2 } from "lucide-react"
import { fadeInUp } from "@/lib/animations"
import { useRouter } from "next/navigation"

interface HeaderPremiumProps {
  title: string
  subtitle?: string
  companyName?: string
  actionLabel: string
  actionHref: string
}

export function HeaderPremium({ 
  title, 
  subtitle, 
  companyName,
  actionLabel, 
  actionHref 
}: HeaderPremiumProps) {
  const router = useRouter()
  
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--brand)]/10 via-[var(--brand)]/5 to-[var(--accent)]/10 p-6 sm:p-8 border border-[var(--border)] backdrop-blur-sm"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDMuMzE0LTIuNjg2IDYtNiA2cy02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNnoiIGZpbGw9IiNmZmYiLz48L2c+PC9zdmc+')] opacity-20" />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-br from-[var(--ink-strong)] to-[var(--ink)] bg-clip-text text-transparent"
          >
            {title}
          </motion.h1>
          {companyName && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 text-sm text-[var(--ink-muted)] mb-2"
            >
              <Building2 className="h-4 w-4" />
              <span className="truncate">{companyName}</span>
            </motion.div>
          )}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm sm:text-base text-[var(--ink-muted)]"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <Button 
            onClick={() => router.push(actionHref)}
            className="bg-gradient-to-r from-[var(--brand)] to-[var(--brand-hover)] hover:from-[var(--brand-hover)] hover:to-[var(--brand)] text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto min-h-[44px] touch-manipulation"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}

