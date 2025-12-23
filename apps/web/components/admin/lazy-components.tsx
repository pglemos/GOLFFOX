/**
 * Componentes Admin com Lazy Loading
 * 
 * Exporta versões lazy-loaded dos componentes pesados do admin
 * para melhorar o tempo de carregamento inicial.
 */

'use client'

import { lazy } from 'react'

import { withLazyLoading, TablePageSkeleton, DashboardPageSkeleton, MapPageSkeleton } from '@/components/shared/lazy-page-wrapper'

/**
 * Componentes de página lazy-loaded
 * Use dynamic imports do Next.js para páginas
 */

// AdminMap - componente pesado de mapa
export const LazyAdminMap = lazy(() => 
  import('@/components/admin-map/admin-map').then(mod => ({ default: mod.AdminMap }))
)

// VehicleModal - modal de veículos
export const LazyVehicleModal = lazy(() =>
  import('@/components/modals/veiculo-modal').then(mod => ({ default: mod.VeiculoModal }))
)

// RouteModal - modal de rotas
export const LazyRouteModal = lazy(() =>
  import('@/components/modals/route-modal').then(mod => ({ default: mod.RouteModal }))
)

// StopGenerator - gerador de paradas
export const LazyStopGenerator = lazy(() =>
  import('@/components/stop-generation/stop-generator').then(mod => ({ default: mod.StopGenerator }))
)

// FinancialDashboard - dashboard financeiro
export const LazyFinancialDashboard = lazy(() =>
  import('@/components/costs/financial-dashboard-expanded').then(mod => ({ default: mod.FinancialDashboardExpanded }))
)

// CostDashboard - dashboard de custos
export const LazyCostDashboard = lazy(() =>
  import('@/components/costs/cost-dashboard').then(mod => ({ default: mod.CostDashboard }))
)

/**
 * Componentes com HOC de lazy loading (incluem Error Boundary e Suspense)
 */
export const AdminMapWithSkeleton = withLazyLoading(
  () => import('@/components/admin-map/admin-map').then(mod => ({ default: mod.AdminMap })),
  MapPageSkeleton
)

export const FinancialDashboardWithSkeleton = withLazyLoading(
  () => import('@/components/costs/financial-dashboard-expanded').then(mod => ({ default: mod.FinancialDashboardExpanded })),
  DashboardPageSkeleton
)

export const CostDashboardWithSkeleton = withLazyLoading(
  () => import('@/components/costs/cost-dashboard').then(mod => ({ default: mod.CostDashboard })),
  DashboardPageSkeleton
)

