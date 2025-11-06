// ========================================
// GolfFox Supabase Environment v11.0
// Configuracao de ambiente do Supabase
// ========================================

class SupaEnv {
  // ========================================
  // CONFIGURACOES DO SUPABASE
  // ========================================
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://vmoxzesvjcfmrebagcwo.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU',
  );

  // ========================================
  // VALIDACAO
  // ========================================
  static bool get isConfigured => supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;

  static String get configurationError {
    if (supabaseUrl.isEmpty && supabaseAnonKey.isEmpty) {
      return 'SUPABASE_URL e SUPABASE_ANON_KEY nao configurados';
    } else if (supabaseUrl.isEmpty) {
      return 'SUPABASE_URL nao configurado';
    } else if (supabaseAnonKey.isEmpty) {
      return 'SUPABASE_ANON_KEY nao configurado';
    }
    return '';
  }

  // ========================================
  // DEBUG INFO
  // ========================================
  static Map<String, dynamic> get debugInfo => {
      'supabaseUrl': supabaseUrl.isNotEmpty
          ? '${supabaseUrl.substring(0, 20)}...'
          : 'NOT_SET',
      'supabaseAnonKey': supabaseAnonKey.isNotEmpty
          ? '${supabaseAnonKey.substring(0, 20)}...'
          : 'NOT_SET',
      'isConfigured': isConfigured,
    };
}
