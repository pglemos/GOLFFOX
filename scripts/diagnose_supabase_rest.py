import requests
import json

# Supabase REST API
SUPABASE_URL = "https://vmoxzesvjcfmrebagcwo.supabase.co"
# Service role key (obtida das variáveis de ambiente ou hardcoded para diagnóstico)
# NOTA: Esta é a anon key pública - para operações sensíveis precisaremos da service role key
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NjI1MjksImV4cCI6MjA1MDAzODUyOX0.k_1pxDKRjVQDg9P7wGlW8EbjFRx5S0K6ZVkgRLcDL0A"

headers = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json"
}

print("=" * 70)
print("🔍 DIAGNÓSTICO REMOTO DO SUPABASE - GOLFFOX")
print("=" * 70)

# Verificar se conseguimos acessar a API
try:
    # Tentar buscar empresas (REST API)
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/companies",
        headers=headers,
        params={"select": "id,name,cnpj,is_active", "limit": "5"}
    )
    
    print("\n✅ Conexão com Supabase estabelecida!")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        companies = response.json()
        print(f"\n📊 Empresas encontradas: {len(companies)}")
        
        if companies:
            print("\nPrimeiras empresas:")
            for comp in companies:
                active = "✅" if comp.get('is_active') else "❌"
                print(f"  {active} {comp.get('name', 'N/A'):40} CNPJ: {comp.get('cnpj', 'N/A')}")
        else:
            print("\n⚠️  Nenhuma empresa cadastrada no banco")
    
    elif response.status_code == 404:
        print(f"\n❌ Tabela 'companies' NÃO EXISTE!")
        print("Precisamos verificar qual é o nome correto da tabela.")
        
    else:
        print(f"\n⚠️  Resposta inesperada: {response.status_code}")
        print(f"Body: {response.text[:200]}")
    
except Exception as e:
    print(f"\n❌ Erro ao acessar API: {e}")

# Tentar users
print("\n" + "=" * 70)
print("👤 VERIFICANDO USUÁRIOS")
print("=" * 70)

try:
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/users",
        headers=headers,
        params={
            "select": "id,email,role",
            "or": "(email.eq.teste@transportadora.com,email.eq.teste@empresa.com,email.eq.golffox@admin.com)"
        }
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        users = response.json()
        print(f"\n📊 Usuários de teste encontrados: {len(users)}")
        
        if users:
            for user in users:
                print(f"  - {user.get('email', 'N/A'):35} Role: {user.get('role', 'N/A')}")
        else:
            print("\n⚠️  NENHUM usuário de teste encontrado!")
            print("     Credenciais teste@transportadora.com e teste@empresa.com NÃO EXISTEM")
    
    elif response.status_code == 404:
        print(f"\n❌ Tabela 'users' NÃO EXISTE!")
        
except Exception as e:
    print(f"\n❌ Erro ao verificar usuários: {e}")

# Informações finais
print("\n" + "=" * 70)
print("📝 RESUMO DO DIAGNÓSTICO")
print("=" * 70)
print("""
PRÓXIMOS PASSOS:

1. Se tabela 'companies' existe:
   - ✅ API create-operator está correta
   - ⚠️  Verificar por que não está criando empresas
   
2. Se tabela 'companies' NÃO existe:
   - ❌ Precisamos criar a tabela
   - OU usar nome correto (gf_company, etc)

3. Se usuários de teste NÃO existem:
   - ❌ Criar via Supabase Auth Admin
   - Login transportadora/empresa vai continuar falhando

NOTA: Este script usa anon key (acesso limitado por RLS).
Para diagnóstico completo, precisamos da service_role_key.
""")

print("\n✅ Diagnóstico concluído!")
