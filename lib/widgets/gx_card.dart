import 'package:flutter/material.dart';

class GxCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;

  const GxCard(
      {super.key,
      required this.child,
      this.padding = const EdgeInsets.all(16),
      this.margin});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: margin,
      child: Padding(padding: padding, child: child),
    );
  }
}
