import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  try {
    stdout.writeln('ðŸ”Œ Testando conexÃ£o com Supabase...');
    
    // Inicializa Supabase com as credenciais encontradas
    await Supabase.initialize(
      url: 'https://vmoxzesvjcfmrebagcwo.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU',
    );
    
    final supabase = Supabase.instance.client;
    stdout.writeln('âœ… Supabase inicializado');
    
    // Teste 1: Verificar usuÃ¡rios na tabela public.users
    stdout.writeln('\nðŸ‘¥ Verificando usuÃ¡rios na tabela public.users...');
    try {
      final users = await supabase.from('users').select('id, email, role').limit(10);
      stdout.writeln('âœ… UsuÃ¡rios encontrados na public.users: ${users.length}');
      for (final user in users) {
        stdout.writeln('   - ${user['email']} (${user['role']})');
      }
    } catch (e) {
      stdout.writeln('âŒ Erro ao buscar usuÃ¡rios na public.users: $e');
    }
    
    // Teste 2: Tentar fazer login com credenciais de teste
    stdout.writeln('\nðŸ” Testando login com golffox@admin.com...');
    try {
      final response = await supabase.auth.signInWithPassword(
        email: 'golffox@admin.com',
        password: 'senha123',
      );
      
      if (response.session != null) {
        stdout.writeln('âœ… Login bem-sucedido!');
        stdout.writeln('   - User ID: ${response.user?.id}');
        stdout.writeln('   - Email: ${response.user?.email}');
        stdout.writeln('   - Metadata: ${response.user?.userMetadata}');
        
        // Fazer logout
        await supabase.auth.signOut();
        stdout.writeln('âœ… Logout realizado');
      } else {
        stdout.writeln('âŒ Login falhou - sem sessÃ£o');
      }
    } catch (e) {
      stdout.writeln('âŒ Erro no login: $e');
    }
    
    // Teste 3: Verificar outras credenciais
    final testCredentials = [
      {'email': 'operador@empresa.com', 'password': 'senha123'},
      {'email': 'motorista@trans.com', 'password': 'senha123'},
      {'email': 'passageiro@empresa.com', 'password': 'senha123'},
    ];
    
    stdout.writeln('\nðŸ§ª Testando outras credenciais...');
    for (final cred in testCredentials) {
      try {
        final response = await supabase.auth.signInWithPassword(
          email: cred['email'],
          password: cred['password']!,
        );
        
        if (response.session != null) {
          stdout.writeln('âœ… ${cred['email']} - Login OK');
          await supabase.auth.signOut();
        } else {
          stdout.writeln('âŒ ${cred['email']} - Login falhou');
        }
      } catch (e) {
        stdout.writeln('âŒ ${cred['email']} - Erro: $e');
      }
    }
    
  } catch (e) {
    stdout.writeln('âŒ Erro geral: $e');
  }
}
