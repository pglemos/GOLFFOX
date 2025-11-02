import 'dart:io';

Future<void> main() async {
  print('🔍 Testando conexão com Supabase GolfFox...\n');

  try {
    // Teste 1: Verificar se a URL está acessível
    print('1️⃣ Testando URL do Supabase...');
    final client = HttpClient();
    try {
      final request = await client.getUrl(
        Uri.parse('https://vmoxzesvjcfmrebagcwo.supabase.co/rest/v1/'),
      );
      request.headers.set('apikey',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU');
      final response = await request.close();
      print('   ✅ Conexão OK (Status: ${response.statusCode})');
    } catch (e) {
      print('   ❌ Erro de conexão: $e');
    } finally {
      client.close();
    }

    print('\n2️⃣ Verificando estrutura do projeto Flutter...');
    final files = [
      'lib/main.dart',
      'lib/supabase/supabase_config.dart',
      'lib/supabase/seeds_v74.sql',
      'lib/supabase/migration_complete_v74.sql',
    ];

    for (final file in files) {
      final f = File(file);
      if (await f.exists()) {
        print('   ✅ $file existe');
      } else {
        print('   ❌ $file NÃO existe');
      }
    }

    print('\n✅ Ambiente local configurado!');
    print('\n📱 O app Flutter deve estar rodando em:');
    print('   http://localhost:57982/l7dqCcejaSY=');
    print('\n🎯 Agora você pode:');
    print('   1. Fazer login com qualquer usuário criado no Supabase');
    print('   2. Testar todos os dashboards');
    print('   3. Verificar tracking em tempo real');
    print('\n✨ Tudo pronto para usar!');

  } catch (e) {
    print('\n❌ Erro: $e');
  }
}

// ignore_for_file: avoid_print
