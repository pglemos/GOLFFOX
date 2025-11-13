require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: Variáveis de ambiente Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixTriggerFunction() {
  console.log('\n🔧 CORRIGINDO FUNÇÃO DO TRIGGER...\n');

  // A função calculate_trip_summary precisa verificar se o trip ainda existe
  // antes de tentar inserir/atualizar trip_summary
  const fixSQL = `
-- Corrigir função para verificar se trip existe antes de atualizar trip_summary
CREATE OR REPLACE FUNCTION public.recalculate_trip_summary_on_position()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE 
  v_trip uuid;
  v_trip_exists boolean;
BEGIN
  v_trip := COALESCE(NEW.trip_id, OLD.trip_id);
  
  IF v_trip IS NOT NULL THEN
    -- Verificar se o trip ainda existe antes de calcular summary
    SELECT EXISTS(SELECT 1 FROM public.trips WHERE id = v_trip) INTO v_trip_exists;
    
    IF v_trip_exists THEN
      PERFORM public.calculate_trip_summary(v_trip);
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END; $$;
  `;

  try {
    // Tentar executar via RPC se disponível
    const { error: rpcError } = await supabase.rpc('exec_sql', {
      sql: fixSQL
    }).catch(() => ({ error: { message: 'RPC não disponível' } }));

    if (rpcError) {
      console.log('⚠️ Não foi possível executar SQL via RPC');
      console.log('💡 Execute este SQL manualmente no Supabase SQL Editor:');
      console.log('\n' + fixSQL + '\n');
      return false;
    }

    console.log('✅ Função do trigger corrigida!');
    return true;

  } catch (error) {
    console.error('❌ Erro:', error);
    return false;
  }
}

async function main() {
  console.log('🔧 CORREÇÃO DO TRIGGER TRIP_SUMMARY');
  console.log('===================================\n');

  const success = await fixTriggerFunction();

  if (!success) {
    console.log('\n⚠️ Execute o SQL manualmente no Supabase SQL Editor');
  }

  process.exit(success ? 0 : 1);
}

main();

