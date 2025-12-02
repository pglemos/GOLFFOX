class User {
  final String id;
  final String email;
  final String role;
  final String? name;
  final DateTime createdAt;
  final DateTime updatedAt;

  const User({
    required this.id,
    required this.email,
    required this.role,
    this.name,
    required this.createdAt,
    required this.updatedAt,
  });
}

