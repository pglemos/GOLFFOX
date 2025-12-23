"use client"

import { motion } from "framer-motion"
import { MapPin, Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { fadeInUp } from "@/lib/animations"
import { useRouter } from "@/lib/next-navigation"

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
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand/10 via-brand/5 to-accent-custom/10 p-6 sm:p-8 border border-border backdrop-blur-sm"
    >

      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-br from-ink-strong to-ink bg-clip-text text-transparent"
          >
            {title}
          </motion.h1>
          {companyName && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 text-sm text-ink-muted mb-2"
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
              className="text-sm sm:text-base text-ink-muted"
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
            className="bg-gradient-to-r from-brand to-brand-hover hover:from-brand-hover hover:to-brand text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto min-h-[44px] touch-manipulation"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )
}

