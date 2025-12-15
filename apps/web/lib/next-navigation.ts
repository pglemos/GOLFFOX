"use client"

import { useCallback, useSyncExternalStore } from 'react'

export function useRouter() {
  const push = useCallback((href: string) => {
    if (typeof window !== 'undefined') window.location.assign(href)
  }, [])
  const replace = useCallback((href: string) => {
    if (typeof window !== 'undefined') window.location.replace(href)
  }, [])
  const prefetch = useCallback(async (_href: string) => {
    // No-op prefetch in shim
  }, [])
  const back = useCallback(() => {
    if (typeof window !== 'undefined') window.history.back()
  }, [])
  const forward = useCallback(() => {
    if (typeof window !== 'undefined') window.history.forward()
  }, [])
  const refresh = useCallback(() => {
    if (typeof window !== 'undefined') window.location.reload()
  }, [])

  return { push, replace, prefetch, back, forward, refresh }
}

export function usePathname(): string {
  const subscribe = (cb: () => void) => {
    window.addEventListener('popstate', cb)
    return () => {
      window.removeEventListener('popstate', cb)
    }
  }
  const getSnapshot = () => (typeof window !== 'undefined' ? window.location.pathname : '')
  const getServerSnapshot = () => ''
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useSearchParams(): URLSearchParams {
  const search = typeof window !== 'undefined' ? window.location.search : ''
  return new URLSearchParams(search)
}
