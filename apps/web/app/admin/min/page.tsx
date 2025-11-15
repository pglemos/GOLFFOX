"use client"

export default function AdminMin() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ maxWidth: 600, width: '100%', padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Admin</h1>
        <p style={{ color: '#555', marginBottom: 16 }}>Selecione uma área:</p>
        <div style={{ display: 'grid', gap: 8 }}>
          <a href="/admin/mapa" style={{ color: '#0a7', textDecoration: 'underline' }}>Mapa da Frota</a>
          <a href="/admin/custos" style={{ color: '#07a', textDecoration: 'underline' }}>Custos</a>
          <a href="/admin/relatorios" style={{ color: '#a70', textDecoration: 'underline' }}>Relatórios</a>
        </div>
      </div>
    </div>
  )
}
