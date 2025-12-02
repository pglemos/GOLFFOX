import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:golffox/widgets/gx_card.dart';

void main() {
  group('GxCard Widget Tests', () {
    testWidgets('should render card with child widget', (tester) async {
      // Arrange
      const childText = 'Card Content';
      const childWidget = Text(childText);

      // Act
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GxCard(
              child: childWidget,
            ),
          ),
        ),
      );

      // Assert
      expect(find.text(childText), findsOneWidget);
      expect(find.byType(GxCard), findsOneWidget);
      expect(find.byType(Card), findsOneWidget);
      expect(find.byType(Padding), findsWidgets);
    });

    testWidgets('should apply default padding', (tester) async {
      // Arrange
      const childWidget = Text('Test Content');

      // Act
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GxCard(
              child: childWidget,
            ),
          ),
        ),
      );

      // Assert
      final gxCard = tester.widget<GxCard>(find.byType(GxCard));
      expect(gxCard.padding, equals(const EdgeInsets.all(16)));

      final paddingWidgets = tester.widgetList<Padding>(find.byType(Padding));
      final cardPadding = paddingWidgets.firstWhere((p) => p.padding == const EdgeInsets.all(16));
      expect(cardPadding.padding, equals(const EdgeInsets.all(16)));
    });

    testWidgets('should apply custom padding', (tester) async {
      // Arrange
      const childWidget = Text('Test Content');
      const customPadding = EdgeInsets.symmetric(horizontal: 24, vertical: 12);

      // Act
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GxCard(
              padding: customPadding,
              child: childWidget,
            ),
          ),
        ),
      );

      // Assert
      final gxCard = tester.widget<GxCard>(find.byType(GxCard));
      expect(gxCard.padding, equals(customPadding));

      final paddingWidgets = tester.widgetList<Padding>(find.byType(Padding));
      final cardPadding = paddingWidgets.firstWhere((p) => p.padding == customPadding);
      expect(cardPadding.padding, equals(customPadding));
    });

    testWidgets('should apply custom margin', (tester) async {
      // Arrange
      const childWidget = Text('Test Content');
      const customMargin = EdgeInsets.all(20);

      // Act
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GxCard(
              margin: customMargin,
              child: childWidget,
            ),
          ),
        ),
      );

      // Assert
      final gxCard = tester.widget<GxCard>(find.byType(GxCard));
      expect(gxCard.margin, equals(customMargin));

      final card = tester.widget<Card>(find.byType(Card));
      expect(card.margin, equals(customMargin));
    });

    testWidgets('should handle null margin', (tester) async {
      // Arrange
      const childWidget = Text('Test Content');

      // Act
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GxCard(
              child: childWidget,
            ),
          ),
        ),
      );

      // Assert
      final gxCard = tester.widget<GxCard>(find.byType(GxCard));
      expect(gxCard.margin, isNull);

      final card = tester.widget<Card>(find.byType(Card));
      expect(card.margin, isNull);
    });

    testWidgets('should render complex child widget', (tester) async {
      // Arrange
      const complexChild = Column(
        children: [
          Text('Title'),
          SizedBox(height: 8),
          Text('Subtitle'),
          Icon(Icons.star),
        ],
      );

      // Act
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GxCard(
              child: complexChild,
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Title'), findsOneWidget);
      expect(find.text('Subtitle'), findsOneWidget);
      expect(find.byIcon(Icons.star), findsOneWidget);
      expect(find.byType(Column), findsOneWidget);
      expect(find.byType(SizedBox), findsWidgets);
    });

    testWidgets('should maintain card structure with different content', (tester) async {
      // Arrange
      final buttonChild = ElevatedButton(
        onPressed: () {},
        child: const Text('Button in Card'),
      );

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: GxCard(
              child: buttonChild,
            ),
          ),
        ),
      );

      // Assert
      expect(find.byType(GxCard), findsOneWidget);
      expect(find.byType(Card), findsOneWidget);
      expect(find.byType(Padding), findsWidgets);
      expect(find.byType(ElevatedButton), findsOneWidget);
      expect(find.text('Button in Card'), findsOneWidget);
    });

    testWidgets('should handle zero padding', (tester) async {
      // Arrange
      const childWidget = Text('No Padding Content');
      const zeroPadding = EdgeInsets.zero;

      // Act
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GxCard(
              padding: zeroPadding,
              child: childWidget,
            ),
          ),
        ),
      );

      // Assert
      final gxCard = tester.widget<GxCard>(find.byType(GxCard));
      expect(gxCard.padding, equals(zeroPadding));

      final paddingWidgets = tester.widgetList<Padding>(find.byType(Padding));
      final cardPadding = paddingWidgets.firstWhere((p) => p.padding == zeroPadding);
      expect(cardPadding.padding, equals(zeroPadding));
    });

    testWidgets('should handle asymmetric padding and margin', (tester) async {
      // Arrange
      const childWidget = Text('Asymmetric Content');
      const asymmetricPadding = EdgeInsets.only(left: 10, top: 20, right: 30, bottom: 40);
      const asymmetricMargin = EdgeInsets.only(left: 5, top: 15, right: 25, bottom: 35);

      // Act
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: GxCard(
              padding: asymmetricPadding,
              margin: asymmetricMargin,
              child: childWidget,
            ),
          ),
        ),
      );

      // Assert
      final gxCard = tester.widget<GxCard>(find.byType(GxCard));
      expect(gxCard.padding, equals(asymmetricPadding));
      expect(gxCard.margin, equals(asymmetricMargin));

      final paddingWidgets = tester.widgetList<Padding>(find.byType(Padding));
      final cardPadding = paddingWidgets.firstWhere((p) => p.padding == asymmetricPadding);
      expect(cardPadding.padding, equals(asymmetricPadding));

      final card = tester.widget<Card>(find.byType(Card));
      expect(card.margin, equals(asymmetricMargin));
    });
  });
}