# Padrões de Código - GolfFox

## Visão Geral

Este documento define os padrões de código, convenções de nomenclatura e melhores práticas para o desenvolvimento do projeto GolfFox. Seguir estes padrões garante consistência, legibilidade e manutenibilidade do código.

## Convenções de Nomenclatura

### Arquivos e Diretórios

```dart
// ✅ Correto - snake_case para arquivos
user_profile_page.dart
route_details_widget.dart
auth_service.dart

// ❌ Incorreto
UserProfilePage.dart
routeDetailsWidget.dart
AuthService.dart
```

### Classes

```dart
// ✅ Correto - PascalCase
class UserProfile {
  // ...
}

class RouteDetailsPage extends StatelessWidget {
  // ...
}

// ❌ Incorreto
class userProfile {
  // ...
}

class route_details_page extends StatelessWidget {
  // ...
}
```

### Variáveis e Métodos

```dart
// ✅ Correto - camelCase
String userName;
int totalDistance;
bool isAuthenticated;

void calculateDistance() {
  // ...
}

Future<List<Route>> fetchUserRoutes() async {
  // ...
}

// ❌ Incorreto
String user_name;
int TotalDistance;
bool IsAuthenticated;

void calculate_distance() {
  // ...
}
```

### Constantes

```dart
// ✅ Correto - SCREAMING_SNAKE_CASE para constantes globais
const String API_BASE_URL = 'https://api.golffox.com';
const int MAX_RETRY_ATTEMPTS = 3;
const Duration DEFAULT_TIMEOUT = Duration(seconds: 30);

// ✅ Correto - camelCase para constantes locais
const double defaultPadding = 16.0;
const Color primaryColor = Colors.blue;

// ❌ Incorreto
const String apiBaseUrl = 'https://api.golffox.com';
const int maxRetryAttempts = 3;
```

### Enums

```dart
// ✅ Correto - PascalCase para enum e camelCase para valores
enum UserRole {
  admin,
  player,
  coach,
  guest,
}

enum RouteStatus {
  draft,
  active,
  completed,
  cancelled,
}

// ❌ Incorreto
enum user_role {
  Admin,
  Player,
  Coach,
  Guest,
}
```

## Estrutura de Classes

### Ordem dos Membros

```dart
class ExampleWidget extends StatefulWidget {
  // 1. Constantes estáticas
  static const String routeName = '/example';
  
  // 2. Campos estáticos
  static final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  
  // 3. Campos de instância (final primeiro)
  final String title;
  final VoidCallback? onPressed;
  
  // 4. Construtor
  const ExampleWidget({
    Key? key,
    required this.title,
    this.onPressed,
  }) : super(key: key);

  // 5. Métodos de override
  @override
  State<ExampleWidget> createState() => _ExampleWidgetState();
  
  // 6. Métodos estáticos
  static void staticMethod() {
    // ...
  }
  
  // 7. Métodos de instância
  void instanceMethod() {
    // ...
  }
}
```

### Construtores

```dart
// ✅ Correto - Parâmetros nomeados com required quando necessário
class UserProfile {
  final String id;
  final String name;
  final String? email;
  final DateTime createdAt;

  const UserProfile({
    required this.id,
    required this.name,
    this.email,
    required this.createdAt,
  });

  // Factory constructor para casos especiais
  factory UserProfile.guest() {
    return UserProfile(
      id: 'guest',
      name: 'Guest User',
      createdAt: DateTime.now(),
    );
  }
}

// ❌ Incorreto - Parâmetros posicionais para muitos argumentos
class UserProfile {
  final String id;
  final String name;
  final String? email;
  final DateTime createdAt;

  const UserProfile(this.id, this.name, this.email, this.createdAt);
}
```

## Widgets

### StatelessWidget

```dart
class RouteCard extends StatelessWidget {
  final Route route;
  final VoidCallback? onTap;

  const RouteCard({
    Key? key,
    required this.route,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(route.name),
        subtitle: Text('${route.distance}km'),
        onTap: onTap,
      ),
    );
  }
}
```

### StatefulWidget

```dart
class RouteForm extends StatefulWidget {
  final Route? initialRoute;
  final ValueChanged<Route>? onSaved;

  const RouteForm({
    Key? key,
    this.initialRoute,
    this.onSaved,
  }) : super(key: key);

  @override
  State<RouteForm> createState() => _RouteFormState();
}

class _RouteFormState extends State<RouteForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(
      text: widget.initialRoute?.name ?? '',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: 'Route Name',
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter a route name';
              }
              return null;
            },
          ),
          ElevatedButton(
            onPressed: _saveRoute,
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _saveRoute() {
    if (_formKey.currentState!.validate()) {
      final route = Route(
        name: _nameController.text,
        // ... outros campos
      );
      widget.onSaved?.call(route);
    }
  }
}
```

## Gerenciamento de Estado

### Provider Pattern

