export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-bg">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-text-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-3 text-sm text-ink-muted">Carregando...</p>
      </div>
    </div>
  )
}

