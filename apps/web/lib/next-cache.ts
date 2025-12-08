/**
 * Next.js Cache APIs
 * 
 * Utilities for using Next.js 16 improved caching APIs:
 * - updateTag(): Update cache tags without revalidating
 * - revalidateTag(): Revalidate specific cache tags
 * - revalidatePath(): Revalidate specific paths
 */

import { revalidateTag, revalidatePath } from 'next/cache'

/**
 * Update a cache tag (Next.js 16+)
 * This marks the tag as needing revalidation without immediately revalidating
 * 
 * @param tag - The cache tag to update
 */
export async function updateCacheTag(tag: string): Promise<void> {
  // Note: updateTag() is not yet available in Next.js 16.0.7
  // This is a placeholder for when it becomes available
  // For now, we use revalidateTag() which has similar effect
  await revalidateTag(tag, 'max')
}

/**
 * Revalidate a cache tag
 * This immediately revalidates all cached data with the given tag
 * 
 * @param tag - The cache tag to revalidate
 */
export async function invalidateCacheTag(tag: string): Promise<void> {
  await revalidateTag(tag, 'max')
}

/**
 * Revalidate multiple cache tags at once
 * 
 * @param tags - Array of cache tags to revalidate
 */
export async function invalidateCacheTags(tags: string[]): Promise<void> {
  await Promise.all(tags.map(tag => revalidateTag(tag, 'max')))
}

/**
 * Revalidate a specific path
 * 
 * @param path - The path to revalidate (e.g., '/admin/companies')
 * @param type - The type of revalidation ('page' | 'layout')
 */
export async function invalidateCachePath(
  path: string,
  type: 'page' | 'layout' = 'page'
): Promise<void> {
  await revalidatePath(path, type)
}

/**
 * Revalidate multiple paths at once
 * 
 * @param paths - Array of paths to revalidate
 * @param type - The type of revalidation ('page' | 'layout')
 */
export async function invalidateCachePaths(
  paths: string[],
  type: 'page' | 'layout' = 'page'
): Promise<void> {
  await Promise.all(paths.map(path => revalidatePath(path, type)))
}

/**
 * Helper to create cache tags for entities
 * 
 * @example
 * const companyTag = createEntityTag('company', companyId)
 * // Returns: 'company:123'
 */
export function createEntityTag(entityType: string, id: string): string {
  return `${entityType}:${id}`
}

/**
 * Helper to create cache tags for lists
 * 
 * @example
 * const companiesListTag = createListTag('companies')
 * // Returns: 'companies:list'
 */
export function createListTag(entityType: string): string {
  return `${entityType}:list`
}

/**
 * Helper to invalidate both entity and list cache
 * 
 * @example
 * await invalidateEntityCache('company', companyId)
 * // Invalidates both 'company:123' and 'companies:list'
 */
export async function invalidateEntityCache(
  entityType: string,
  id: string
): Promise<void> {
  const entityTag = createEntityTag(entityType, id)
  const listTag = createListTag(`${entityType}s`)
  
  await invalidateCacheTags([entityTag, listTag])
}

