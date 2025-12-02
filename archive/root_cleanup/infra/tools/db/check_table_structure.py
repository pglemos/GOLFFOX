#!/usr/bin/env python3
"""
Script para verificar a estrutura atual das tabelas
"""

import os
from supabase import create_client, Client

def main():
    # Conectar ao Supabase
    url = "https://vmoxzesvjcfmrebagcwo.supabase.co"
    key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU"
    
    supabase = create_client(url, key)
    
    # Verificar estrutura da tabela companies
    print("🔍 Verificando estrutura da tabela companies...")
    try:
        # Tentar fazer uma query simples na tabela companies
        result = supabase.table('companies').select('*').limit(1).execute()
        print("✅ Tabela companies existe e é acessível")
        
        # Verificar se há dados
        if result.data:
            print("Colunas encontradas na tabela companies:")
            for key in result.data[0].keys():
                print(f"  - {key}")
        else:
            print("Tabela companies está vazia")
            
    except Exception as e:
        print(f"❌ Erro ao verificar tabela companies: {e}")
    
    # Verificar se a tabela drivers existe
    print("\n🔍 Verificando se a tabela drivers existe...")
    try:
        result = supabase.table('drivers').select('*').limit(1).execute()
        print("✅ Tabela drivers existe e é acessível")
        
        # Verificar se há dados
        if result.data:
            print("Colunas encontradas na tabela drivers:")
            for key in result.data[0].keys():
                print(f"  - {key}")
        else:
            print("Tabela drivers está vazia")
                
    except Exception as e:
        print(f"❌ Erro ao verificar tabela drivers: {e}")
        
    # Verificar outras tabelas importantes
    tables_to_check = ['users', 'vehicles', 'routes', 'trips']
    for table_name in tables_to_check:
        print(f"\n🔍 Verificando tabela {table_name}...")
        try:
            result = supabase.table(table_name).select('*').limit(1).execute()
            print(f"✅ Tabela {table_name} existe e é acessível")
            
            if result.data:
                print(f"Colunas encontradas na tabela {table_name}:")
                for key in result.data[0].keys():
                    print(f"  - {key}")
            else:
                print(f"Tabela {table_name} está vazia")
                
        except Exception as e:
            print(f"❌ Erro ao verificar tabela {table_name}: {e}")

if __name__ == "__main__":
    main()