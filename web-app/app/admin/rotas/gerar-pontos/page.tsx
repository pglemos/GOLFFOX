import StopGenerator from '../../../../components/stop-generation/stop-generator'

export default function Page({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const rid = (searchParams?.routeId as string) || ''
  return (
    <div style={{ padding: 16 }}>
      <h1>Gerador de Pontos da Rota</h1>
      {!rid && <div style={{ marginBottom: 12 }}>Passe ?routeId=... na URL para carregar a rota.</div>}
      <StopGenerator routeId={rid} />
    </div>
  )
}

