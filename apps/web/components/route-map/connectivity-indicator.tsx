"use client"

import { Wifi, WifiOff } from "lucide-react"

interface ConnectivityIndicatorProps {
  isOnline: boolean
  cacheExpiry: number | null
  isMobile: boolean
}

export function ConnectivityIndicator({
  isOnline,
  cacheExpiry,
  isMobile,
}: ConnectivityIndicatorProps) {
  return (
    <div
      className={`flex items-center gap-2 ${
        isMobile ? 'flex-wrap justify-center' : ''
      }`}
      role="status"
      aria-label="Status da conexão"
    >
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
          isOnline ? 'bg-success-light text-success' : 'bg-error-light text-error'
        }`}
        aria-live="polite"
      >
        {isOnline ? (
          <Wifi className="w-3 h-3" aria-hidden="true" />
        ) : (
          <WifiOff className="w-3 h-3" aria-hidden="true" />
        )}
        {isOnline ? 'Online' : 'Offline'}
      </div>

      {cacheExpiry && (
        <div
          className={`text-xs text-ink-muted ${isMobile ? 'text-center' : ''}`}
          aria-label={`Cache válido até ${new Date(cacheExpiry).toLocaleTimeString()}`}
        >
          Cache válido até {new Date(cacheExpiry).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}
