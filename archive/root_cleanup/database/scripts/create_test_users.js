const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Tentar carregar variáveis de ambiente do .env.local
try {
  const envPath = path.join(__dirname, '../../web-app/.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
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

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!');
  console.error('Defina a variável de ambiente SUPABASE_SERVICE_ROLE_KEY');
  console.error('Ou adicione no arquivo web-app/.env.local');
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

async function createTestUsers() {
  try {
    console.log('🔌 Conectando ao banco de dados...');
    await dbClient.connect();
    console.log('✅ Conectado ao banco de dados!');

    // Criar empresa de teste se não existir
    let companyId;
    const companyResult = await dbClient.query(`
      SELECT id FROM companies LIMIT 1
    `);
    
    if (companyResult.rows.length === 0) {
      console.log('🏢 Criando empresa de teste...');
      const newCompany = await dbClient.query(`
        INSERT INTO companies (name, is_active)
        VALUES ('Empresa Teste', true)
        RETURNING id
      `);
      companyId = newCompany.rows[0].id;
      console.log(`✅ Empresa criada: ${companyId}`);
    } else {
      companyId = companyResult.rows[0].id;
      console.log(`📋 Usando empresa existente: ${companyId}`);
    }

    for (const userData of testUsers) {
      try {
        console.log(`\n👤 Processando usuário: ${userData.email}...`);
        
        // 1. Verificar se usuário já existe no Auth
        let userId = null;
        let userExists = false;
        
        try {
          const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
          if (!listError && listData) {
            const existingUser = listData.users.find(u => u.email === userData.email);
            if (existingUser) {
              userId = existingUser.id;
              userExists = true;
              console.log(`📋 Usuário ${userData.email} já existe no Auth (ID: ${userId})`);
              
              // Atualizar senha e metadados
              const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
                password: userData.password,
                user_metadata: {
                  role: userData.role,
                  name: userData.name
                }
              });
              
              if (updateError) {
                console.error(`⚠️  Erro ao atualizar usuário: ${updateError.message}`);
              } else {
                console.log(`✅ Usuário ${userData.email} atualizado no Auth`);
              }
            }
          }
        } catch (listErr) {
          console.warn(`⚠️  Erro ao listar usuários: ${listErr.message}`);
        }
        
        // 2. Se usuário não existe, criar novo
        if (!userExists) {
          console.log(`➕ Criando novo usuário ${userData.email} no Auth...`);
          const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: {
              role: userData.role,
              name: userData.name
            }
          });
          
          if (createError) {
            console.error(`❌ Erro ao criar usuário no Auth: ${createError.message}`);
            continue;
          }
          
          if (createData?.user) {
            userId = createData.user.id;
            console.log(`✅ Usuário ${userData.email} criado no Auth (ID: ${userId})`);
          } else {
            console.error(`❌ Não foi possível obter ID do usuário criado`);
            continue;
          }
        }

        if (!userId) {
          console.error(`❌ Não foi possível obter ID do usuário ${userData.email}`);
          continue;
        }

        // 3. Criar/atualizar usuário na tabela users
        console.log(`📝 Criando/atualizando usuário na tabela users...`);
        const userInsertResult = await dbClient.query(`
          INSERT INTO users (id, email, name, role, company_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE
          SET email = $2, name = $3, role = $4, company_id = $5, updated_at = NOW()
          RETURNING id, email, role
        `, [userId, userData.email, userData.name, userData.role, companyId]);

        if (userInsertResult.rows.length > 0) {
          console.log(`✅ Usuário ${userData.email} criado/atualizado na tabela users`);
          console.log(`   - ID: ${userInsertResult.rows[0].id}`);
          console.log(`   - Role: ${userInsertResult.rows[0].role}`);
        } else {
          console.log(`⚠️  Não foi possível inserir usuário ${userData.email} na tabela users`);
        }

      } catch (userError) {
        console.error(`❌ Erro ao processar usuário ${userData.email}:`, userError.message);
        // Continuar com próximo usuário
      }
    }

    console.log('\n✨ Processo concluído!');
    console.log('\n📋 Credenciais de teste criadas:');
    testUsers.forEach(u => {
      console.log(`   - ${u.email} / ${u.password} (${u.role})`);
    });
    console.log('\n💡 Use essas credenciais nos testes do TestSprite');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  } finally {
    await dbClient.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

createTestUsers();