```dart
// ✅ Correto - Provider bem estruturado
class RouteProvider extends ChangeNotifier {
  List<Route> _routes = [];
  bool _isLoading = false;
  String? _error;

  // Getters
  List<Route> get routes => List.unmodifiable(_routes);
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasError => _error != null;

  // Métodos públicos
  Future<void> loadRoutes() async {
    _setLoading(true);
    _clearError();

    try {
      final routes = await _routeRepository.fetchRoutes();
      _routes = routes;
    } catch (e) {
      _setError(e.toString());
      AppLogger.error('Failed to load routes', error: e, tag: 'RouteProvider');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> addRoute(Route route) async {
    try {
      final newRoute = await _routeRepository.createRoute(route);
      _routes.add(newRoute);
      notifyListeners();
    } catch (e) {
      _setError(e.toString());
      AppLogger.error('Failed to add route', error: e, tag: 'RouteProvider');
      rethrow;
    }
  }

  // Métodos privados
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }
}
```

### Consumer Usage

```dart
// ✅ Correto - Consumer específico
Consumer<RouteProvider>(
  builder: (context, routeProvider, child) {
    if (routeProvider.isLoading) {
      return const CircularProgressIndicator();
    }

    if (routeProvider.hasError) {
      return ErrorWidget(routeProvider.error!);
    }

    return ListView.builder(
      itemCount: routeProvider.routes.length,
      itemBuilder: (context, index) {
        final route = routeProvider.routes[index];
        return RouteCard(route: route);
      },
    );
  },
)

// ❌ Incorreto - Consumer muito genérico
Consumer<RouteProvider>(
  builder: (context, provider, child) {
    return provider.isLoading
        ? CircularProgressIndicator()
        : ListView.builder(
            itemCount: provider.routes.length,
            itemBuilder: (context, index) => RouteCard(route: provider.routes[index]),
          );
  },
)
```

## Tratamento de Erros

### Try-Catch Blocks

```dart
// ✅ Correto - Tratamento específico de erros
Future<List<Route>> fetchRoutes() async {
  try {
    final response = await _apiClient.get('/routes');
    return response.data.map<Route>((json) => Route.fromJson(json)).toList();
  } on NetworkException catch (e) {
    AppLogger.error('Network error fetching routes', error: e, tag: 'RouteService');
    throw NetworkError('Failed to fetch routes: ${e.message}');
  } on FormatException catch (e) {
    AppLogger.error('Format error parsing routes', error: e, tag: 'RouteService');
    throw ValidationError('Invalid route data format');
  } catch (e) {
    AppLogger.error('Unexpected error fetching routes', error: e, tag: 'RouteService');
    throw UnknownError('An unexpected error occurred');
  }
}

// ❌ Incorreto - Tratamento genérico demais
Future<List<Route>> fetchRoutes() async {
  try {
    final response = await _apiClient.get('/routes');
    return response.data.map<Route>((json) => Route.fromJson(json)).toList();
  } catch (e) {
    print('Error: $e');
    return [];
  }
}
```

### Error Widgets

```dart
// ✅ Correto - Widget de erro reutilizável
class ErrorWidget extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorWidget({
    Key? key,
    required this.message,
    this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 64,
            color: Theme.of(context).colorScheme.error,
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: Theme.of(context).textTheme.bodyLarge,
            textAlign: TextAlign.center,
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onRetry,
              child: const Text('Try Again'),
            ),
          ],
        ],
      ),
    );
  }
}
```

## Validação

### Form Validation

```dart
// ✅ Correto - Validação usando sistema centralizado
class RouteFormValidator {
  static String? validateName(String? value) {
    return Validators.required(value, 'Route name is required') ??
           Validators.minLength(value, 3, 'Route name must be at least 3 characters');
  }

  static String? validateDistance(String? value) {
    return Validators.required(value, 'Distance is required') ??
           Validators.isNumeric(value, 'Distance must be a number') ??
           Validators.minValue(double.tryParse(value ?? ''), 0.1, 'Distance must be greater than 0');
  }
}

// Uso no widget
TextFormField(
  controller: _nameController,
  decoration: const InputDecoration(labelText: 'Route Name'),
  validator: RouteFormValidator.validateName,
)
```

## Logging

### Uso do AppLogger

```dart
// ✅ Correto - Logging estruturado
class RouteService {
  Future<Route> createRoute(Route route) async {
    AppLogger.info('Creating new route: ${route.name}', tag: 'RouteService');
    
    try {
      final result = await _repository.create(route);
      AppLogger.info('Route created successfully: ${result.id}', tag: 'RouteService');
      return result;
    } catch (e) {
      AppLogger.error('Failed to create route', error: e, tag: 'RouteService');
      rethrow;
    }
  }

  Future<void> deleteRoute(String routeId) async {
    AppLogger.warning('Deleting route: $routeId', tag: 'RouteService');
    
    try {
      await _repository.delete(routeId);
      AppLogger.info('Route deleted successfully: $routeId', tag: 'RouteService');
    } catch (e) {
      AppLogger.error('Failed to delete route', error: e, tag: 'RouteService');
      rethrow;
    }
  }
}

// ❌ Incorreto - Print statements
class RouteService {
  Future<Route> createRoute(Route route) async {
    print('Creating route: ${route.name}');
    
    try {
      final result = await _repository.create(route);
      print('Route created: ${result.id}');
      return result;
    } catch (e) {
      print('Error creating route: $e');
      rethrow;
    }
  }
}
```

