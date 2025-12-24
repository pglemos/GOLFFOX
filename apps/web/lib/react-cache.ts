/**
 * React Cache Utilities
 * 
 * Helper functions for using React's cache() function for memoization
 * This provides automatic memoization of function results within a single request
 */

import { cache } from 'react'

import { debug } from './logger'

/**
 * Create a cached version of an async function
 * Results are memoized per request, preventing duplicate work
 * 
 * @example
 * const getCompany = cache(async (id: string) => {
 *   return await fetchCompany(id)
 * })
 */
export function createCachedFunction<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T
): T {
  return cache(fn) as T
}

/**
 * Cache a data fetching function with automatic memoization
 * Useful for server components and route handlers
 * 
 * @example
 * const fetchCompanies = cacheDataFetch(async (filters) => {
 *   const data = await db.companies.findMany(filters)
 *   return data
 * })
 */
export function cacheDataFetch<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  key?: string
): T {
  if (key) {
    // If a key is provided, we can use it for better debugging
    const cachedFn = cache(fn)
    return ((...args: Parameters<T>) => {
      if (process.env.NODE_ENV === 'development') {
        debug(`[Cache] ${key}`, { key, args }, 'ReactCache')
      }
      return cachedFn(...args)
    }) as T
  }
  return cache(fn) as T
}

