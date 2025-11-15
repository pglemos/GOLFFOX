// ========================================
// GolfFox Date Utils v11.0
// Utilitarios para formatacao de datas
// ========================================

class GfDateUtils {
  /// Retorna uma string indicando ha quanto tempo a data foi
  static String timeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return 'ha ${difference.inDays} dia${difference.inDays > 1 ? 's' : ''}';
    } else if (difference.inHours > 0) {
      return 'ha ${difference.inHours} hora${difference.inHours > 1 ? 's' : ''}';
    } else if (difference.inMinutes > 0) {
      return 'ha ${difference.inMinutes} minuto${difference.inMinutes > 1 ? 's' : ''}';
    } else {
      return 'agora mesmo';
    }
  }

  /// Formata uma data para exibicao
  static String formatDate(DateTime dateTime) => '${dateTime.day.toString().padLeft(2, '0')}/'
        '${dateTime.month.toString().padLeft(2, '0')}/'
        '${dateTime.year}';

  /// Formata uma hora para exibicao
  static String formatTime(DateTime dateTime) => '${dateTime.hour.toString().padLeft(2, '0')}:'
        '${dateTime.minute.toString().padLeft(2, '0')}';

  /// Formata data e hora para exibicao
  static String formatDateTime(DateTime dateTime) => '${formatDate(dateTime)} ${formatTime(dateTime)}';
}
