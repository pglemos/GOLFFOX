import 'dart:io';
import 'package:postgres/postgres.dart';

Future<void> main(List<String> args) async {
  final env = Platform.environment;
  final host = env['PGHOST'] ?? '';
  final port = int.tryParse(env['PGPORT'] ?? '') ?? 5432;
  final db = env['PGDATABASE'] ?? 'postgres';
  final user = env['PGUSER'] ?? '';
  final pass = env['PGPASSWORD'] ?? '';
  final filePath = env['SQL_FILE'] ?? '';

  if ([host, db, user, pass, filePath].any((e) => e.isEmpty)) {
    stderr.writeln('Missing required env vars: PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD, SQL_FILE');
    exit(2);
  }

  final sql = await File(filePath).readAsString();
  final endpoint = Endpoint(
    host: host,
    port: port,
    database: db,
    username: user,
    password: pass,
  );
  final settings = ConnectionSettings(
    sslMode: SslMode.require,
    connectTimeout: const Duration(seconds: 60),
  );

  try {
    stdout.writeln('Connecting to $host:$port/$db as $user ...');
    final conn = await Connection.open(endpoint, settings: settings);
    stdout.writeln(
      'Connected. Applying migration: ${filePath.split(Platform.pathSeparator).last}',
    );
    // Use simple (multi-statement) query
    await conn.execute(Sql.named(sql));
    stdout.writeln('Migration applied successfully.');
  } catch (e, st) {
    stderr.writeln('Failed to apply migration: $e');
    stderr.writeln(st);
    exit(1);
  } finally {
    // Connection closes automatically on process exit; nothing to do here.
  }
}
