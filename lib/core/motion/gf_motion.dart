// ========================================
// GolfFox Motion v11.0 - Clear Theme
// Centralized durations, curves, and transitions
// ========================================

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class GfMotion {
  // Standard durations (300-500ms)
  static const Duration short = Duration(milliseconds: 300);
  static const Duration medium = Duration(milliseconds: 400);
  static const Duration long = Duration(milliseconds: 500);

  // Curvas premium
  static const Curve easeOut = Curves.easeOutCubic;
  static const Curve easeInOut = Curves.easeInOutCubic;

  // Default page transition (fade + slide)
  static CustomTransitionPage<T> transitionPage<T>({
    required Widget child,
    Duration duration = medium,
    Curve curve = easeInOut,
  }) {
    return CustomTransitionPage<T>(
      child: child,
      transitionDuration: duration,
      reverseTransitionDuration: duration,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        final curved = CurvedAnimation(parent: animation, curve: curve);
        final slide =
            Tween<Offset>(begin: const Offset(0.02, 0), end: Offset.zero)
                .animate(curved);
        final fade = Tween<double>(begin: 0.0, end: 1.0).animate(curved);
        return FadeTransition(
          opacity: fade,
          child: SlideTransition(position: slide, child: child),
        );
      },
    );
  }
}

/// Wrapper that adds subtle hover/press scale + shadow micro-interactions
class GfHoverScale extends StatefulWidget {
  final Widget child;
  final double hoverScale;
  final double pressScale;
  final Duration duration;
  final EdgeInsets? padding;
  final bool enableShadow;

  const GfHoverScale({
    super.key,
    required this.child,
    this.hoverScale = 1.02,
    this.pressScale = 0.98,
    this.duration = GfMotion.short,
    this.padding,
    this.enableShadow = false,
  });

  @override
  State<GfHoverScale> createState() => _GfHoverScaleState();
}

class _GfHoverScaleState extends State<GfHoverScale> {
  bool _hovering = false;
  bool _pressing = false;

  @override
  Widget build(BuildContext context) {
    final double targetScale =
        _pressing ? widget.pressScale : (_hovering ? widget.hoverScale : 1.0);

    final child = AnimatedScale(
      scale: targetScale,
      duration: widget.duration,
      curve: GfMotion.easeOut,
      child: AnimatedContainer(
        duration: widget.duration,
        curve: GfMotion.easeOut,
        padding: widget.padding,
        decoration: widget.enableShadow && (_hovering || _pressing)
            ? BoxDecoration(
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.06),
                    blurRadius: 12,
                    spreadRadius: 0,
                    offset: const Offset(0, 8),
                  ),
                ],
              )
            : null,
        child: widget.child,
      ),
    );

    return MouseRegion(
      onEnter: (_) => setState(() => _hovering = true),
      onExit: (_) => setState(() {
        _hovering = false;
        _pressing = false;
      }),
      child: Listener(
        onPointerDown: (_) => setState(() => _pressing = true),
        onPointerUp: (_) => setState(() => _pressing = false),
        child: child,
      ),
    );
  }
}
