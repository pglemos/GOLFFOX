/**
 * Setup final usando motorista existente ou criando trips sem motorista
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function finalMapSetup() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  console.log('🚀 SETUP FINAL DO MAPA (Usando dados existentes)\n');
  console.log('═══════════════════════════════════════\n');

  try {
    await client.connect();

    // 1. Obter empresa
    const companies = await client.query(`SELECT id FROM companies LIMIT 1`);
    const companyId = companies.rows[0].id;

    // 2. Obter ou criar motorista
    console.log('1️⃣  Verificando motoristas...');
    const drivers = await client.query(`SELECT id, email FROM users WHERE role = 'driver' LIMIT 1`);
    
    let driverId;
    if (drivers.rows.length > 0) {
      driverId = drivers.rows[0].id;
      console.log(`   ✓ Usando motorista: ${drivers.rows[0].email}\n`);
    } else {
      // Usar qualquer usuário como motorista temporário
      const anyUser = await client.query(`SELECT id, email FROM users LIMIT 1`);
      if (anyUser.rows.length > 0) {
        driverId = anyUser.rows[0].id;
        console.log(`   ⚠️  Usando usuário existente como motorista: ${anyUser.rows[0].email}\n`);
      } else {
        console.log('   ❌ Nenhum usuário encontrado - criando trips sem motorista\n');
        driverId = null;
      }
    }

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

    // 6. Criar trips e GPS para veículos (APENAS SE houver motorista)
    if (driverId) {
      const vehicles = await client.query(`
        SELECT id, plate FROM vehicles 
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
          VALUES ($1, $2, $3, $4, 'inProgress', NOW() - INTERVAL '30 minutes', NOW())
          ON CONFLICT (id) DO UPDATE SET status = 'inProgress'
        `, [tripId, vehicle.id, driverId, routeId]);

        // Deletar posições antigas e criar novas
        await client.query(`DELETE FROM driver_positions WHERE trip_id = $1`, [tripId]);

        // Criar 3 posições GPS
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

        console.log(`   ✓ ${vehicle.plate} - Trip e GPS criadas`);
      }
    } else {
      console.log('4️⃣  ⚠️  Pulando criação de trips (sem motorista)\n');
    }

    // 7. Verificação final
    console.log('\n5️⃣  Verificação final...\n');
    
    const finalCheck = await client.query(`
      SELECT 
        v.plate,
        v.model,
        c.name as company_name,
        t.status as trip_status,
        COUNT(dp.id) as gps_count,
        MAX(dp.lat) as lat,
        MAX(dp.lng) as lng
      FROM vehicles v
      LEFT JOIN companies c ON c.id = v.company_id
      LEFT JOIN trips t ON t.vehicle_id = v.id AND t.status = 'inProgress'
      LEFT JOIN driver_positions dp ON dp.trip_id = t.id
      WHERE v.is_active = true
      GROUP BY v.plate, v.model, c.name, t.status
      ORDER BY v.plate
    `);

    console.log(`   Total: ${finalCheck.rows.length} veículos ativos\n`);
    
    const withTrips = finalCheck.rows.filter(v => v.trip_status).length;
    const withGPS = finalCheck.rows.filter(v => v.lat).length;
    
    finalCheck.rows.forEach(v => {
      const tripStatus = v.trip_status || 'Sem trip';
      const gpsInfo = v.lat ? `GPS: ${v.lat.toFixed(6)}, ${v.lng.toFixed(6)} (${v.gps_count})` : 'Sem GPS';
      console.log(`   ${v.trip_status ? '✓' : '○'} ${v.plate} - ${v.company_name || 'Sem empresa'}`);
      console.log(`      ${tripStatus} | ${gpsInfo}`);
    });

    // RESUMO FINAL
    console.log('\n═══════════════════════════════════════');
    console.log('📊 RESUMO COMPLETO\n');
    
    console.log(`✅ Veículos ativos: ${finalCheck.rows.length}`);
    console.log(`${withTrips > 0 ? '✅' : '⚠️ '} Veículos com trips: ${withTrips}`);
    console.log(`${withGPS > 0 ? '✅' : '⚠️ '} Veículos com GPS: ${withGPS}`);
    console.log(`✅ Rota: Rota Teste Centro-Bairro (${stops.length} paradas)`);
    console.log('');

    if (withGPS > 0) {
      console.log('🎉 BANCO ESTÁ PRONTO PARA TESTE!\n');
    } else {
      console.log('⚠️  BANCO PARCIALMENTE PRONTO\n');
      console.log('Veículos aparecerão como "na garagem" (sem GPS)\n');
    }

    console.log('═══════════════════════════════════════\n');
    console.log('PRÓXIMOS PASSOS:\n');
    console.log('1. No Supabase: Settings → API → "Reload schema cache"');
    console.log('2. Limpe cache do navegador: Ctrl + Shift + Delete');
    console.log('3. Acesse: https://golffox.vercel.app/admin/mapa');
    console.log('');
    console.log('TESTE NO CONSOLE DO NAVEGADOR (F12):\n');
    console.log('const { data, error } = await supabase');
    console.log('  .from("vehicles")');
    console.log('  .select("*")');
    console.log('  .eq("is_active", true);');
    console.log('console.log("Veículos:", data?.length, data);');
    console.log('console.log("Erro:", error);');
    console.log('');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

finalMapSetup();

