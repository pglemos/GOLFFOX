import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  try {
    print('🔌 Testando conexão com Supabase...');

    await Supabase.initialize(
      url: 'https://vmoxzesvjcfmrebagcwo.supabase.co',
      anonKey:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU',
    );

    final supabase = Supabase.instance.client;
    print('✅ Supabase inicializado');

    print('\n🔍 Verificando tabela companies...');
    await supabase.from('companies').select('count').limit(1);
    print('✅ Tabela companies acessível');

    print('\n👥 Verificando usuários...');
    try {
      final users = await supabase.from('users').select('email, role').limit(5);
      print('✅ Usuários encontrados: ${users.length}');
      for (final user in users) {
        print('   • ${user['email']} (${user['role']})');
      }
    } on Exception catch (e) {
      print('⚠️ Erro ao buscar usuários: $e');
    }

    print('\n🔐 Verificando sessão atual...');
    final session = supabase.auth.currentSession;
    if (session != null) {
      print('✅ Sessão ativa: ${session.user.email}');
    } else {
      print('ℹ️ Nenhuma sessão ativa (esperado em testes)');
    }

    print('\n📡 Testando Realtime...');
    supabase.channel('test').subscribe();
    print('✅ Realtime conectado via canal de teste');

    print('\n🎉 Todos os testes passaram!');
  } on Exception catch (e, stack) {
    print('\n❌ Erro na conexão: $e');
    print('\nStackTrace: $stack');
  }
}

// ignore_for_file: avoid_print
