'use client'

import { AdminErrorBoundary } from './error-boundary'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminErrorBoundary>
      {children}
    </AdminErrorBoundary>
  )
}

