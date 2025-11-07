/**
 * Setup final de dados para o mapa
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function setupMapData() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  console.log('🚀 SETUP FINAL DE DADOS PARA O MAPA\n');
  console.log('═══════════════════════════════════════\n');

  try {
    await client.connect();

    // 1. Obter empresa e carrier
    const companies = await client.query(`SELECT id, name FROM companies LIMIT 1`);
    const companyId = companies.rows[0].id;
    
    const carriers = await client.query(`SELECT id FROM carriers LIMIT 1`);
    const carrierId = carriers.rows[0]?.id || companyId;

    // 2. Criar rota
    const routeId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    await client.query(`
      INSERT INTO routes (id, name, company_id, carrier_id)
      VALUES ($1, 'Rota Teste Centro', $2, $3)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `, [routeId, companyId, carrierId]);
    console.log('✅ Rota criada\n');

    // 3. Deletar paradas antigas e criar novas
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
    console.log('✅ Paradas criadas\n');

    // 4. Obter motorista
    const drivers = await client.query(`SELECT id FROM users WHERE role = 'driver' LIMIT 1`);
    const driverId = drivers.rows[0]?.id;

    if (!driverId) {
      console.log('⚠️  Sem motorista - pulando trips e GPS\n');
    } else {
      // 5. Criar trips e GPS para veículos existentes
      const vehicles = await client.query(`
        SELECT id, plate FROM vehicles WHERE is_active = true ORDER BY plate LIMIT 5
      `);

      console.log(`✅ Criando trips e GPS para ${vehicles.rows.length} veículos...\n`);

      for (let i = 0; i < vehicles.rows.length; i++) {
        const vehicle = vehicles.rows[i];
        const tripId = `trip-${vehicle.id.substring(0, 13)}`;

        // Criar trip
        await client.query(`
          INSERT INTO trips (id, vehicle_id, driver_id, route_id, status, start_time)
          VALUES ($1, $2, $3, $4, 'inProgress', NOW() - INTERVAL '1 hour')
          ON CONFLICT (id) DO UPDATE SET status = 'inProgress'
        `, [tripId, vehicle.id, driverId, routeId]);

        // Criar posição GPS
        const stop = stops[i % stops.length];
        const lat = stop.lat + (Math.random() - 0.5) * 0.002;
        const lng = stop.lng + (Math.random() - 0.5) * 0.002;

        await client.query(`
          INSERT INTO driver_positions (trip_id, lat, lng, speed, heading, timestamp)
          VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '1 minute')
        `, [tripId, lat, lng, 20 + Math.random() * 30, Math.random() * 360]);

        console.log(`   ✓ ${vehicle.plate}: GPS (${lat.toFixed(6)}, ${lng.toFixed(6)})`);
      }
    }

    console.log('\n🎉 SETUP COMPLETO!\n');
    console.log('TESTE AGORA:');
    console.log('https://golffox.vercel.app/admin/mapa');
    console.log('\n═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

setupMapData();

