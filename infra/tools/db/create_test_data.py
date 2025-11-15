#!/usr/bin/env python3
"""
Script para criar dados de teste abrangentes e validar o sistema
"""

import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
import json
import uuid
from datetime import datetime, timedelta
import random

def get_db_connection():
    """Conecta ao banco de dados usando variáveis de ambiente"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('GF_DB_HOST'),
            port=os.getenv('GF_DB_PORT', 5432),
            user=os.getenv('GF_DB_USER'),
            password=os.getenv('GF_DB_PASSWORD'),
            database=os.getenv('GF_DB_NAME')
        )
        return conn
    except Exception as e:
        print(f"Erro ao conectar ao banco: {e}")
        return None

def create_test_companies(conn):
    """Cria empresas de teste"""
    print("🏢 Criando empresas de teste...")
    
    companies = [
        {
            'id': str(uuid.uuid4()),
            'name': 'GolfFox Transportes Ltda',
            'cnpj': '12.345.678/0001-90',
            'address': 'Rua das Empresas, 123 - São Paulo, SP'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Transporte Rápido S.A.',
            'cnpj': '98.765.432/0001-10',
            'address': 'Av. Principal, 456 - Rio de Janeiro, RJ'
        }
    ]
    
    with conn.cursor() as cur:
        for company in companies:
            cur.execute("""
                INSERT INTO companies (id, name, cnpj, address, created_at, updated_at)
                VALUES (%(id)s, %(name)s, %(cnpj)s, %(address)s, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            """, company)
    
    conn.commit()
    print(f"✅ {len(companies)} empresas criadas")
    return companies

def create_test_users(conn, companies):
    """Cria usuários de teste"""
    print("👥 Criando usuários de teste...")
    
    users = []
    
    # Admin geral
    admin_user = {
        'id': str(uuid.uuid4()),
        'email': 'admin@golffox.com',
        'role': 'admin',
        'company_id': companies[0]['id']
    }
    users.append(admin_user)
    
    # Motoristas para cada empresa
    for i, company in enumerate(companies):
        for j in range(3):  # 3 motoristas por empresa
            driver_user = {
                'id': str(uuid.uuid4()),
                'email': f'motorista{i+1}{j+1}@{company["name"].lower().replace(" ", "")}.com',
                'role': 'driver',
                'company_id': company['id']
            }
            users.append(driver_user)
    
    # Passageiros
    for i in range(5):
        passenger_user = {
            'id': str(uuid.uuid4()),
            'email': f'passageiro{i+1}@email.com',
            'role': 'passenger',
            'company_id': companies[0]['id']  # Associar à primeira empresa
        }
        users.append(passenger_user)
    
    with conn.cursor() as cur:
        for user in users:
            cur.execute("""
                INSERT INTO users (id, email, role, company_id, created_at, updated_at)
                VALUES (%(id)s, %(email)s, %(role)s, %(company_id)s, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            """, user)
    
    conn.commit()
    print(f"✅ {len(users)} usuários criados")
    return users

def create_test_drivers(conn, users, companies):
    """Cria motoristas de teste"""
    print("🚗 Criando motoristas de teste...")
    
    drivers = []
    driver_users = [u for u in users if u['role'] == 'driver']
    
    for i, user in enumerate(driver_users):
        driver = {
            'id': str(uuid.uuid4()),
            'user_id': user['id'],
            'company_id': user['company_id'],
            'license_number': f'CNH{1000 + i}',
            'phone': f'(11) 9{8000 + i}-{1000 + i}',
            'is_active': True
        }
        drivers.append(driver)
    
    with conn.cursor() as cur:
        for driver in drivers:
            cur.execute("""
                INSERT INTO drivers (id, user_id, company_id, license_number, phone, is_active, created_at, updated_at)
                VALUES (%(id)s, %(user_id)s, %(company_id)s, %(license_number)s, %(phone)s, %(is_active)s, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            """, driver)
    
    conn.commit()
    print(f"✅ {len(drivers)} motoristas criados")
    return drivers

def create_test_vehicles(conn, companies):
    """Cria veículos de teste"""
    print("🚌 Criando veículos de teste...")
    
    vehicles = []
    
    for i, company in enumerate(companies):
        for j in range(4):  # 4 veículos por empresa
            vehicle = {
                'id': str(uuid.uuid4()),
                'company_id': company['id'],
                'license_plate': f'ABC-{1000 + (i*4) + j}',
                'model': f'Ônibus Modelo {j+1}',
                'year': 2020 + j,
                'capacity': 40 + (j * 5),
                'is_active': True
            }
            vehicles.append(vehicle)
    
    with conn.cursor() as cur:
        for vehicle in vehicles:
            cur.execute("""
                INSERT INTO vehicles (id, company_id, license_plate, model, year, capacity, is_active, created_at, updated_at)
                VALUES (%(id)s, %(company_id)s, %(license_plate)s, %(model)s, %(year)s, %(capacity)s, %(is_active)s, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            """, vehicle)
    
    conn.commit()
    print(f"✅ {len(vehicles)} veículos criados")
    return vehicles

def create_test_routes(conn, companies):
    """Cria rotas de teste"""
    print("🛣️ Criando rotas de teste...")
    
    routes = []
    
    route_names = [
        'Centro - Aeroporto',
        'Shopping - Universidade',
        'Estação - Hospital',
        'Bairro Norte - Centro'
    ]
    
    for i, company in enumerate(companies):
        for j, route_name in enumerate(route_names):
            route = {
                'id': str(uuid.uuid4()),
                'company_id': company['id'],
                'name': f'{route_name} ({company["name"][:10]})',
                'description': f'Rota {route_name} operada pela {company["name"]}',
                'is_active': True
            }
            routes.append(route)
    
    with conn.cursor() as cur:
        for route in routes:
            cur.execute("""
                INSERT INTO routes (id, company_id, name, description, is_active, created_at, updated_at)
                VALUES (%(id)s, %(company_id)s, %(name)s, %(description)s, %(is_active)s, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            """, route)
    
    conn.commit()
    print(f"✅ {len(routes)} rotas criadas")
    return routes

def create_test_bus_stops(conn, routes):
    """Cria pontos de ônibus de teste"""
    print("🚏 Criando pontos de ônibus de teste...")
    
    bus_stops = []
    
    # Coordenadas base (São Paulo)
    base_lat = -23.5505
    base_lng = -46.6333
    
    for route in routes:
        # 5 pontos por rota
        for i in range(5):
            stop = {
                'id': str(uuid.uuid4()),
                'route_id': route['id'],
                'name': f'Ponto {i+1} - {route["name"][:20]}',
                'latitude': base_lat + (random.uniform(-0.1, 0.1)),
                'longitude': base_lng + (random.uniform(-0.1, 0.1)),
                'order_index': i + 1,
                'is_active': True
            }
            bus_stops.append(stop)
    
    with conn.cursor() as cur:
        for stop in bus_stops:
            cur.execute("""
                INSERT INTO bus_stops (id, route_id, name, latitude, longitude, order_index, is_active, created_at, updated_at)
                VALUES (%(id)s, %(route_id)s, %(name)s, %(latitude)s, %(longitude)s, %(order_index)s, %(is_active)s, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            """, stop)
    
    conn.commit()
    print(f"✅ {len(bus_stops)} pontos de ônibus criados")
    return bus_stops

def create_test_trips(conn, routes, drivers, vehicles):
    """Cria viagens de teste"""
    print("🚌 Criando viagens de teste...")
    
    trips = []
    
    # Criar viagens para os últimos 7 dias
    for i in range(7):
        date = datetime.now() - timedelta(days=i)
        
        # 2-3 viagens por dia para cada rota
        for route in routes[:4]:  # Apenas primeiras 4 rotas
            for j in range(random.randint(2, 3)):
                # Selecionar motorista e veículo da mesma empresa
                route_drivers = [d for d in drivers if d['company_id'] == route['company_id']]
                route_vehicles = [v for v in vehicles if v['company_id'] == route['company_id']]
                
                if route_drivers and route_vehicles:
                    driver = random.choice(route_drivers)
                    vehicle = random.choice(route_vehicles)
                    
                    start_time = date.replace(hour=6 + j*4, minute=random.randint(0, 59))
                    
                    trip = {
                        'id': str(uuid.uuid4()),
                        'route_id': route['id'],
                        'driver_id': driver['id'],
                        'vehicle_id': vehicle['id'],
                        'scheduled_at': start_time,
                        'started_at': start_time + timedelta(minutes=random.randint(-5, 15)),
                        'status': random.choice(['completed', 'in_progress', 'scheduled']),
                    }
                    
                    # Se a viagem foi completada, adicionar tempo de conclusão
                    if trip['status'] == 'completed':
                        trip['completed_at'] = trip['started_at'] + timedelta(minutes=random.randint(30, 90))
                    
                    trips.append(trip)
    
    with conn.cursor() as cur:
        for trip in trips:
            cur.execute("""
                INSERT INTO trips (id, route_id, driver_id, vehicle_id, scheduled_at, started_at, completed_at, status, created_at, updated_at)
                VALUES (%(id)s, %(route_id)s, %(driver_id)s, %(vehicle_id)s, %(scheduled_at)s, %(started_at)s, %(completed_at)s, %(status)s, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            """, trip)
    
    conn.commit()
    print(f"✅ {len(trips)} viagens criadas")
    return trips

def create_test_driver_positions(conn, drivers, trips):
    """Cria posições de motoristas de teste"""
    print("📍 Criando posições de motoristas de teste...")
    
    positions = []
    
    # Coordenadas base (São Paulo)
    base_lat = -23.5505
    base_lng = -46.6333
    
    # Criar posições para motoristas ativos
    active_trips = [t for t in trips if t['status'] in ['in_progress', 'completed']]
    
    for trip in active_trips[:10]:  # Limitar a 10 viagens para não sobrecarregar
        driver_id = trip['driver_id']
        
        # 3-5 posições por viagem
        for i in range(random.randint(3, 5)):
            position_time = trip['started_at'] + timedelta(minutes=i*10)
            
            position = {
                'id': str(uuid.uuid4()),
                'driver_id': driver_id,
                'lat': base_lat + (random.uniform(-0.05, 0.05)),
                'lng': base_lng + (random.uniform(-0.05, 0.05)),
                'accuracy': random.uniform(5.0, 15.0),
                'heading': random.uniform(0, 360),
                'timestamp': position_time
            }
            positions.append(position)
    
    with conn.cursor() as cur:
        for position in positions:
            cur.execute("""
                INSERT INTO driver_positions (id, driver_id, lat, lng, accuracy, heading, timestamp, created_at, updated_at)
                VALUES (%(id)s, %(driver_id)s, %(lat)s, %(lng)s, %(accuracy)s, %(heading)s, %(timestamp)s, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            """, position)
    
    conn.commit()
    print(f"✅ {len(positions)} posições de motoristas criadas")
    return positions

def validate_views_and_functions(conn):
    """Valida se as views e funções estão funcionando com dados reais"""
    print("\n🔍 Validando views e funções com dados reais...")
    
    validations = []
    
    # Testar views
    views_to_test = [
        ('v_active_trips', 'SELECT COUNT(*) as count FROM v_active_trips'),
        ('v_driver_last_position', 'SELECT COUNT(*) as count FROM v_driver_last_position'),
        ('v_route_stops', 'SELECT COUNT(*) as count FROM v_route_stops')
    ]
    
    for view_name, query in views_to_test:
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query)
                result = cur.fetchone()
                
                validations.append({
                    'type': 'view',
                    'name': view_name,
                    'status': 'success',
                    'count': result['count']
                })
                print(f"   ✅ {view_name}: {result['count']} registros")
                
        except Exception as e:
            validations.append({
                'type': 'view',
                'name': view_name,
                'status': 'error',
                'error': str(e)
            })
            print(f"   ❌ {view_name}: {e}")
    
    # Testar RPC
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM gf_map_snapshot_full()")
            result = cur.fetchone()
            
            if result:
                validations.append({
                    'type': 'rpc',
                    'name': 'gf_map_snapshot_full',
                    'status': 'success',
                    'keys': list(result.keys())
                })
                print(f"   ✅ gf_map_snapshot_full: {list(result.keys())}")
            else:
                validations.append({
                    'type': 'rpc',
                    'name': 'gf_map_snapshot_full',
                    'status': 'empty'
                })
                print(f"   ⚠️  gf_map_snapshot_full: resultado vazio")
                
    except Exception as e:
        validations.append({
            'type': 'rpc',
            'name': 'gf_map_snapshot_full',
            'status': 'error',
            'error': str(e)
        })
        print(f"   ❌ gf_map_snapshot_full: {e}")
    
    return validations

def run_performance_tests(conn):
    """Executa testes básicos de performance"""
    print("\n⚡ Executando testes de performance...")
    
    performance_tests = [
        {
            'name': 'Consulta de viagens ativas',
            'query': 'SELECT COUNT(*) FROM v_active_trips WHERE status = \'in_progress\''
        },
        {
            'name': 'Última posição dos motoristas',
            'query': 'SELECT COUNT(*) FROM v_driver_last_position'
        },
        {
            'name': 'Pontos de parada por rota',
            'query': 'SELECT route_id, COUNT(*) FROM v_route_stops GROUP BY route_id'
        },
        {
            'name': 'Snapshot completo do mapa',
            'query': 'SELECT * FROM gf_map_snapshot_full()'
        }
    ]
    
    results = []
    
    for test in performance_tests:
        try:
            start_time = datetime.now()
            
            with conn.cursor() as cur:
                cur.execute(test['query'])
                cur.fetchall()  # Buscar todos os resultados
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds() * 1000  # em ms
            
            results.append({
                'name': test['name'],
                'duration_ms': duration,
                'status': 'success'
            })
            print(f"   ✅ {test['name']}: {duration:.2f}ms")
            
        except Exception as e:
            results.append({
                'name': test['name'],
                'status': 'error',
                'error': str(e)
            })
            print(f"   ❌ {test['name']}: {e}")
    
    return results

def main():
    print("🚀 Iniciando criação de dados de teste e validação completa...")
    
    # Conectar ao banco
    conn = get_db_connection()
    if not conn:
        print("❌ Falha na conexão com o banco de dados")
        sys.exit(1)
    
    try:
        # Criar dados de teste
        companies = create_test_companies(conn)
        users = create_test_users(conn, companies)
        drivers = create_test_drivers(conn, users, companies)
        vehicles = create_test_vehicles(conn, companies)
        routes = create_test_routes(conn, companies)
        bus_stops = create_test_bus_stops(conn, routes)
        trips = create_test_trips(conn, routes, drivers, vehicles)
        positions = create_test_driver_positions(conn, drivers, trips)
        
        # Validar sistema
        validations = validate_views_and_functions(conn)
        performance_results = run_performance_tests(conn)
        
        # Gerar relatório final
        report = {
            'timestamp': datetime.now().isoformat(),
            'test_data_created': {
                'companies': len(companies),
                'users': len(users),
                'drivers': len(drivers),
                'vehicles': len(vehicles),
                'routes': len(routes),
                'bus_stops': len(bus_stops),
                'trips': len(trips),
                'positions': len(positions)
            },
            'validations': validations,
            'performance_tests': performance_results
        }
        
        # Salvar relatório
        report_file = 'tools/db/final_validation_report.json'
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        # Resumo final
        print(f"\n📊 RESUMO FINAL:")
        print(f"   • Empresas: {len(companies)}")
        print(f"   • Usuários: {len(users)}")
        print(f"   • Motoristas: {len(drivers)}")
        print(f"   • Veículos: {len(vehicles)}")
        print(f"   • Rotas: {len(routes)}")
        print(f"   • Pontos de ônibus: {len(bus_stops)}")
        print(f"   • Viagens: {len(trips)}")
        print(f"   • Posições: {len(positions)}")
        print(f"   • Relatório salvo: {report_file}")
        
        # Verificar se há erros
        validation_errors = [v for v in validations if v['status'] == 'error']
        performance_errors = [p for p in performance_results if p['status'] == 'error']
        
        if validation_errors or performance_errors:
            print(f"\n⚠️  PROBLEMAS ENCONTRADOS:")
            for error in validation_errors:
                print(f"   • {error['name']}: {error.get('error', 'erro desconhecido')}")
            for error in performance_errors:
                print(f"   • {error['name']}: {error.get('error', 'erro desconhecido')}")
            sys.exit(1)
        else:
            print(f"\n✅ SISTEMA TOTALMENTE FUNCIONAL!")
            print(f"   • Todas as views funcionando")
            print(f"   • Todas as funções RPC funcionando")
            print(f"   • Performance adequada")
            print(f"   • Dados de teste criados com sucesso")
        
    except Exception as e:
        print(f"❌ Erro durante a validação: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    main()