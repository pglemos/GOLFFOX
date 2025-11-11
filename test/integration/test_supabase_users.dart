import 'dart:io';

import 'package:supabase_flutter/supabase_flutter.dart';

void log(String message) => stdout.writeln(message);

Future<void> main() async {
  try {
    log('🔐 Testando usuários do Supabase...');

    await Supabase.initialize(
      url: 'https://vmoxzesvjcfmrebagcwo.supabase.co',
      anonKey:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU',
    );

    final supabase = Supabase.instance.client;
    log('✅ Supabase inicializado');

    log('\n👥 Lendo tabela public.users...');
    try {
      final users =
          await supabase.from('users').select('id, email, role').limit(10);
      log('✅ ${users.length} usuários encontrados');
      for (final user in users) {
        log('   • ${user['email']} (${user['role']})');
      }
    } on Exception catch (e) {
      log('⚠️ Erro ao buscar usuários: $e');
    }

    log('\n🔑 Testando login golffox@admin.com...');
    try {
      final response = await supabase.auth.signInWithPassword(
        email: 'golffox@admin.com',
        password: 'senha123',
      );

      if (response.session != null) {
        log('✅ Login ok para golffox@admin.com');
        log('   • User ID: ${response.user?.id}');
        log('   • Email: ${response.user?.email}');
        log('   • Metadata: ${response.user?.userMetadata}');
        await supabase.auth.signOut();
        log('➡️ Logout realizado');
      } else {
        log('⚠️ Login falhou (sem sessão)');
      }
    } on Exception catch (e) {
      log('⚠️ Erro no login: $e');
    }

    log('\n👥 Testando outras credenciais...');
    const samples = <Map<String, String>>[
      {'email': 'operador@empresa.com', 'password': 'senha123'},
      {'email': 'motorista@trans.com', 'password': 'senha123'},
      {'email': 'passageiro@empresa.com', 'password': 'senha123'},
    ];

    for (final cred in samples) {
      final email = cred['email'];
      final password = cred['password'];
      if (email == null || password == null) {
        continue;
      }
      try {
        final response = await supabase.auth.signInWithPassword(
          email: email,
          password: password,
        );
        if (response.session != null) {
          log('✅ $email - acesso ok');
          await supabase.auth.signOut();
        } else {
          log('⚠️ $email - login falhou');
        }
      } on Exception catch (e) {
        log('⚠️ $email - erro: $e');
      }
    }
  } on Exception catch (e) {
    log('❌ Erro geral: $e');
  }
}
