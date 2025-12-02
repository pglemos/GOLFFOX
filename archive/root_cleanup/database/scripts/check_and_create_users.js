const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Carregar variáveis de ambiente do web-app/.env.local
const fs = require('fs');
const path = require('path');
try {
  const envPath = path.join(__dirname, '../../web-app/.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=#]+)=(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '').replace(/#.*$/, '').trim();
        if (value && !process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (err) {
  console.warn('⚠️  Não foi possível carregar .env.local:', err.message);
}

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmoxzesvjcfmrebagcwo.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!');
  console.error('Por favor, defina a variável de ambiente SUPABASE_SERVICE_ROLE_KEY');
  console.error('Você pode encontrá-la no painel do Supabase: Settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const dbClient = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const testUsers = [
  {
    email: 'valid.user@example.com',
    password: 'ValidPassword123!',
    role: 'passenger',
    name: 'Usuário Válido'
  },
  {
    email: 'admin@example.com',
    password: 'AdminPass123!',
    role: 'admin',
    name: 'Administrador'
  },
  {
    email: 'operator@example.com',
    password: 'OperatorPass123!',
    role: 'operator',
    name: 'Operador'
  }
];

async function checkAndCreateUsers() {
  try {
    console.log('🔌 Conectando ao banco de dados...');
    await dbClient.connect();
    console.log('✅ Conectado ao banco de dados!');

    // Verificar usuários existentes no Auth
    console.log('\n📋 Verificando usuários existentes no Supabase Auth...');
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message);
      console.error('Verifique se a SUPABASE_SERVICE_ROLE_KEY está correta');
      process.exit(1);
    }

    console.log(`✅ Encontrados ${authUsers.users.length} usuários no Auth`);
    
    // Verificar usuários existentes no banco
    const dbUsersResult = await dbClient.query('SELECT id, email, role FROM users LIMIT 10');
    console.log(`✅ Encontrados ${dbUsersResult.rows.length} usuários no banco de dados`);

    // Criar empresa de teste se não existir
    let companyId;
    const companyResult = await dbClient.query('SELECT id FROM companies LIMIT 1');
    
    if (companyResult.rows.length === 0) {
      console.log('\n🏢 Criando empresa de teste...');
      const newCompany = await dbClient.query(`
        INSERT INTO companies (name, is_active)
        VALUES ('Empresa Teste', true)
        RETURNING id
      `);
      companyId = newCompany.rows[0].id;
      console.log(`✅ Empresa criada: ${companyId}`);
    } else {
      companyId = companyResult.rows[0].id;
      console.log(`\n📋 Usando empresa existente: ${companyId}`);
    }

    // Processar cada usuário de teste
    for (const userData of testUsers) {
      try {
        console.log(`\n👤 Processando: ${userData.email}...`);
        
        // Verificar se usuário já existe
        const existingAuthUser = authUsers.users.find(u => u.email === userData.email);
        
        let userId;
        
        if (existingAuthUser) {
          console.log(`   ✅ Usuário já existe no Auth (ID: ${existingAuthUser.id})`);
          userId = existingAuthUser.id;
          
          // Tentar atualizar senha
          try {
            const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
              password: userData.password,
              user_metadata: {
                role: userData.role,
                name: userData.name
              }
            });
            
            if (updateError) {
              console.log(`   ⚠️  Não foi possível atualizar senha: ${updateError.message}`);
            } else {
              console.log(`   ✅ Senha atualizada`);
            }
          } catch (updateErr) {
            console.log(`   ⚠️  Erro ao atualizar: ${updateErr.message}`);
          }
        } else {
          // Tentar criar novo usuário usando API REST diretamente
          console.log(`   ➕ Tentando criar usuário no Auth...`);
          
          try {
            // Usar método alternativo: criar via API REST
            const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                'apikey': SUPABASE_SERVICE_KEY
              },
              body: JSON.stringify({
                email: userData.email,
                password: userData.password,
                email_confirm: true,
                user_metadata: {
                  role: userData.role,
                  name: userData.name
                }
              })
            });

            if (response.ok) {
              const userData_resp = await response.json();
              userId = userData_resp.id;
              console.log(`   ✅ Usuário criado via API REST (ID: ${userId})`);
            } else {
              const errorData = await response.text();
              console.log(`   ❌ Erro ao criar via API REST: ${response.status} - ${errorData}`);
              
              // Se falhar, tentar criar usando signUp e depois promover para admin
              console.log(`   🔄 Tentando método alternativo...`);
              
              // Usar anon key para signup primeiro
              const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
              if (anonKey) {
                const anonClient = createClient(SUPABASE_URL, anonKey);
                const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
                  email: userData.email,
                  password: userData.password,
                  options: {
                    data: {
                      role: userData.role,
                      name: userData.name
                    }
                  }
                });
                
                if (signUpError) {
                  console.log(`   ❌ Erro no signUp: ${signUpError.message}`);
                  continue;
                }
                
                if (signUpData.user) {
                  userId = signUpData.user.id;
                  console.log(`   ✅ Usuário criado via signUp (ID: ${userId})`);
                  
                  // Confirmar email manualmente
                  await supabase.auth.admin.updateUserById(userId, {
                    email_confirm: true
                  });
                }
              } else {
                console.log(`   ⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada, pulando criação`);
                continue;
              }
            }
          } catch (fetchError) {
            console.log(`   ❌ Erro ao criar usuário: ${fetchError.message}`);
            continue;
          }
        }

        if (!userId) {
          console.log(`   ⚠️  Não foi possível obter ID do usuário, pulando...`);
          continue;
        }

        // Criar/atualizar na tabela users
        console.log(`   📝 Criando/atualizando na tabela users...`);
        try {
          const userInsertResult = await dbClient.query(`
            INSERT INTO users (id, email, name, role, company_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (id) DO UPDATE
            SET email = $2, name = $3, role = $4, company_id = $5, updated_at = NOW()
            RETURNING id, email, role
          `, [userId, userData.email, userData.name, userData.role, companyId]);

          if (userInsertResult.rows.length > 0) {
            console.log(`   ✅ Usuário criado/atualizado na tabela users`);
            console.log(`      - ID: ${userInsertResult.rows[0].id}`);
            console.log(`      - Role: ${userInsertResult.rows[0].role}`);
          }
        } catch (dbError) {
          console.log(`   ⚠️  Erro ao inserir na tabela users: ${dbError.message}`);
        }

      } catch (userError) {
        console.error(`   ❌ Erro ao processar usuário: ${userError.message}`);
      }
    }

    console.log('\n✨ Processo concluído!');
    console.log('\n📋 Credenciais de teste esperadas:');
    testUsers.forEach(u => {
      console.log(`   - ${u.email} / ${u.password} (${u.role})`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  } finally {
    await dbClient.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

checkAndCreateUsers();

