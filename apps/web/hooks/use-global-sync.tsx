"use client"

import { useEffect, useCallback, useRef } from 'react'
import { globalSyncManager } from '@/lib/global-sync'

type SyncEventType = 
  | 'company.created' 
  | 'company.updated' 
  | 'company.deleted'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'vehicle.created'
  | 'vehicle.updated'
  | 'vehicle.deleted'
  | 'route.created'
  | 'route.updated'
  | 'route.deleted'
  | 'motorista.created'
  | 'motorista.updated'
  | 'motorista.deleted'
  | 'employee.created'
  | 'employee.updated'
  | 'employee.deleted'
  | 'alert.created'
  | 'alert.updated'
  | 'cost.created'
  | 'cost.updated'
  | 'transportadora.created'
  | 'transportadora.updated'
  | 'transportadora.deleted'
  | 'assistance_request.updated'

type SyncCallback = (event: { type: SyncEventType; data: any }) => void

/**
 * Hook para sincronização global de dados
 * Escuta mudanças no Supabase e notifica componentes
 */
export function useGlobalSync(
  eventTypes: SyncEventType[],
  callback: SyncCallback,
  deps: any[] = []
) {
  const callbackRef = useRef(callback)
  const idRef = useRef(`sync-${Math.random().toString(36).substring(7)}`)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback, ...deps])

  useEffect(() => {
    const id = idRef.current
    const wrappedCallback = (event: { type: SyncEventType; data: any }) => {
      if (eventTypes.includes(event.type)) {
        callbackRef.current(event)
      }
    }

    const unsubscribe = globalSyncManager.subscribe(wrappedCallback)

    return () => {
      unsubscribe()
    }
  }, [eventTypes.join(',')])

  return useCallback((eventType: SyncEventType, data: any) => {
    globalSyncManager.triggerSync(eventType as any, data)
  }, [])
}

/**
 * Hook para invalidar cache e forçar refetch
 */
export function useCacheInvalidation() {
  return useCallback((cacheKeys: string[]) => {
    if (typeof window === 'undefined') return
    
    cacheKeys.forEach(key => {
      localStorage.removeItem(`golffox_cache_${key}`)
    })
  }, [])
}

