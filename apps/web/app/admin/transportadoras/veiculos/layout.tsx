// Desabilitar prerendering para esta página client-side
// Isso evita o erro "Cannot redefine property: default" durante o build
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function VeiculosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

