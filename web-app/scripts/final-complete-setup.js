/**
 * Setup final completo para o mapa funcionar
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function finalSetup() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  console.log('🚀 SETUP FINAL COMPLETO DO MAPA\n');
  console.log('═══════════════════════════════════════\n');

  try {
    await client.connect();

    // 1. Obter empresa
    const companies = await client.query(`SELECT id FROM companies LIMIT 1`);
    const companyId = companies.rows[0].id;

    // 2. Criar motorista de teste (sem coluna name)
    console.log('1️⃣  Criando motorista de teste...');
    const driverId = '99999999-9999-9999-9999-999999999999';
    await client.query(`
      INSERT INTO users (id, email, role, company_id, created_at)
      VALUES ($1, 'motorista.teste@golffox.com', 'driver', $2, NOW())
      ON CONFLICT (id) DO UPDATE SET role = 'driver'
    `, [driverId, companyId]);
    console.log(`   ✓ Motorista criado\n`);

    // 3. Obter carrier
    const carriers = await client.query(`SELECT id FROM carriers LIMIT 1`);
    const carrierId = carriers.rows[0]?.id || companyId;

    // 4. Criar rota
    const routeId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    console.log('2️⃣  Criando rota...');
    await client.query(`
      INSERT INTO routes (id, name, company_id, carrier_id, created_at)
      VALUES ($1, 'Rota Teste Centro-Bairro', $2, $3, NOW())
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `, [routeId, companyId, carrierId]);
    console.log(`   ✓ Rota criada\n`);

    // 5. Criar paradas
    console.log('3️⃣  Criando paradas...');
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
    console.log(`   ✓ ${stops.length} paradas criadas\n`);

    // 6. Criar trips e GPS para veículos
    const vehicles = await client.query(`
      SELECT id, plate, model FROM vehicles 
      WHERE is_active = true 
      ORDER BY plate 
      LIMIT 10
    `);

    console.log(`4️⃣  Criando trips e GPS para ${vehicles.rows.length} veículos...\n`);

    for (let i = 0; i < vehicles.rows.length; i++) {
      const vehicle = vehicles.rows[i];
      const tripId = `trip-${vehicle.id.substring(0, 13)}`;

      // Criar trip
      await client.query(`
        INSERT INTO trips (id, vehicle_id, driver_id, route_id, status, start_time, created_at)
        VALUES ($1, $2, $3, $4, 'inProgress', NOW() - INTERVAL '1 hour', NOW())
        ON CONFLICT (id) DO UPDATE SET status = 'inProgress'
      `, [tripId, vehicle.id, driverId, routeId]);

      // Deletar posições antigas
      await client.query(`DELETE FROM driver_positions WHERE trip_id = $1`, [tripId]);

      // Criar 3 posições GPS ao longo da rota
      for (let j = 0; j < 3; j++) {
        const stop = stops[j % stops.length];
        const lat = stop.lat + (Math.random() - 0.5) * 0.001;
        const lng = stop.lng + (Math.random() - 0.5) * 0.001;
        const minutesAgo = (3 - j) * 2; // Última posição 2 min atrás

        await client.query(`
          INSERT INTO driver_positions (trip_id, lat, lng, speed, heading, timestamp, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${minutesAgo} minutes', NOW())
        `, [tripId, lat, lng, 20 + Math.random() * 40, Math.random() * 360]);
      }

      console.log(`   ✓ ${vehicle.plate} - Trip e 3 posições GPS criadas`);
    }

    // 7. Verificação final
    console.log('\n5️⃣  Verificação final...\n');
    
    const finalCheck = await client.query(`
      SELECT 
        v.plate,
        t.status as trip_status,
        COUNT(dp.id) as gps_count,
        MAX(dp.timestamp) as last_gps,
        MAX(dp.lat) as lat,
        MAX(dp.lng) as lng
      FROM vehicles v
      INNER JOIN trips t ON t.vehicle_id = v.id
      LEFT JOIN driver_positions dp ON dp.trip_id = t.id
      WHERE v.is_active = true AND t.status = 'inProgress'
      GROUP BY v.plate, t.status
      ORDER BY v.plate
    `);

    console.log(`   Total: ${finalCheck.rows.length} veículos com trips e GPS\n`);
    
    finalCheck.rows.forEach(v => {
      const lastGPS = v.last_gps ? new Date(v.last_gps).toLocaleTimeString('pt-BR') : 'N/A';
      console.log(`   ✓ ${v.plate}: ${v.gps_count} GPS (última: ${lastGPS})`);
      console.log(`      Posição: ${v.lat?.toFixed(6)}, ${v.lng?.toFixed(6)}`);
    });

    // RESUMO FINAL
    console.log('\n═══════════════════════════════════════');
    console.log('📊 RESUMO COMPLETO\n');
    
    console.log(`✅ Motorista: motorista.teste@golffox.com`);
    console.log(`✅ Rota: Rota Teste Centro-Bairro (${stops.length} paradas)`);
    console.log(`✅ Veículos com trips: ${finalCheck.rows.length}`);
    console.log(`✅ Posições GPS: ${finalCheck.rows.reduce((sum, v) => sum + parseInt(v.gps_count), 0)}`);
    console.log('');

    console.log('🎉 BANCO DE DADOS 100% PRONTO!\n');
    console.log('═══════════════════════════════════════\n');
    console.log('TESTE O MAPA AGORA:\n');
    console.log('1. No Supabase Dashboard:');
    console.log('   Settings → API → "Reload schema cache"');
    console.log('');
    console.log('2. Limpe o cache do navegador:');
    console.log('   Ctrl + Shift + Delete');
    console.log('');
    console.log('3. Acesse o mapa:');
    console.log('   https://golffox.vercel.app/admin/mapa');
    console.log('');
    console.log('4. No console do navegador (F12), teste:');
    console.log('');
    console.log('   const { data, error } = await supabase');
    console.log('     .from("vehicles")');
    console.log('     .select("*")');
    console.log('     .eq("is_active", true);');
    console.log('   console.log("Veículos:", data?.length, data);');
    console.log('');
    console.log('Os veículos devem aparecer próximo a Brasília, DF');
    console.log('Coordenadas: -15.7942, -47.8822');
    console.log('');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

finalSetup();

