'use client'

import { Suspense } from 'react'

export const dynamic = 'force-dynamic'
import { EmpresaTenantProvider } from '@/components/providers/empresa-tenant-provider'
import { RealtimeProvider } from '@/components/providers/realtime-provider'

import { EmpresaErrorBoundary } from './error-boundary'

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-soft">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-ink-muted">Carregando...</p>
      </div>
    </div>
  )
}

export default function EmpresaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <EmpresaErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <EmpresaTenantProvider>
          <RealtimeProvider>
            {children}
          </RealtimeProvider>
        </EmpresaTenantProvider>
      </Suspense>
    </EmpresaErrorBoundary>
  )
}
