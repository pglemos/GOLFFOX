/**
 * Painel de Análise de Trajetos
 * Mostra métricas de comparação entre trajeto planejado vs real
 */

'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, TrendingUp, TrendingDown, Clock, Map, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { modalContent } from '@/lib/animations'
import type { TrajectoryAnalysis } from '@/lib/trajectory-analyzer'

interface TrajectoryPanelProps {
  analysis: TrajectoryAnalysis
  vehiclePlate: string
  routeName: string
  onClose: () => void
}

export function TrajectoryPanel({
  analysis,
  vehiclePlate,
  routeName,
  onClose,
}: TrajectoryPanelProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={modalContent}
      className="absolute top-2 right-2 sm:top-6 sm:right-6 w-[calc(100vw-1rem)] sm:w-80 md:w-96 z-30 max-h-[calc(100vh-1rem)] sm:max-h-[80vh] overflow-y-auto max-w-sm md:max-w-md"
    >
      <Card className="p-3 sm:p-6 bg-card/50 backdrop-blur-sm border-[var(--border)] shadow-lg sm:shadow-2xl">
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-lg sm:text-xl">Análise de Trajeto</h3>
            <p className="text-xs sm:text-sm text-[var(--ink-muted)] truncate">{vehiclePlate} - {routeName}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Métricas Gerais */}
          <div>
            <h4 className="font-semibold mb-2 sm:mb-3 text-xs sm:text-sm text-[var(--ink-muted)]">Métricas Gerais</h4>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Map className="h-4 w-4 text-[var(--ink-muted)]" />
                  <span className="text-xs text-[var(--ink-muted)]">Distância</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-semibold">Planejada:</span> {(analysis.totalDistancePlanned / 1000).toFixed(2)} km
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Real:</span> {(analysis.totalDistanceActual / 1000).toFixed(2)} km
                  </p>
                  {analysis.extraDistance > 0 && (
                    <p className="text-xs text-red-600">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      +{(analysis.extraDistance / 1000).toFixed(2)} km extra
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-[var(--ink-muted)]" />
                  <span className="text-xs text-[var(--ink-muted)]">Tempo</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-semibold">Planejado:</span> {analysis.totalTimePlanned.toFixed(0)} min
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Real:</span> {analysis.totalTimeActual.toFixed(0)} min
                  </p>
                  {analysis.timeDelay > 0 && (
                    <p className="text-xs text-orange-600">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      +{analysis.timeDelay.toFixed(0)} min de atraso
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Conformidade */}
          <div>
            <h4 className="font-semibold mb-2 sm:mb-3 text-xs sm:text-sm text-[var(--ink-muted)]">Conformidade</h4>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      analysis.conformityPercentage >= 90
                        ? 'bg-green-500'
                        : analysis.conformityPercentage >= 70
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${analysis.conformityPercentage}%` }}
                  />
                </div>
              </div>
              <Badge
                variant={
                  analysis.conformityPercentage >= 90
                    ? 'default'
                    : analysis.conformityPercentage >= 70
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {analysis.conformityPercentage.toFixed(1)}%
              </Badge>
            </div>
          </div>

          {/* Desvios */}
          {analysis.deviations.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 sm:mb-3 text-xs sm:text-sm text-[var(--ink-muted)] flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                Desvios de Rota ({analysis.deviations.length})
              </h4>
              <div className="space-y-2 max-h-32 sm:max-h-40 overflow-y-auto">
                {analysis.deviations.slice(0, 5).map((deviation, idx) => (
                  <div key={idx} className="text-xs p-2 bg-orange-50 rounded border border-orange-200">
                    <p className="font-semibold">{deviation.distance}m fora da rota</p>
                    <p className="text-[var(--ink-muted)]">
                      {deviation.timestamp.toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                ))}
                {analysis.deviations.length > 5 && (
                  <p className="text-xs text-[var(--ink-muted)]">
                    +{analysis.deviations.length - 5} mais desvios...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Paradas Não Planejadas */}
          {analysis.unplannedStops.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 sm:mb-3 text-xs sm:text-sm text-[var(--ink-muted)]">
                Paradas Não Planejadas ({analysis.unplannedStops.length})
              </h4>
              <div className="space-y-2 max-h-24 sm:max-h-32 overflow-y-auto">
                {analysis.unplannedStops.slice(0, 3).map((stop, idx) => (
                  <div key={idx} className="text-xs p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="font-semibold">{stop.duration} min parado</p>
                    <p className="text-[var(--ink-muted)]">
                      {stop.timestamp.toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                ))}
                {analysis.unplannedStops.length > 3 && (
                  <p className="text-xs text-[var(--ink-muted)]">
                    +{analysis.unplannedStops.length - 3} mais paradas...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Segmentos Divergentes */}
          {analysis.divergentSegments.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 sm:mb-3 text-xs sm:text-sm text-[var(--ink-muted)]">
                Segmentos Divergentes ({analysis.divergentSegments.length})
              </h4>
              <div className="space-y-2 max-h-24 sm:max-h-32 overflow-y-auto">
                {analysis.divergentSegments.slice(0, 3).map((segment, idx) => (
                  <div key={idx} className="text-xs p-2 bg-red-50 rounded border border-red-200">
                    <p className="font-semibold">
                      Segmento {segment.startIndex}-{segment.endIndex}
                    </p>
                    <p className="text-[var(--ink-muted)]">
                      Planejado: {(segment.plannedDistance / 1000).toFixed(2)} km
                    </p>
                    <p className="text-[var(--ink-muted)]">
                      Real: {(segment.actualDistance / 1000).toFixed(2)} km
                    </p>
                    {segment.deviation > 0 && (
                      <p className="text-red-600">
                        +{(segment.deviation / 1000).toFixed(2)} km extra
                      </p>
                    )}
                  </div>
                ))}
                {analysis.divergentSegments.length > 3 && (
                  <p className="text-xs text-[var(--ink-muted)]">
                    +{analysis.divergentSegments.length - 3} mais segmentos...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

