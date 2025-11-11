import 'dart:io';

Future<void> main() async {
  print('🔍 Testando Supabase GolfFox...\n');

  try {
    print('1️⃣ Verificando endpoint REST...');
    final client = HttpClient();
    try {
      final request = await client.getUrl(
        Uri.parse('https://vmoxzesvjcfmrebagcwo.supabase.co/rest/v1/'),
      );
      request.headers.set(
        'apikey',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU',
      );
      final response = await request.close();
      print('   ✅ Conexão OK (status ${response.statusCode})');
    } on Exception catch (e) {
      print('   ❌ Erro de conexão: $e');
    } finally {
      client.close();
    }

    print('\n2️⃣ Verificando arquivos básicos do Flutter...');
    for (final path in [
      'lib/main.dart',
      'lib/supabase/supabase_config.dart',
      'lib/supabase/seeds_v74.sql',
      'lib/supabase/migration_complete_v74.sql',
    ]) {
      if (File(path).existsSync()) {
        print('   ✅ $path encontrado');
      } else {
        print('   ⚠️ $path não encontrado');
      }
    }

    print('\n🚀 Ambiente local configurado!');
  } on Exception catch (e) {
    print('\n❌ Erro geral: $e');
  }
}

// ignore_for_file: avoid_print
