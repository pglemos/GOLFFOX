"use client"

import { useState, useDeferredValue, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fadeInUp } from "@/lib/animations"

interface SearchBarPremiumProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchBarPremium({ 
  value, 
  onChange, 
  placeholder = "Buscar...",
  className 
}: SearchBarPremiumProps) {
  // useDeferredValue para melhorar performance em buscas
  const deferredValue = useDeferredValue(value)
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={className}
    >
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted group-focus-within:text-brand transition-colors duration-300" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10 h-11 bg-card/50 backdrop-blur-sm border-border focus-visible:border-brand focus-visible:shadow-lg focus-visible:shadow-brand/10 transition-all duration-300"
        />
        <AnimatePresence>
          {value && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onChange("")}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

