/**
 * Script para criar dados de teste completos incluindo trips e posições GPS
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function createTestData() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  console.log('🎨 CRIANDO DADOS DE TESTE COMPLETOS\n');
  console.log('═══════════════════════════════════════\n');

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // 1. Pegar empresa existente
    console.log('1️⃣  Obtendo empresa...');
    const companies = await client.query(`SELECT id, name FROM companies LIMIT 1`);
    const companyId = companies.rows[0].id;
    const companyName = companies.rows[0].name;
    console.log(`✅ Usando empresa: ${companyName} (${companyId})\n`);

    // 2. Criar veículos de teste adicionais
    console.log('2️⃣  Criando veículos de teste...');
    const vehiclesToCreate = [
      { id: '11111111-1111-1111-1111-111111111111', plate: 'TEST-001', model: 'Ônibus Mercedes Benz O500U', year: 2023, capacity: 40 },
      { id: '22222222-2222-2222-2222-222222222222', plate: 'TEST-002', model: 'Van Sprinter 415', year: 2022, capacity: 15 },
      { id: '33333333-3333-3333-3333-333333333333', plate: 'TEST-003', model: 'Micro-ônibus Iveco Daily', year: 2023, capacity: 25 }
    ];

    for (const vehicle of vehiclesToCreate) {
      await client.query(`
        INSERT INTO vehicles (id, plate, model, year, capacity, is_active, company_id, created_at)
        VALUES ($1, $2, $3, $4, $5, true, $6, NOW())
        ON CONFLICT (id) DO UPDATE SET
          is_active = true,
          company_id = EXCLUDED.company_id,
          year = EXCLUDED.year,
          capacity = EXCLUDED.capacity
      `, [vehicle.id, vehicle.plate, vehicle.model, vehicle.year, vehicle.capacity, companyId]);
      
      console.log(`   ✓ ${vehicle.plate} (${vehicle.model})`);
    }
    console.log('');

    // 3. Criar rota de teste
    console.log('3️⃣  Criando rota de teste...');
    const routeId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    await client.query(`
      INSERT INTO routes (id, name, company_id, created_at)
      VALUES ($1, 'Rota Teste Centro-Bairro', $2, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        company_id = EXCLUDED.company_id
    `, [routeId, companyId]);
    console.log(`   ✓ Rota Teste Centro-Bairro\n`);

    // 4. Criar route_stops
    console.log('4️⃣  Criando paradas da rota...');
    const stops = [
      { seq: 1, lat: -15.7942, lng: -47.8822, name: 'Terminal Central' },
      { seq: 2, lat: -15.8000, lng: -47.8900, name: 'Av. Principal' },
      { seq: 3, lat: -15.8100, lng: -47.9000, name: 'Bairro Norte' },
      { seq: 4, lat: -15.8150, lng: -47.9100, name: 'Escola Municipal' },
      { seq: 5, lat: -15.8200, lng: -47.9150, name: 'Hospital Regional' }
    ];

    for (const stop of stops) {
      await client.query(`
        INSERT INTO route_stops (route_id, seq, lat, lng, name)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (route_id, seq) DO UPDATE SET
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          name = EXCLUDED.name
      `, [routeId, stop.seq, stop.lat, stop.lng, stop.name]);
      
      console.log(`   ✓ Parada ${stop.seq}: ${stop.name}`);
    }
    console.log('');

    // 5. Verificar se há usuário motorista
    console.log('5️⃣  Verificando motoristas...');
    const drivers = await client.query(`
      SELECT id, email, name FROM users WHERE role = 'driver' LIMIT 1
    `);

    let driverId;
    if (drivers.rows.length > 0) {
      driverId = drivers.rows[0].id;
      console.log(`✅ Motorista encontrado: ${drivers.rows[0].name || drivers.rows[0].email}\n`);
    } else {
      console.log('⚠️  Nenhum motorista encontrado - trips não serão criadas\n');
    }

    // 6. Criar trips ativas (apenas se houver motorista)
    if (driverId) {
      console.log('6️⃣  Criando trips ativas...');
      
      for (const vehicle of vehiclesToCreate) {
        const tripId = `trip-${vehicle.id.substring(0, 8)}`;
        
        await client.query(`
          INSERT INTO trips (id, vehicle_id, driver_id, route_id, status, start_time, created_at)
          VALUES ($1, $2, $3, $4, 'inProgress', NOW() - INTERVAL '30 minutes', NOW())
          ON CONFLICT (id) DO UPDATE SET
            status = 'inProgress',
            start_time = NOW() - INTERVAL '30 minutes'
        `, [tripId, vehicle.id, driverId, routeId]);
        
        console.log(`   ✓ Trip para ${vehicle.plate}`);
      }
      console.log('');

      // 7. Criar posições GPS simuladas
      console.log('7️⃣  Criando posições GPS simuladas...');
      
      for (let i = 0; i < vehiclesToCreate.length; i++) {
        const vehicle = vehiclesToCreate[i];
        const tripId = `trip-${vehicle.id.substring(0, 8)}`;
        
        // Posição baseada nas paradas da rota
        const stopIndex = i % stops.length;
        const stop = stops[stopIndex];
        
        // Pequena variação na posição
        const lat = stop.lat + (Math.random() - 0.5) * 0.001;
        const lng = stop.lng + (Math.random() - 0.5) * 0.001;
        const speed = Math.random() * 50; // 0-50 km/h
        
        await client.query(`
          INSERT INTO driver_positions (trip_id, lat, lng, speed, heading, timestamp, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '5 minutes', NOW())
        `, [tripId, lat, lng, speed, Math.random() * 360]);
        
        console.log(`   ✓ Posição GPS para ${vehicle.plate} (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
      }
      console.log('');
    }

    // 8. Verificação final
    console.log('8️⃣  Verificação final...');
    const finalCheck = await client.query(`
      SELECT 
        v.plate,
        v.model,
        c.name as company_name,
        t.id as trip_id,
        t.status as trip_status,
        dp.lat,
        dp.lng,
        dp.timestamp as last_position
      FROM vehicles v
      LEFT JOIN companies c ON c.id = v.company_id
      LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status = 'inProgress'
      LEFT JOIN LATERAL (
        SELECT lat, lng, timestamp
        FROM driver_positions
        WHERE trip_id = t.id
        ORDER BY timestamp DESC
        LIMIT 1
      ) dp ON true
      WHERE v.is_active = true
      ORDER BY v.plate
    `);

    console.log(`\n   Total de veículos ativos: ${finalCheck.rows.length}`);
    console.log('\n   Detalhes dos veículos:\n');
    
    finalCheck.rows.forEach(v => {
      const hasTrip = v.trip_id ? '✓' : '✗';
      const hasGPS = v.lat ? '✓' : '✗';
      const status = v.lat ? `GPS: ${v.lat.toFixed(4)}, ${v.lng.toFixed(4)}` : 'Sem GPS';
      
      console.log(`   ${hasTrip} ${hasGPS} ${v.plate} - ${v.company_name || 'Sem empresa'}`);
      console.log(`      Status: ${v.trip_status || 'Sem trip'} | ${status}`);
    });
    console.log('');

    // RESUMO FINAL
    console.log('\n═══════════════════════════════════════');
    console.log('📊 DADOS DE TESTE CRIADOS COM SUCESSO!\n');
    
    const withTrips = finalCheck.rows.filter(v => v.trip_id).length;
    const withGPS = finalCheck.rows.filter(v => v.lat).length;
    
    console.log(`✅ ${finalCheck.rows.length} veículos ativos`);
    console.log(`✅ ${withTrips} veículos com trips ativas`);
    console.log(`✅ ${withGPS} veículos com posição GPS`);
    console.log('');

    console.log('🎉 TUDO PRONTO PARA TESTE!\n');
    console.log('PRÓXIMOS PASSOS:');
    console.log('1. No Supabase: Settings → API → "Reload schema cache"');
    console.log('2. Aguarde 30 segundos');
    console.log('3. Limpe cache do navegador (Ctrl + Shift + Delete)');
    console.log('4. Acesse: https://golffox.vercel.app/admin/mapa');
    console.log('');
    console.log(`Os veículos devem aparecer no mapa próximo a: Brasília, DF`);
    console.log('Coordenadas aproximadas: -15.7942, -47.8822');
    console.log('');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

createTestData();

