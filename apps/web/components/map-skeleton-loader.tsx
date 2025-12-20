'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface MapSkeletonLoaderProps {
  className?: string
}

export function MapSkeletonLoader({ className = '' }: MapSkeletonLoaderProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Cabeçalho skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-6 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapa skeleton */}
      <Card className="overflow-hidden">
        <div className="h-96 bg-muted relative">
          {/* Simulação de mapa com gradiente animado */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-50 via-green-50 to-blue-50"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
          
          {/* Marcadores skeleton simulados */}
          <div className="absolute inset-0 p-8">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 2) * 20}%`
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
              >
                <Skeleton className="h-8 w-8 rounded-full" />
              </motion.div>
            ))}
          </div>

          {/* Linha de rota skeleton */}
          <svg className="absolute inset-0 w-full h-full">
            <motion.path
              d="M 80 120 Q 160 80 240 120 T 400 120"
              stroke="#e5e7eb"
              strokeWidth="4"
              fill="none"
              strokeDasharray="8 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
          </svg>

          {/* Overlay de carregamento */}
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
            <div className="text-center">
              <motion.div
                className="w-8 h-8 border-4 border-info-light border-t-blue-600 rounded-full mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-sm text-ink-muted font-medium">
                Carregando mapa...
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Barra de progresso skeleton */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Barra de progresso */}
          <div className="relative">
            <Skeleton className="h-2 w-full rounded-full" />
            <motion.div
              className="absolute top-1/2 w-4 h-4 bg-muted rounded-full transform -translate-y-1/2"
              animate={{ left: ['0%', '100%', '0%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Marcadores da linha do tempo */}
          <div className="flex justify-between items-center pt-4">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Skeleton className="w-3 h-3 rounded-full" />
                <Skeleton className="w-6 h-6 rounded-full mt-1" />
                <Skeleton className="h-3 w-12 mt-1" />
                <Skeleton className="h-3 w-16 mt-1" />
              </motion.div>
            ))}
          </div>

          {/* Informações da parada atual */}
          <motion.div
            className="p-3 bg-bg-soft rounded-lg border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MapSkeletonLoader