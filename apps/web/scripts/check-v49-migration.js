const { createClient } = require('@supabase/supabase-js')

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!url || !serviceKey) {
    console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }
  const supabase = createClient(url, serviceKey)

  try {
    const { error: tableErr } = await supabase
      .from('gf_user_company_map')
      .select('id')
      .limit(1)
    if (tableErr) {
      console.error('Tabela gf_user_company_map inacessível:', tableErr.message)
    } else {
      console.log('Tabela gf_user_company_map acessível')
    }

    // Tentativa de leitura para observar RLS
    const { data, error: rlsErr } = await supabase
      .from('gf_user_company_map')
      .select('*')
      .limit(1)
    if (rlsErr) {
      console.warn('RLS possivelmente ativo (bloqueio de leitura esperado sem privilégios):', rlsErr.message)
    } else {
      console.log('Leitura realizada; verifique se RLS está configurado conforme v49. Exemplo de linha:', data && data[0])
    }

    // Check with anon key to infer RLS
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
    if (anonKey) {
      const supabaseAnon = createClient(url, anonKey)
      const { data: anonData, error: anonErr } = await supabaseAnon
        .from('gf_user_company_map')
        .select('*')
        .limit(1)
      if (anonErr) {
        console.log('RLS ativo para anon key (esperado):', anonErr.message)
      } else {
        console.log('Anon conseguiu ler gf_user_company_map (RLS pode estar desabilitado). Exemplo:', anonData && anonData[0])
      }
    } else {
      console.warn('Anon key não fornecida; pulando verificação RLS com anon')
    }
  } catch (e) {
    console.error('Erro ao verificar v49:', e && e.message ? e.message : e)
    process.exit(1)
  }
}

main()
