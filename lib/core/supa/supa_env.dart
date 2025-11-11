// ========================================
// GolfFox Supabase Environment v11.0
// Configuração de ambiente do Supabase (sem segredos hardcoded)
// ========================================

class SupaEnv {
  // ========================================
  // CONFIGURACOES DO SUPABASE
  // ========================================
  // Em produção e desenvolvimento, estes valores DEVEM vir via --dart-define
  // ou variáveis de ambiente em tempo de build. Não manter valores reais no código.
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
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
