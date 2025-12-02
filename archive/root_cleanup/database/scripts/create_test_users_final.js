const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
const fs = require('fs');
const path = require('path');
try {
  const envPath = path.join(__dirname, '../../web-app/.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const cleaned = line.trim();
      if (cleaned && !cleaned.startsWith('#')) {
        const match = cleaned.match(/^([^=#]+)=(.+)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim().replace(/^["']|["']$/g, '');
          // Remover comentários no final da linha
          const commentIndex = value.indexOf('#');
          if (commentIndex !== -1) {
            value = value.substring(0, commentIndex).trim();
          }
          if (value && !process.env[key]) {
            process.env[key] = value;
          }
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
  console.error('Configure no arquivo web-app/.env.local:');
  console.error('SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
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

    // Obter empresa existente ou criar
    let companyId;
    const companyResult = await dbClient.query('SELECT id FROM companies LIMIT 1');
    
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

    // Listar usuários existentes no Auth
    console.log('\n📋 Verificando usuários existentes no Supabase Auth...');
    const { data: authUsersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message);
      console.error('Verifique se a SUPABASE_SERVICE_ROLE_KEY está correta e tem permissões de admin');
      process.exit(1);
    }

    const existingAuthUsers = authUsersData?.users || [];
    console.log(`✅ Encontrados ${existingAuthUsers.length} usuários no Auth`);

    // Processar cada usuário de teste
    for (const userData of testUsers) {
      try {
        console.log(`\n👤 Processando: ${userData.email}...`);
        
        // Verificar se usuário já existe no Auth
        const existingUser = existingAuthUsers.find(u => u.email === userData.email);
        let userId;

        if (existingUser) {
          console.log(`   ✅ Usuário já existe no Auth (ID: ${existingUser.id})`);
          userId = existingUser.id;
          
          // Atualizar senha e metadados
          console.log(`   🔄 Atualizando senha e metadados...`);
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: userData.password,
            user_metadata: {
              role: userData.role,
              name: userData.name
            },
            app_metadata: {
              role: userData.role
            }
          });
          
          if (updateError) {
            console.log(`   ⚠️  Erro ao atualizar: ${updateError.message}`);
            // Continuar mesmo com erro - usuário já existe
          } else {
            console.log(`   ✅ Usuário atualizado no Auth`);
          }
        } else {
          // Criar novo usuário
          console.log(`   ➕ Criando novo usuário no Auth...`);
          const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: {
              role: userData.role,
              name: userData.name
            },
            app_metadata: {
              role: userData.role
            }
          });

          if (createError) {
            console.error(`   ❌ Erro ao criar usuário: ${createError.message}`);
            
            // Se o erro for relacionado a políticas de email, tentar com email diferente
            if (createError.message.includes('email') || createError.message.includes('domain')) {
              console.log(`   💡 Dica: O Supabase pode ter restrições para domínios @example.com`);
              console.log(`   💡 Considere usar um domínio real ou verificar as configurações do Supabase`);
            }
            continue;
          }

          if (!createData?.user) {
            console.error(`   ❌ Não foi possível obter dados do usuário criado`);
            continue;
          }

          userId = createData.user.id;
          console.log(`   ✅ Usuário criado no Auth (ID: ${userId})`);
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
            console.log(`      - Email: ${userInsertResult.rows[0].email}`);
            console.log(`      - Role: ${userInsertResult.rows[0].role}`);
          }
        } catch (dbError) {
          console.error(`   ❌ Erro ao inserir na tabela users: ${dbError.message}`);
          
          // Se o erro for de constraint ou coluna, tentar sem campos opcionais
          if (dbError.message.includes('column') && dbError.message.includes('does not exist')) {
            console.log(`   🔄 Tentando inserir sem campos opcionais...`);
            try {
              const simpleInsert = await dbClient.query(`
                INSERT INTO users (id, email, role, company_id)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO UPDATE
                SET email = $2, role = $3, company_id = $4
                RETURNING id, email, role
              `, [userId, userData.email, userData.role, companyId]);
              
              if (simpleInsert.rows.length > 0) {
                console.log(`   ✅ Usuário inserido (versão simplificada)`);
              }
            } catch (simpleError) {
              console.error(`   ❌ Erro mesmo na versão simplificada: ${simpleError.message}`);
            }
          }
        }

      } catch (userError) {
        console.error(`   ❌ Erro ao processar usuário: ${userError.message}`);
      }
    }

    console.log('\n✨ Processo concluído!');
    console.log('\n📋 Credenciais de teste esperadas pelos testes:');
    testUsers.forEach(u => {
      console.log(`   - ${u.email} / ${u.password} (${u.role})`);
    });
    console.log('\n💡 Se os usuários não foram criados no Auth, verifique:');
    console.log('   1. Se a SUPABASE_SERVICE_ROLE_KEY está correta');
    console.log('   2. Se há restrições de domínio de email no Supabase');
    console.log('   3. Se as políticas do Supabase permitem criação de usuários');

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

