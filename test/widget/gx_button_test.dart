import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:golffox/widgets/gx_button.dart';

void main() {
  group('GxButton Widget Tests', () {
    testWidgets('should render basic button with label', (WidgetTester tester) async {
      // Arrange
      const buttonLabel = 'Test Button';
      bool wasPressed = false;

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GxButton(
              buttonLabel,
              onPressed: () => wasPressed = true,
            ),
          ),
        ),
      );

      // Assert
      expect(find.text(buttonLabel), findsOneWidget);
      expect(find.byType(GxButton), findsOneWidget);

      // Test button press
      await tester.tap(find.byType(GxButton));
      expect(wasPressed, isTrue);
    });

    testWidgets('should render outlined button variant', (WidgetTester tester) async {
      // Arrange
      const buttonLabel = 'Outlined Button';

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GxButton.outlined(
              buttonLabel,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Assert
      expect(find.text(buttonLabel), findsOneWidget);
      expect(find.byType(GxButton), findsOneWidget);
      
      final gxButton = tester.widget<GxButton>(find.byType(GxButton));
      expect(gxButton.variant, equals(GxButtonVariant.outlined));
    });

    testWidgets('should render text button variant', (WidgetTester tester) async {
      // Arrange
      const buttonLabel = 'Text Button';

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GxButton.text(
              buttonLabel,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Assert
      expect(find.text(buttonLabel), findsOneWidget);
      
      final gxButton = tester.widget<GxButton>(find.byType(GxButton));
      expect(gxButton.variant, equals(GxButtonVariant.text));
    });

    testWidgets('should render elevated button variant', (WidgetTester tester) async {
      // Arrange
      const buttonLabel = 'Elevated Button';

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GxButton.elevated(
              buttonLabel,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Assert
      expect(find.text(buttonLabel), findsOneWidget);
      
      final gxButton = tester.widget<GxButton>(find.byType(GxButton));
      expect(gxButton.variant, equals(GxButtonVariant.elevated));
    });

    testWidgets('should render button with icon', (WidgetTester tester) async {
      // Arrange
      const buttonLabel = 'Button with Icon';
      const iconData = Icons.add;

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GxButton(
              buttonLabel,
              icon: iconData,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Assert
      expect(find.text(buttonLabel), findsOneWidget);
      expect(find.byIcon(iconData), findsOneWidget);
    });

    testWidgets('should show loading state', (WidgetTester tester) async {
      // Arrange
      const buttonLabel = 'Loading Button';

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GxButton(
              buttonLabel,
              loading: true,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Assert
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('should be disabled when onPressed is null', (WidgetTester tester) async {
      // Arrange
      const buttonLabel = 'Disabled Button';

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GxButton(
              buttonLabel,
              onPressed: null,
            ),
          ),
        ),
      );

      // Assert
      expect(find.text(buttonLabel), findsOneWidget);
      
      final gxButton = tester.widget<GxButton>(find.byType(GxButton));
      expect(gxButton.onPressed, isNull);
    });

    testWidgets('should handle different button sizes', (WidgetTester tester) async {
      // Test small size
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GxButton(
              'Small Button',
              size: GxButtonSize.small,
              onPressed: () {},
            ),
          ),
        ),
      );

      final smallButton = tester.widget<GxButton>(find.byType(GxButton));
      expect(smallButton.size, equals(GxButtonSize.small));

      // Test large size
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GxButton(
              'Large Button',
              size: GxButtonSize.large,
              onPressed: () {},
            ),
          ),
        ),
      );

      final largeButton = tester.widget<GxButton>(find.byType(GxButton));
      expect(largeButton.size, equals(GxButtonSize.large));
    });

    testWidgets('should handle custom colors', (WidgetTester tester) async {
      // Arrange
      const buttonLabel = 'Custom Color Button';
      const customColor = Colors.red;
      const customTextColor = Colors.white;

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GxButton(
              buttonLabel,
              color: customColor,
              textColor: customTextColor,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Assert
      final gxButton = tester.widget<GxButton>(find.byType(GxButton));
      expect(gxButton.color, equals(customColor));
      expect(gxButton.textColor, equals(customTextColor));
    });

    testWidgets('should handle full width property', (WidgetTester tester) async {
      // Arrange
      const buttonLabel = 'Full Width Button';

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GxButton(
              buttonLabel,
              fullWidth: true,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Assert
      final gxButton = tester.widget<GxButton>(find.byType(GxButton));
      expect(gxButton.fullWidth, isTrue);
    });

    testWidgets('should handle primary property', (WidgetTester tester) async {
      // Test primary button
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GxButton(
              'Primary Button',
              primary: true,
              onPressed: () {},
            ),
          ),
        ),
      );

      final primaryButton = tester.widget<GxButton>(find.byType(GxButton));
      expect(primaryButton.primary, isTrue);

      // Test secondary button
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GxButton(
              'Secondary Button',
              primary: false,
              onPressed: () {},
            ),
          ),
        ),
      );

      final secondaryButton = tester.widget<GxButton>(find.byType(GxButton));
      expect(secondaryButton.primary, isFalse);
    });

    testWidgets('should handle custom padding', (WidgetTester tester) async {
      // Arrange
      const buttonLabel = 'Custom Padding Button';
      const customPadding = EdgeInsets.all(20.0);

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GxButton(
              buttonLabel,
              padding: customPadding,
              onPressed: () {},
            ),
          ),
        ),
      );

      // Assert
      final gxButton = tester.widget<GxButton>(find.byType(GxButton));
      expect(gxButton.padding, equals(customPadding));
    });
  });
}