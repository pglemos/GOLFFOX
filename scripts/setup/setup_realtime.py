#!/usr/bin/env python3
"""
GolfFox Real-time Setup Script
Configura a tabela vehicle_positions e habilita real-time no Supabase
"""

import requests
import sys
from pathlib import Path

# Supabase credentials
SUPABASE_URL = "https://vmoxzesvjcfmrebagcwo.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A"

def execute_sql_file(file_path):
    """Executa um arquivo SQL no Supabase"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            sql_content = file.read()
        
        headers = {
            'Authorization': f'Bearer {SERVICE_KEY}',
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY
        }
        
        # Executar SQL via REST API
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
            headers=headers,
            json={'sql': sql_content}
        )
        
        if response.status_code == 200:
            print(f"✅ SQL executado com sucesso: {file_path}")
            return True
        else:
            print(f"❌ Erro ao executar SQL: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except FileNotFoundError:
        print(f"❌ Arquivo não encontrado: {file_path}")
        return False
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def test_connection():
    """Testa a conexão com o Supabase"""
    try:
        headers = {
            'Authorization': f'Bearer {SERVICE_KEY}',
            'apikey': SERVICE_KEY
        }
        
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/vehicle_positions?select=count",
            headers=headers
        )
        
        if response.status_code == 200:
            print("✅ Conexão com Supabase OK")
            return True
        else:
            print(f"❌ Erro de conexão: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

def main():
    print("🚀 GolfFox Real-time Setup")
    print("=" * 40)
    
    # Testar conexão
    if not test_connection():
        print("❌ Falha na conexão. Verifique as credenciais.")
        sys.exit(1)
    
    # Executar migração
    migration_file = Path(__file__).parent.parent / "supabase" / "migrations" / "vehicle_positions_realtime.sql"
    
    if execute_sql_file(migration_file):
        print("\n✅ Migração executada com sucesso!")
        print("\n📋 Próximos passos:")
        print("1. Vá para o Supabase Dashboard")
        print("2. Navegue para Database → Replication")
        print("3. Habilite Real-time para a tabela 'vehicle_positions'")
        print("4. Execute o app Flutter para testar")
    else:
        print("\n❌ Falha na execução da migração")
        sys.exit(1)

if __name__ == "__main__":
    main()