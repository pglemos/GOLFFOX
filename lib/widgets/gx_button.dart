import 'package:flutter/material.dart';

enum GxButtonVariant {
  filled,
  outlined,
  text,
  elevated,
}

enum GxButtonSize {
  small,
  medium,
  large,
}

class GxButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool primary;
  final bool loading;
  final GxButtonVariant variant;
  final GxButtonSize size;
  final Color? color;
  final Color? textColor;
  final double? elevation;
  final EdgeInsetsGeometry? padding;
  final bool fullWidth;

  const GxButton(
    this.label, {
    super.key,
    this.onPressed,
    this.icon,
    this.primary = true,
    this.loading = false,
    this.variant = GxButtonVariant.filled,
    this.size = GxButtonSize.medium,
    this.color,
    this.textColor,
    this.elevation,
    this.padding,
    this.fullWidth = false,
  });

  // Construtores nomeados para facilitar o uso
  const GxButton.outlined(
    this.label, {
    super.key,
    this.onPressed,
    this.icon,
    this.primary = true,
    this.loading = false,
    this.size = GxButtonSize.medium,
    this.color,
    this.textColor,
    this.padding,
    this.fullWidth = false,
  })  : variant = GxButtonVariant.outlined,
        elevation = null;

  const GxButton.text(
    this.label, {
    super.key,
    this.onPressed,
    this.icon,
    this.primary = true,
    this.loading = false,
    this.size = GxButtonSize.medium,
    this.color,
    this.textColor,
    this.padding,
    this.fullWidth = false,
  })  : variant = GxButtonVariant.text,
        elevation = null;

  const GxButton.elevated(
    this.label, {
    super.key,
    this.onPressed,
    this.icon,
    this.primary = true,
    this.loading = false,
    this.size = GxButtonSize.medium,
    this.color,
    this.textColor,
    this.elevation,
    this.padding,
    this.fullWidth = false,
  }) : variant = GxButtonVariant.elevated;

  EdgeInsetsGeometry _getPadding() {
    if (padding != null) return padding!;

    switch (size) {
      case GxButtonSize.small:
        return const EdgeInsets.symmetric(horizontal: 12, vertical: 8);
      case GxButtonSize.medium:
        return const EdgeInsets.symmetric(horizontal: 16, vertical: 12);
      case GxButtonSize.large:
        return const EdgeInsets.symmetric(horizontal: 20, vertical: 16);
    }
  }

  double _getIconSize() {
    switch (size) {
      case GxButtonSize.small:
        return 16;
      case GxButtonSize.medium:
        return 18;
      case GxButtonSize.large:
        return 20;
    }
  }

  double _getFontSize() {
    switch (size) {
      case GxButtonSize.small:
        return 12;
      case GxButtonSize.medium:
        return 14;
      case GxButtonSize.large:
        return 16;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final effectiveColor = color ??
        (primary ? colorScheme.primary : colorScheme.surfaceContainerHighest);
    final effectiveTextColor = textColor ??
        (primary ? colorScheme.onPrimary : colorScheme.onSurfaceVariant);

    final child = loading
        ? SizedBox(
            height: _getIconSize(),
            width: _getIconSize(),
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(
                variant == GxButtonVariant.text ||
                        variant == GxButtonVariant.outlined
                    ? effectiveColor
                    : effectiveTextColor,
              ),
            ),
          )
        : Row(
            mainAxisSize: fullWidth ? MainAxisSize.max : MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(
                  icon,
                  size: _getIconSize(),
                  color: variant == GxButtonVariant.text ||
                          variant == GxButtonVariant.outlined
                      ? effectiveColor
                      : effectiveTextColor,
                ),
                const SizedBox(width: 8),
              ],
              Text(
                label,
                style: TextStyle(
                  color: variant == GxButtonVariant.text ||
                          variant == GxButtonVariant.outlined
                      ? effectiveColor
                      : effectiveTextColor,
                  fontWeight: FontWeight.w600,
                  fontSize: _getFontSize(),
                ),
              ),
            ],
          );

    Widget button;

    switch (variant) {
      case GxButtonVariant.filled:
        button = FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: effectiveColor,
            foregroundColor: effectiveTextColor,
            padding: _getPadding(),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
          onPressed: loading ? null : onPressed,
          child: child,
        );
        break;

      case GxButtonVariant.outlined:
        button = OutlinedButton(
          style: OutlinedButton.styleFrom(
            foregroundColor: effectiveColor,
            padding: _getPadding(),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            side: BorderSide(color: effectiveColor, width: 1.5),
          ),
          onPressed: loading ? null : onPressed,
          child: child,
        );
        break;

      case GxButtonVariant.text:
        button = TextButton(
          style: TextButton.styleFrom(
            foregroundColor: effectiveColor,
            padding: _getPadding(),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          onPressed: loading ? null : onPressed,
          child: child,
        );
        break;

      case GxButtonVariant.elevated:
        button = ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: effectiveColor,
            foregroundColor: effectiveTextColor,
            padding: _getPadding(),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: elevation ?? 2,
          ),
          onPressed: loading ? null : onPressed,
          child: child,
        );
        break;
    }

    if (fullWidth) {
      return SizedBox(
        width: double.infinity,
        child: button,
      );
    }

    return button;
  }
}
