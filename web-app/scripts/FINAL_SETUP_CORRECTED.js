/**
 * SETUP FINAL CORRETO DO MAPA
 * Versão corrigida com estrutura real das tabelas
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function FINAL_SETUP() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  console.log('🚀 SETUP FINAL CORRETO DO MAPA\n');
  console.log('═══════════════════════════════════════\n');

  try {
    await client.connect();

    // 1. Obter empresa e usuário
    const companies = await client.query(`SELECT id FROM companies LIMIT 1`);
    const companyId = companies.rows[0].id;
    
    const users = await client.query(`SELECT id, email FROM users LIMIT 1`);
    const userId = users.rows[0].id;
    console.log(`✅ Usando usuário: ${users.rows[0].email}\n`);

    // 2. Obter carrier
    const carriers = await client.query(`SELECT id FROM carriers LIMIT 1`);
    const carrierId = carriers.rows[0]?.id || companyId;

    // 3. Criar rota
    const routeId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    await client.query(`
      INSERT INTO routes (id, name, company_id, carrier_id, created_at)
      VALUES ($1, 'Rota Teste Centro-Bairro', $2, $3, NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `, [routeId, companyId, carrierId]);

    // 4. Criar paradas
    await client.query(`DELETE FROM route_stops WHERE route_id = $1`, [routeId]);
    
    const stops = [
      { seq: 1, lat: -15.7942, lng: -47.8822, name: 'Terminal Central' },
      { seq: 2, lat: -15.8000, lng: -47.8900, name: 'Av. Principal' },
      { seq: 3, lat: -15.8100, lng: -47.9000, name: 'Bairro Norte' }
    ];

    for (const stop of stops) {
      await client.query(`
        INSERT INTO route_stops (route_id, seq, lat, lng, name)
        VALUES ($1, $2, $3, $4, $5)
      `, [routeId, stop.seq, stop.lat, stop.lng, stop.name]);
    }
    console.log(`✅ Rota e ${stops.length} paradas criadas\n`);

    // 5. Criar trips e GPS
    const vehicles = await client.query(`
      SELECT id, plate FROM vehicles WHERE is_active = true ORDER BY plate LIMIT 10
    `);

    console.log(`✅ Criando trips e GPS para ${vehicles.rows.length} veículos...\n`);

    for (let i = 0; i < vehicles.rows.length; i++) {
      const vehicle = vehicles.rows[i];
      const tripId = `trip-${vehicle.id.substring(0, 13)}`;

      // Criar trip (com colunas corretas)
      await client.query(`
        INSERT INTO trips (id, vehicle_id, driver_id, route_id, status, scheduled_at, started_at, created_at)
        VALUES ($1, $2, $3, $4, 'inProgress', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', NOW())
        ON CONFLICT (id) DO UPDATE SET status = 'inProgress', started_at = NOW() - INTERVAL '1 hour'
      `, [tripId, vehicle.id, userId, routeId]);

      // Deletar posições antigas e criar novas
      await client.query(`DELETE FROM driver_positions WHERE trip_id = $1`, [tripId]);

      for (let j = 0; j < 3; j++) {
        const stop = stops[j % stops.length];
        const lat = stop.lat + (Math.random() - 0.5) * 0.001;
        const lng = stop.lng + (Math.random() - 0.5) * 0.001;
        const minutesAgo = (3 - j) * 2;

        await client.query(`
          INSERT INTO driver_positions (trip_id, lat, lng, speed, heading, timestamp, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${minutesAgo} minutes', NOW())
        `, [tripId, lat, lng, 20 + Math.random() * 40, Math.random() * 360]);
      }

      console.log(`   ✓ ${vehicle.plate}`);
    }

    // 6. Verificação final
    console.log('\n✅ VERIFICAÇÃO FINAL...\n');
    
    const finalCheck = await client.query(`
      SELECT 
        v.plate,
        c.name as company,
        t.status,
        COUNT(dp.id) as gps_count,
        MAX(dp.lat) as lat,
        MAX(dp.lng) as lng,
        MAX(dp.timestamp) as last_gps
      FROM vehicles v
      LEFT JOIN companies c ON c.id = v.company_id
      LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status = 'inProgress'
      LEFT JOIN driver_positions dp ON dp.trip_id = t.id
      WHERE v.is_active = true
      GROUP BY v.plate, c.name, t.status
      ORDER BY v.plate
    `);

    finalCheck.rows.forEach(v => {
      const trip = v.status ? `Trip: ${v.status}` : 'Sem trip';
      const gps = v.lat ? `GPS: ${v.gps_count} posições (última: ${new Date(v.last_gps).toLocaleTimeString('pt-BR')})` : 'Sem GPS';
      console.log(`   ${v.status ? '✓' : '○'} ${v.plate} - ${v.company || 'Sem empresa'}`);
      console.log(`      ${trip} | ${gps}`);
    });

    const withTrips = finalCheck.rows.filter(v => v.status).length;
    const withGPS = finalCheck.rows.filter(v => v.lat).length;

    // RESUMO
    console.log('\n═══════════════════════════════════════');
    console.log('📊 RESULTADO FINAL\n');
    
    console.log(`✅ ${finalCheck.rows.length} veículos ativos`);
    console.log(`✅ ${withTrips} veículos com trips ativas`);
    console.log(`✅ ${withGPS} veículos com posição GPS`);
    console.log(`✅ Rota com ${stops.length} paradas`);
    console.log('');

    if (withGPS > 0) {
      console.log('🎉 BANCO 100% PRONTO PARA TESTE!\n');
    } else {
      console.log('⚠️  BANCO PARCIALMENTE PRONTO (sem GPS)\n');
    }

    console.log('═══════════════════════════════════════\n');
    console.log('🎯 TESTE AGORA:\n');
    console.log('1. Supabase: Settings → API → "Reload schema cache"');
    console.log('2. Navegador: Ctrl + Shift + Delete (limpar cache)');
    console.log('3. Acesse: https://golffox.vercel.app/admin/mapa');
    console.log('');
    console.log('🔍 TESTE NO CONSOLE (F12):\n');
    console.log('const { data, error } = await supabase.from("vehicles").select("*").eq("is_active", true);');
    console.log('console.log("Veículos:", data?.length, data);');
    console.log('');
    console.log('Coordenadas: -15.7942, -47.8822 (Brasília, DF)');
    console.log('');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

FINAL_SETUP();

