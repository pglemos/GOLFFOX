
# GolfFox UI (Flutter • Web/Mobile)

Este pacote entrega um **esqueleto premium** (Apple/Tesla vibes) para reconstruir o GolfFox 100% em Flutter.

## Rodar
1) Crie um projeto novo:
```bash
flutter create golffox_ui
cd golffox_ui
```
2) Substitua a pasta `lib/` e o arquivo `pubspec.yaml` por estes aqui.
3) `flutter pub get`
4) Web:
```bash
flutter run -d chrome
```
5) Android/iOS conforme seu ambiente.

## Tecnologias
- Material 3, tokens premium, tipografia Inter/Apple-like
- Navegação: `go_router`
- Estado: `flutter_riverpod`
- Gráficos mini: `fl_chart`
- Responsivo: Rail (web), BottomNav (mobile)
- **Sem overflow**: `AutoSizeText` e tamanhos fluídos

## Próximos passos (integração Supabase)
- Criar providers para autenticação e fetch (RLS por papel)
- Trocar dados de `data/mock.dart` por RPCs/views do seu banco
- Criar componentes de tabela (PaginatedDataTable, Slivers, etc.)

