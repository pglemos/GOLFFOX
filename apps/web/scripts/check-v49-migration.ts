import { createClient } from '@supabase/supabase-js'

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!url || !serviceKey) {
    console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  const supabase = createClient(url, serviceKey)

  try {
    const { data: mapCount, error: mapError } = await supabase
      .from('gf_user_company_map')
      .select('id', { count: 'exact', head: true })
    if (mapError) {
      console.error('Tabela gf_user_company_map não encontrada ou sem acesso:', mapError.message)
    } else {
      console.log('Tabela gf_user_company_map acessível')
    }

    const { data: policies, error: polError } = await supabase
      .from('gf_user_company_map')
      .select('*')
      .limit(1)
    if (polError) {
      console.warn('Possível RLS bloqueando leitura (esperado em chaves sem privilégio).')
    } else {
      console.log('Leitura realizada; verifique se RLS está configurado conforme v49.')
    }
  } catch (e: any) {
    console.error('Erro ao verificar v49:', e.message)
    process.exit(1)
  }
}

main()

