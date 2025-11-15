import 'package:flutter/material.dart';

enum GxButtonVariant { outlined, text, elevated }
enum GxButtonSize { small, medium, large }

class GxButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;
  final GxButtonVariant variant;
  final GxButtonSize size;
  final bool fullWidth;
  final bool primary;
  final Color? color;
  final Color? textColor;
  final EdgeInsets padding;

  const GxButton(
    this.label, {
    super.key,
    this.onPressed,
    this.icon,
    this.loading = false,
    this.variant = GxButtonVariant.elevated,
    this.size = GxButtonSize.medium,
    this.fullWidth = false,
    this.primary = true,
    this.color,
    this.textColor,
    this.padding = const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
  });

  const GxButton.outlined(
    this.label, {
    super.key,
    this.onPressed,
    this.icon,
    this.loading = false,
    this.size = GxButtonSize.medium,
    this.fullWidth = false,
    this.primary = true,
    this.color,
    this.textColor,
    this.padding = const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
  }) : variant = GxButtonVariant.outlined;

  const GxButton.text(
    this.label, {
    super.key,
    this.onPressed,
    this.icon,
    this.loading = false,
    this.size = GxButtonSize.medium,
    this.fullWidth = false,
    this.primary = true,
    this.color,
    this.textColor,
    this.padding = const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
  }) : variant = GxButtonVariant.text;

  const GxButton.elevated(
    this.label, {
    super.key,
    this.onPressed,
    this.icon,
    this.loading = false,
    this.size = GxButtonSize.medium,
    this.fullWidth = false,
    this.primary = true,
    this.color,
    this.textColor,
    this.padding = const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
  }) : variant = GxButtonVariant.elevated;

  ButtonStyle _style(BuildContext context) {
    double vPad = 12, hPad = 16;
    switch (size) {
      case GxButtonSize.small:
        vPad = 8;
        hPad = 12;
        break;
      case GxButtonSize.large:
        vPad = 16;
        hPad = 20;
        break;
      case GxButtonSize.medium:
        break;
    }
    final bgColor = color;
    final fgColor = textColor;
    final basePadding = EdgeInsets.symmetric(vertical: vPad, horizontal: hPad);
    switch (variant) {
      case GxButtonVariant.elevated:
        return ElevatedButton.styleFrom(
          backgroundColor: primary ? bgColor ?? Theme.of(context).colorScheme.primary : bgColor,
          foregroundColor: fgColor ?? Theme.of(context).colorScheme.onPrimary,
          padding: basePadding,
        );
      case GxButtonVariant.outlined:
        return OutlinedButton.styleFrom(
          foregroundColor: fgColor ?? Theme.of(context).colorScheme.primary,
          side: BorderSide(color: bgColor ?? Theme.of(context).colorScheme.primary),
          padding: basePadding,
        );
      case GxButtonVariant.text:
        return TextButton.styleFrom(
          foregroundColor: fgColor ?? Theme.of(context).colorScheme.primary,
          padding: basePadding,
        );
    }
  }

  Widget _child() {
    if (loading) {
      return const SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(strokeWidth: 2),
      );
    }
    final text = Text(label);
    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon),
          const SizedBox(width: 8),
          text,
        ],
      );
    }
    return text;
  }

  @override
  Widget build(BuildContext context) {
    final button = switch (variant) {
      GxButtonVariant.elevated => ElevatedButton(onPressed: onPressed, style: _style(context), child: _child()),
      GxButtonVariant.outlined => OutlinedButton(onPressed: onPressed, style: _style(context), child: _child()),
      GxButtonVariant.text => TextButton(onPressed: onPressed, style: _style(context), child: _child()),
    };
    final content = Padding(padding: padding, child: button);
    if (fullWidth) {
      return SizedBox(width: double.infinity, child: content);
    }
    return content;
  }
}

