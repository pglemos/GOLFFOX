import 'package:flutter/material.dart';

class GxCard extends StatelessWidget {

  const GxCard({
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    super.key,
  });
  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) => Card(
      margin: margin,
      child: Padding(padding: padding, child: child),
    );
}
