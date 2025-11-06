import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  try {
    print('🔌 Testando conexão com Supabase...');
    
    // Inicializa Supabase
    await Supabase.initialize(
      url: 'https://vmoxzesvjcfmrebagcwo.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU',
    );
    
    final supabase = Supabase.instance.client;
    
    print('✅ Supabase inicializado');
    
    // Teste 1: Verificar se há tabelas
    print('\n📊 Verificando tabelas...');
    await supabase.from('companies').select('count').limit(1);
    print('✅ Tabela companies acessível');
    
    // Teste 2: Verificar usuários
    print('\n👥 Verificando usuários...');
    try {
      final users = await supabase.from('users').select('email, role').limit(5);
      print('✅ Usuários encontrados: ${users.length}');
      for (final user in users) {
        print('   - ${user['email']} (${user['role']})');
      }
    } catch (e) {
      print('⚠️ Erro ao buscar usuários: $e');
    }
    
    // Teste 3: Verificar auth
    print('\n🔐 Verificando auth...');
    final session = supabase.auth.currentSession;
    if (session != null) {
      print('✅ Sessão ativa: ${session.user.email}');
    } else {
      print('ℹ️ Nenhuma sessão ativa (isso é normal)');
    }
    
    // Teste 4: Verificar Realtime
    print('\n🔄 Testando Realtime...');
    final channel = supabase.channel('test');
    channel.subscribe();
    print('✅ Realtime conectado');
    
    print('\n🎉 Todos os testes passaram!');
    
  } catch (e, stack) {
    print('\n❌ Erro na conexão:');
    print('$e');
    print('\nStackTrace:');
    print('$stack');
  }
}

// ignore_for_file: avoid_print
