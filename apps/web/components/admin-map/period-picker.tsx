/**
 * Seletor de Período para Playback Histórico
 */

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { modalContent } from '@/lib/animations'

interface PeriodPickerProps {
  from: Date
  to: Date
  onChange: (from: Date, to: Date) => void
  onClose: () => void
}

export function PeriodPicker({ from, to, onChange, onClose }: PeriodPickerProps) {
  const [localFrom, setLocalFrom] = useState(
    from.toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm
  )
  const [localTo, setLocalTo] = useState(
    to.toISOString().slice(0, 16)
  )

  const handleApply = () => {
    const newFrom = new Date(localFrom)
    const newTo = new Date(localTo)
    
    if (newFrom >= newTo) {
      alert('A data inicial deve ser anterior à data final')
      return
    }
    
    onChange(newFrom, newTo)
    onClose()
  }

  const handleQuickSelect = (hours: number) => {
    const now = new Date()
    const past = new Date(now.getTime() - hours * 60 * 60 * 1000)
    onChange(past, now)
    onClose()
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={modalContent}
      className="absolute top-12 sm:top-16 right-2 sm:right-4 z-30 w-[calc(100vw-1rem)] sm:w-80 max-w-sm"
    >
      <Card className="p-4 sm:p-6 glass shadow-2xl">
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-lg sm:text-xl">Período</h3>
            <p className="text-xs sm:text-sm text-[var(--ink-muted)]">Selecione o período para playback</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">De:</label>
            <Input
              type="datetime-local"
              value={localFrom}
              onChange={(e) => setLocalFrom(e.target.value)}
              className="w-full text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 block">Até:</label>
            <Input
              type="datetime-local"
              value={localTo}
              onChange={(e) => setLocalTo(e.target.value)}
              className="w-full text-xs sm:text-sm"
            />
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-[var(--ink-muted)] mb-2">Seleção rápida:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(1)}
                className="text-xs"
              >
                Última hora
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(2)}
                className="text-xs"
              >
                Últimas 2h
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(6)}
                className="text-xs"
              >
                Últimas 6h
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(24)}
                className="text-xs"
              >
                Últimas 24h
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 text-xs sm:text-sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="flex-1 text-xs sm:text-sm" onClick={handleApply}>
              Aplicar
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