## Comentários e Documentação

### Comentários de Código

```dart
// ✅ Correto - Comentários úteis
/// Calculates the total distance of a golf route including all holes.
/// 
/// Takes into account the walking distance between holes and any
/// additional paths like cart paths or shortcuts.
/// 
/// Returns the total distance in meters.
double calculateTotalDistance(List<Hole> holes) {
  // Start with the sum of all hole distances
  double total = holes.fold(0.0, (sum, hole) => sum + hole.distance);
  
  // Add walking distance between holes (estimated 50m average)
  total += (holes.length - 1) * 50.0;
  
  return total;
}

// ❌ Incorreto - Comentários óbvios
/// Gets the name
String getName() {
  return name; // Returns the name
}
```

### Documentação de Classes

```dart
/// A service class responsible for managing golf routes.
/// 
/// This service handles CRUD operations for routes, including
/// validation, caching, and synchronization with the backend API.
/// 
/// Example usage:
/// ```dart
/// final service = RouteService();
/// final routes = await service.fetchUserRoutes(userId);
/// ```
class RouteService {
  /// Creates a new route for the specified user.
  /// 
  /// Validates the route data before sending to the API.
  /// Throws [ValidationError] if the route data is invalid.
  /// Throws [NetworkError] if the API request fails.
  Future<Route> createRoute(Route route) async {
    // Implementation
  }
}
```

## Testes

### Nomenclatura de Testes

```dart
// ✅ Correto - Nomes descritivos
void main() {
  group('RouteService', () {
    group('createRoute', () {
      test('should create route successfully when data is valid', () async {
        // Arrange
        final route = Route(name: 'Test Route', distance: 100);
        
        // Act
        final result = await routeService.createRoute(route);
        
        // Assert
        expect(result.id, isNotNull);
        expect(result.name, equals('Test Route'));
      });

      test('should throw ValidationError when route name is empty', () async {
        // Arrange
        final route = Route(name: '', distance: 100);
        
        // Act & Assert
        expect(
          () => routeService.createRoute(route),
          throwsA(isA<ValidationError>()),
        );
      });
    });
  });
}

// ❌ Incorreto - Nomes genéricos
void main() {
  test('test1', () {
    // ...
  });

  test('test2', () {
    // ...
  });
}
```

## Performance

### Otimizações

```dart
// ✅ Correto - ListView.builder para listas grandes
ListView.builder(
  itemCount: routes.length,
  itemBuilder: (context, index) {
    final route = routes[index];
    return RouteCard(route: route);
  },
)

// ❌ Incorreto - Column para listas grandes
Column(
  children: routes.map((route) => RouteCard(route: route)).toList(),
)

// ✅ Correto - Const constructors
const Padding(
  padding: EdgeInsets.all(16.0),
  child: Text('Static text'),
)

// ❌ Incorreto - Sem const
Padding(
  padding: EdgeInsets.all(16.0),
  child: Text('Static text'),
)
```

## Formatação

### Dart Format

Use sempre `dart format` para manter a formatação consistente:

```bash
dart format lib/
dart format test/
```

### Line Length

Mantenha as linhas com no máximo 80 caracteres quando possível:

```dart
// ✅ Correto
final user = UserProfile(
  id: userId,
  name: userName,
  email: userEmail,
  createdAt: DateTime.now(),
);

// ❌ Incorreto
final user = UserProfile(id: userId, name: userName, email: userEmail, createdAt: DateTime.now());
```

## Imports

### Organização de Imports

```dart
// 1. Dart core libraries
import 'dart:async';
import 'dart:convert';

// 2. Flutter libraries
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// 3. Third-party packages
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;

// 4. Local imports (relative paths)
import '../core/auth/auth_manager.dart';
import '../shared/widgets/loading_widget.dart';
import 'route_card.dart';
```

### Import Aliases

```dart
// ✅ Correto - Aliases para evitar conflitos
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as path;

// ✅ Correto - Show/hide para imports específicos
import 'package:flutter/material.dart' show Colors, TextStyle;
import 'package:flutter/material.dart' hide Router;
```

## Conclusão

Seguir estes padrões de código garante:

- **Consistência**: Código uniforme em todo o projeto
- **Legibilidade**: Fácil compreensão por outros desenvolvedores
- **Manutenibilidade**: Facilita modificações e correções
- **Qualidade**: Reduz bugs e melhora a robustez
- **Colaboração**: Facilita o trabalho em equipe

Para garantir a aderência a estes padrões, utilize:

- **Linter**: Configure o `analysis_options.yaml`
- **Code Review**: Revise o código antes do merge
- **Automated Tools**: Use ferramentas de formatação automática
- **Documentation**: Mantenha a documentação atualizada