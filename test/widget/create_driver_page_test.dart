import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:golffox/features/drivers/create_driver_page.dart';

void main() {
  testWidgets('CreateDriverPage enables onUserInteraction autovalidation', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: MaterialApp(home: CreateDriverPage())));
    final form = tester.widget<Form>(find.byType(Form));
    expect(form.autovalidateMode, AutovalidateMode.onUserInteraction);
  });
}
