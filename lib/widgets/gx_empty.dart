import 'package:flutter/material.dart';

import '../core/theme/gf_tokens.dart';

class GxEmpty extends StatefulWidget {

  const GxEmpty({
    super.key,
    this.icon = Icons.inbox_outlined,
    required this.title,
    this.message,
    this.action,
    this.iconColor,
    this.iconSize = 64,
    this.animated = true,
    this.padding,
  });
  final IconData icon;
  final String title;
  final String? message;
  final Widget? action;
  final Color? iconColor;
  final double iconSize;
  final bool animated;
  final EdgeInsetsGeometry? padding;

  @override
  State<GxEmpty> createState() => _GxEmptyState();
}

class _GxEmptyState extends State<GxEmpty> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: GfTokens.durationSlower,
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0, 0.6, curve: Curves.easeOut),
    ));

    _scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.2, 1, curve: Curves.elasticOut),
    ));

    if (widget.animated) {
      _animationController.forward();
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final Widget content = Center(
      child: Padding(
        padding: widget.padding ?? const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color:
                    colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                widget.icon,
                size: widget.iconSize,
                color: widget.iconColor ?? colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              widget.title,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
                color: colorScheme.onSurface,
              ),
              textAlign: TextAlign.center,
            ),
            if (widget.message != null) ...[
              const SizedBox(height: 8),
              Text(
                widget.message!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            if (widget.action != null) ...[
              const SizedBox(height: 24),
              widget.action!,
            ],
          ],
        ),
      ),
    );

    if (!widget.animated) {
      return content;
    }

    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) => FadeTransition(
          opacity: _fadeAnimation,
          child: ScaleTransition(
            scale: _scaleAnimation,
            child: content,
          ),
        ),
    );
  }
}
