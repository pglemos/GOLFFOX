"use client"

import { useCallback, useMemo, useSyncExternalStore } from 'react'

type NavigateOptions = {
  scroll?: boolean
}

export function useRouter() {
  const push = useCallback((href: string, _options?: NavigateOptions) => {
    if (typeof window !== 'undefined') window.location.assign(href)
  }, [])
  const replace = useCallback((href: string, _options?: NavigateOptions) => {
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

  return useMemo(
    () => ({ push, replace, prefetch, back, forward, refresh }),
    [push, replace, prefetch, back, forward, refresh]
  )
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
  const subscribe = (cb: () => void) => {
    window.addEventListener('popstate', cb)
    window.addEventListener('hashchange', cb)
    return () => {
      window.removeEventListener('popstate', cb)
      window.removeEventListener('hashchange', cb)
    }
  }
  const getSnapshot = () => (typeof window !== 'undefined' ? window.location.search : '')
  const getServerSnapshot = () => ''
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return useMemo(() => new URLSearchParams(search), [search])
}
