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
      className="absolute top-16 right-4 z-30"
    >
      <Card className="p-6 glass shadow-2xl w-80">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-bold text-xl">Período</h3>
            <p className="text-sm text-[var(--ink-muted)]">Selecione o período para playback</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">De:</label>
            <Input
              type="datetime-local"
              value={localFrom}
              onChange={(e) => setLocalFrom(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Até:</label>
            <Input
              type="datetime-local"
              value={localTo}
              onChange={(e) => setLocalTo(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-[var(--ink-muted)] mb-2">Seleção rápida:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(1)}
              >
                Última hora
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(2)}
              >
                Últimas 2h
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(6)}
              >
                Últimas 6h
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(24)}
              >
                Últimas 24h
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleApply}>
              Aplicar
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

