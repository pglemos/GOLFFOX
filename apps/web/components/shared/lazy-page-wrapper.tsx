/**
 * Wrapper para páginas com lazy loading
 * 
 * Fornece:
 * - Loading skeleton enquanto carrega
 * - Error boundary para erros de carregamento
 * - Fallback para navegação durante loading
 */

'use client'

import React, { Suspense, ComponentType, Component, ReactNode, ErrorInfo } from 'react'

import { AlertCircle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { logError } from '@/lib/logger'

interface LazyPageWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorFallbackProps {
  error: Error | null
  resetError: () => void
}

// Skeleton padrão para páginas
function PageSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>

      {/* Main content */}
      <Skeleton className="h-64 rounded-lg" />

      {/* Table skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}

// Fallback de erro
function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-lg font-semibold mb-2">Erro ao carregar página</h2>
      <p className="text-muted-foreground mb-4 text-center max-w-md">
        {error?.message || 'Ocorreu um erro ao carregar esta página.'}
      </p>
      <Button onClick={resetError} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Tentar novamente
      </Button>
    </div>
  )
}

// Error Boundary nativo do React
class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: (props: ErrorFallbackProps) => ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: (props: ErrorFallbackProps) => ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError('ErrorBoundary caught an error', { error, errorInfo }, 'LazyPageWrapper')
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({ error: this.state.error, resetError: this.resetError })
      }
      return <ErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

/**
 * Wrapper para páginas com lazy loading
 */
export function LazyPageWrapper({
  children,
  fallback = <PageSkeleton />,
}: LazyPageWrapperProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  )
}

/**
 * HOC para criar componentes de página lazy-loaded
 */
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  LoadingComponent: ComponentType = PageSkeleton
) {
  const LazyComponent = React.lazy(importFn)

  return function LazyPage(props: P) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<LoadingComponent />}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    )
  }
}

/**
 * Skeletons especializados para diferentes tipos de página
 */
export function TablePageSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  )
}

export function DashboardPageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>

      {/* Table */}
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

export function MapPageSkeleton() {
  return (
    <div className="relative h-[calc(100vh-4rem)]">
      <Skeleton className="absolute inset-0" />
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  )
}

export function FormPageSkeleton() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex gap-4 justify-end">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

