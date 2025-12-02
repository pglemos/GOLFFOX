import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:golffox/core/services/error_service.dart';

void main() {
  group('ErrorService', () {
    test('from returns timeout GxError for TimeoutException', () {
      final gx = ErrorService.instance.from(
        TimeoutException('timeout'),
      );
      expect(gx.code, 'timeout');
      expect(gx.severity, ErrorSeverity.warning);
    });

    test('reportError stores history and returns', () async {
      final service = ErrorService.instance;
      await service.reportError(
        Exception('test'),
        StackTrace.current,
        context: 'unit.test',
      );
      final history = service.getErrorHistory();
      expect(history.isNotEmpty, true);
      expect(history.last.context, 'unit.test');
    });

    test('executeWithHandling rethrows and reports', () async {
      final service = ErrorService.instance;
      await expectLater(
        service.executeWithHandling<void>(
          () async {
            throw Exception('boom');
          },
          context: 'unit.exec',
        ),
        throwsException,
      );
      await Future<void>.delayed(const Duration(milliseconds: 10));
      final history = service.getErrorHistory();
      expect(history.isNotEmpty, true);
      expect(history.any((h) => h.error.toString().contains('boom')), true);
    });
  });
}
