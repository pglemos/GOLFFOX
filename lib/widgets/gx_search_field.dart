import 'package:flutter/material.dart';

class GxSearchField extends StatelessWidget {
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final String hint;

  const GxSearchField(
      {super.key, this.controller, this.onChanged, this.hint = 'Buscar...'});

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return TextField(
      controller: controller,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(Icons.search, color: t.colorScheme.primary),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        filled: true,
      ),
    );
  }
}
