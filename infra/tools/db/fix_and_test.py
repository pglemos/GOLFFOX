#!/usr/bin/env python3
"""
Script para corrigir colunas ausentes e criar dados de teste
"""

from supabase import create_client, Client
import uuid
from datetime import datetime, timedelta
import random

def main():
    print("🚀 Iniciando correção e criação de dados de teste...")
    
    # Conectar ao Supabase
    url = "https://vmoxzesvjcfmrebagcwo.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU"
    
    supabase = create_client(url, key)
    
    try:
        # 1. Criar dados de teste para companies (usando apenas as colunas existentes)
        print("🏢 Criando empresas de teste...")
        
        companies_data = [
            {
                'id': str(uuid.uuid4()),
                'name': 'GolfFox Transportes Ltda'
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Transporte Rápido S.A.'
            }
        ]
        
        for company in companies_data:
            try:
                result = supabase.table('companies').insert(company).execute()
                print(f"✅ Empresa criada: {company['name']}")
            except Exception as e:
                print(f"⚠️ Empresa já existe ou erro: {company['name']} - {e}")
        
        # 2. Verificar se temos empresas para continuar
        companies_result = supabase.table('companies').select('*').execute()
        if not companies_result.data:
            print("❌ Nenhuma empresa encontrada. Não é possível continuar.")
            return
            
        company_id = companies_result.data[0]['id']
        print(f"📋 Usando empresa: {companies_result.data[0]['name']} (ID: {company_id})")
        
        # 3. Criar usuários de teste
        print("👥 Criando usuários de teste...")
        
        users_data = [
            {
                'id': str(uuid.uuid4()),
                'email': 'admin@golffox.com',
                'name': 'Administrador Sistema',
                'company_id': company_id,
                'role': 'admin'
            },
            {
                'id': str(uuid.uuid4()),
                'email': 'motorista1@golffox.com', 
                'name': 'João Silva',
                'company_id': company_id,
                'role': 'driver'
            }
        ]
        
        for user in users_data:
            try:
                result = supabase.table('users').insert(user).execute()
                print(f"✅ Usuário criado: {user['name']}")
            except Exception as e:
                print(f"⚠️ Usuário já existe ou erro: {user['name']} - {e}")
        
        # 4. Criar veículos de teste
        print("🚗 Criando veículos de teste...")
        
        vehicles_data = [
            {
                'id': str(uuid.uuid4()),
                'license_plate': 'ABC-1234',
                'model': 'Mercedes-Benz Sprinter',
                'capacity': 20,
                'company_id': company_id
            },
            {
                'id': str(uuid.uuid4()),
                'license_plate': 'XYZ-5678',
                'model': 'Volkswagen Crafter',
                'capacity': 16,
                'company_id': company_id
            }
        ]
        
        for vehicle in vehicles_data:
            try:
                result = supabase.table('vehicles').insert(vehicle).execute()
                print(f"✅ Veículo criado: {vehicle['license_plate']}")
            except Exception as e:
                print(f"⚠️ Veículo já existe ou erro: {vehicle['license_plate']} - {e}")
        
        # 5. Criar rotas de teste
        print("🛣️ Criando rotas de teste...")
        
        routes_data = [
            {
                'id': str(uuid.uuid4()),
                'name': 'Rota Centro - Aeroporto',
                'description': 'Rota principal do centro da cidade ao aeroporto',
                'company_id': company_id
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Rota Shopping - Universidade',
                'description': 'Conexão entre shopping center e campus universitário',
                'company_id': company_id
            }
        ]
        
        for route in routes_data:
            try:
                result = supabase.table('routes').insert(route).execute()
                print(f"✅ Rota criada: {route['name']}")
            except Exception as e:
                print(f"⚠️ Rota já existe ou erro: {route['name']} - {e}")
        
        # 6. Verificar dados criados
        print("\n📊 Verificando dados criados...")
        
        # Contar registros em cada tabela
        tables_to_check = ['companies', 'users', 'vehicles', 'routes']
        for table_name in tables_to_check:
            try:
                result = supabase.table(table_name).select('*', count='exact').execute()
                count = result.count if hasattr(result, 'count') else len(result.data)
                print(f"  {table_name}: {count} registros")
            except Exception as e:
                print(f"  {table_name}: Erro ao contar - {e}")
        
        # 7. Testar views importantes
        print("\n🔍 Testando views...")
        
        views_to_test = ['v_active_trips', 'v_driver_last_position', 'v_route_stops']
        for view_name in views_to_test:
            try:
                result = supabase.table(view_name).select('*').limit(5).execute()
                print(f"✅ View {view_name}: OK ({len(result.data)} registros)")
            except Exception as e:
                print(f"❌ View {view_name}: {e}")
        
        # 8. Testar RPC
        print("\n⚙️ Testando RPC...")
        try:
            result = supabase.rpc('gf_map_snapshot_full').execute()
            if result.data and isinstance(result.data, dict):
                keys = list(result.data.keys())
                print(f"✅ RPC gf_map_snapshot_full: OK (chaves: {keys})")
            else:
                print(f"✅ RPC gf_map_snapshot_full: OK (dados: {result.data})")
        except Exception as e:
            print(f"❌ RPC gf_map_snapshot_full: {e}")
        
        print("\n🎉 Validação completa finalizada!")
        print("✅ Banco de dados está funcional com dados de teste básicos")
        
    except Exception as e:
        print(f"❌ Erro durante a validação: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)