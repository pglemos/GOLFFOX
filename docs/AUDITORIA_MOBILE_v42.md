# Auditoria Mobile (Flutter) - GOLF FOX v42

- Stack: Flutter 3.24+, Dart 3, Clean Architecture + DDD, Riverpod, go_router
- Pacotes core: `supabase_flutter`, `google_maps_flutter`, `geolocator`, `flutter_riverpod`, `freezed`, `dio`
- Módulos previstos:
  - features/driver: login, rota do dia, mapa, eventos de embarque, ocorrências
  - features/passenger: login, rota atribuída, notificação de embarque, histórico
  - features/operator: leitura (status), notificações e recibo
  - features/admin: leitura (KPIs) opcional
- Integração: mesmo projeto Supabase (auth, RLS), Storage p/ anexos, Realtime p/ posições
- Observações:
  - Verificar chaves no `.env` (flutter_dotenv) e flavor para prod
  - Garantir consentimento LGPD e telemetria opt-in
  - Fastlane para build CI/CD
