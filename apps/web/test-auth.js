const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://vmoxzesvjcfmrebagcwo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  console.log('🔄 Testando autenticação...')
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'golffox@admin.com',
      password: 'senha123'
    })
    
    if (error) {
      console.error('❌ Erro:', error.message)
    } else {
      console.log('✅ Login bem-sucedido!')
      console.log('👤 Usuário:', data.user?.email)
      console.log('🔑 Sessão criada:', !!data.session)
    }
  } catch (err) {
    console.error('💥 Erro na conexão:', err.message)
  }
}

testAuth()