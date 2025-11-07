/**
 * SETUP ABSOLUTAMENTE FINAL - Versão 100% correta
 */

const { Client } = require('pg');
const DB_URL = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function setupFinal() {
  const client = new Client({ connectionString: DB_URL });
  
  console.log('🚀 SETUP FINAL\n══════════════════════════════════════\n');

  try {
    await client.connect();

    const { rows: [company] } = await client.query(`SELECT id FROM companies LIMIT 1`);
    const { rows: [user] } = await client.query(`SELECT id FROM users LIMIT 1`);
    const { rows: carriers } = await client.query(`SELECT id FROM carriers LIMIT 1`);
    const carrierId = carriers[0]?.id || company.id;

    // Rota
    const routeId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    await client.query(`
      INSERT INTO routes (id, name, company_id, carrier_id)
      VALUES ($1, 'Rota Centro', $2, $3)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `, [routeId, company.id, carrierId]);

    // Paradas
    await client.query(`DELETE FROM route_stops WHERE route_id = $1`, [routeId]);
    const stops = [
      [1, -15.7942, -47.8822, 'Terminal'],
      [2, -15.8000, -47.8900, 'Centro'],
      [3, -15.8100, -47.9000, 'Bairro']
    ];

    for (const [seq, lat, lng, name] of stops) {
      await client.query(`
        INSERT INTO route_stops (route_id, seq, lat, lng, name)
        VALUES ($1, $2, $3, $4, $5)
      `, [routeId, seq, lat, lng, name]);
    }
    console.log(`✅ Rota e ${stops.length} paradas criadas\n`);

    // Trips e GPS
    const { rows: vehicles } = await client.query(`
      SELECT id, plate FROM vehicles WHERE is_active = true ORDER BY plate LIMIT 10
    `);

    console.log(`✅ Criando trips e GPS (${vehicles.length} veículos)...\n`);

    for (const [i, vehicle] of vehicles.entries()) {
      const tripId = `trip-${vehicle.id.substring(0, 13)}`;

      // Trip
      await client.query(`
        INSERT INTO trips (id, vehicle_id, driver_id, route_id, status, scheduled_at, started_at)
        VALUES ($1, $2, $3, $4, 'inProgress', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour')
        ON CONFLICT (id) DO UPDATE SET status = 'inProgress'
      `, [tripId, vehicle.id, user.id, routeId]);

      // GPS
      await client.query(`DELETE FROM driver_positions WHERE trip_id = $1`, [tripId]);

      for (let j = 0; j < 3; j++) {
        const [_, lat, lng] = stops[j % stops.length];
        await client.query(`
          INSERT INTO driver_positions (trip_id, lat, lng, speed, heading, timestamp)
          VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${(3-j)*2} minutes')
        `, [tripId, lat + (Math.random()-0.5)*0.001, lng + (Math.random()-0.5)*0.001, 20+Math.random()*40, Math.random()*360]);
      }

      console.log(`   ✓ ${vehicle.plate}`);
    }

    // Verificação
    const { rows } = await client.query(`
      SELECT v.plate, COUNT(dp.id) as gps
      FROM vehicles v
      INNER JOIN trips t ON t.vehicle_id = v.id AND t.status = 'inProgress'
      LEFT JOIN driver_positions dp ON dp.trip_id = t.id
      WHERE v.is_active = true
      GROUP BY v.plate
      ORDER BY v.plate
    `);

    console.log('\n══════════════════════════════════════');
    console.log(`\n🎉 PRONTO! ${rows.length} veículos com trips e GPS\n`);
    rows.forEach(v => console.log(`   ✓ ${v.plate}: ${v.gps} GPS`));
    console.log('\n══════════════════════════════════════');
    console.log('\n📍 TESTE AGORA:');
    console.log('\n1. Supabase: Reload schema cache');
    console.log('2. https://golffox.vercel.app/admin/mapa');
    console.log('\n══════════════════════════════════════\n');

  } catch (e) {
    console.error('\n❌', e.message);
    throw e;
  } finally {
    await client.end();
  }
}

setupFinal();

