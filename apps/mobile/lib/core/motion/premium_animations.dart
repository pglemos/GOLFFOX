// ========================================
// GolfFox Premium Animations v2.0
// Sistema completo de animacoes modernas
// Hardware accelerated, 60fps, multiplataforma
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// Sistema premium de animacoes com hardware acceleration
class PremiumAnimations {
  // Duracoes otimizadas para 60fps (300-500ms)
  static const Duration ultraFast = Duration(milliseconds: 150);
  static const Duration fast = Duration(milliseconds: 300);
  static const Duration medium = Duration(milliseconds: 400);
  static const Duration slow = Duration(milliseconds: 500);

  // Curvas premium inspiradas em Apple/Tesla/Google Material
  static const Curve smoothOut = Curves.easeOutCubic;
  static const Curve smoothInOut = Curves.easeInOutCubic;
  static const Curve spring = Curves.easeOutBack;
  static const Curve elastic = Curves.elasticOut;
  static const Curve bounce = Curves.bounceOut;

  /// Animacao de entrada de pagina com fade + slide otimizada
  static Widget pageTransition({
    required Widget child,
    Duration duration = medium,
    Curve curve = smoothInOut,
    Offset slideOffset = const Offset(0.03, 0),
  }) => child.animate().fadeIn(duration: duration, curve: curve).slideX(
          begin: slideOffset.dx,
          end: 0,
          duration: duration,
          curve: curve,
        );

  /// Microinteracao de botao com feedback haptico
  static Widget buttonPress({
    required Widget child,
    VoidCallback? onTap,
    Duration duration = ultraFast,
    double scaleDown = 0.95,
    bool enableHaptic = true,
  }) => GestureDetector(
      onTapDown: (_) {
        if (enableHaptic) HapticFeedback.lightImpact();
      },
      onTap: onTap,
      child: child
          .animate(onPlay: (controller) => controller.forward())
          .scaleXY(
            begin: 1,
            end: scaleDown,
            duration: duration,
            curve: Curves.easeInOut,
          )
          .then()
          .scaleXY(
            begin: scaleDown,
            end: 1,
            duration: duration,
            curve: spring,
          ),
    );

  /// Animacao de loading com rotacao suave
  static Widget loadingSpinner({
    required Widget child,
    Duration duration = const Duration(milliseconds: 1000),
  }) => child.animate(onPlay: (controller) => controller.repeat()).rotate(
          duration: duration,
          curve: Curves.linear,
        );

  /// Animacao de erro com shake + feedback haptico
  static Widget errorShake({
    required Widget child,
    Duration duration = medium,
    double offset = 8.0,
    bool enableHaptic = true,
  }) => child.animate(onPlay: (controller) {
      if (enableHaptic) HapticFeedback.heavyImpact();
      controller.forward();
    }).shake(
      duration: duration,
      hz: 4,
      offset: Offset(offset, 0),
    );

  /// Animacao de sucesso com bounce + feedback haptico
  static Widget successBounce({
    required Widget child,
    Duration duration = medium,
    bool enableHaptic = true,
  }) => child
        .animate(onPlay: (controller) {
          if (enableHaptic) HapticFeedback.mediumImpact();
          controller.forward();
        })
        .scaleXY(
          begin: 1,
          end: 1.1,
          duration: Duration(milliseconds: duration.inMilliseconds ~/ 2),
          curve: Curves.easeOut,
        )
        .then()
        .scaleXY(
          begin: 1.1,
          end: 1,
          duration: Duration(milliseconds: duration.inMilliseconds ~/ 2),
          curve: bounce,
        );
}

/// Widget para animacoes de entrada escalonadas (staggered)
class StaggeredAnimation extends StatelessWidget {

  const StaggeredAnimation({
    required this.children,
    super.key,
    this.delay = const Duration(milliseconds: 100),
    this.duration = PremiumAnimations.fast,
    this.curve = PremiumAnimations.smoothOut,
    this.direction = Axis.vertical,
  });
  final List<Widget> children;
  final Duration delay;
  final Duration duration;
  final Curve curve;
  final Axis direction;

  @override
  Widget build(BuildContext context) => Column(
      children: children.asMap().entries.map((entry) {
        final index = entry.key;
        final child = entry.value;

        return child
            .animate()
            .fadeIn(
              delay: Duration(milliseconds: index * delay.inMilliseconds),
              duration: duration,
              curve: curve,
            )
            .slideY(
              begin: direction == Axis.vertical ? 0.05 : 0,
              end: 0,
              delay: Duration(milliseconds: index * delay.inMilliseconds),
              duration: duration,
              curve: curve,
            )
            .slideX(
              begin: direction == Axis.horizontal ? 0.05 : 0,
              end: 0,
              delay: Duration(milliseconds: index * delay.inMilliseconds),
              duration: duration,
              curve: curve,
            );
      }).toList(),
    );
}

/// Widget para hover effects responsivos
class ResponsiveHover extends StatefulWidget {

  const ResponsiveHover({
    required this.child,
    super.key,
    this.hoverScale = 1.05,
    this.duration = PremiumAnimations.ultraFast,
    this.hoverColor,
    this.elevation = 4.0,
    this.enableOnMobile = false,
  });
  final Widget child;
  final double hoverScale;
  final Duration duration;
  final Color? hoverColor;
  final double elevation;
  final bool enableOnMobile;

  @override
  State<ResponsiveHover> createState() => _ResponsiveHoverState();
}

class _ResponsiveHoverState extends State<ResponsiveHover>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isHovered = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: widget.duration,
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1,
      end: widget.hoverScale,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: PremiumAnimations.smoothInOut,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onHover(bool isHovered) {
    // SA3 aplica hover em desktop/web
    if (!widget.enableOnMobile &&
        (Theme.of(context).platform == TargetPlatform.android ||
            Theme.of(context).platform == TargetPlatform.iOS)) {
      return;
    }

    setState(() => _isHovered = isHovered);
    if (isHovered) {
      _controller.forward();
      HapticFeedback.selectionClick();
    } else {
      _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) => MouseRegion(
      onEnter: (_) => _onHover(true),
      onExit: (_) => _onHover(false),
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) => Transform.scale(
          scale: _scaleAnimation.value,
          child: AnimatedContainer(
            duration: widget.duration,
            decoration: BoxDecoration(
              boxShadow: _isHovered
                  ? [
                      BoxShadow(
      color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: widget.elevation * 2,
                        offset: Offset(0, widget.elevation),
                      ),
                    ]
                  : null,
            ),
            child: widget.child,
          ),
        ),
      ),
    );
}

/// ExtensAes para animacoes premium
extension PremiumAnimationExtensions on Widget {
  /// Animacao de entrada premium
  Widget premiumEntrance({
    Duration delay = Duration.zero,
    Duration duration = PremiumAnimations.medium,
  }) => animate(delay: delay)
        .fadeIn(duration: duration, curve: PremiumAnimations.smoothOut)
        .slideY(
          begin: 0.03,
          end: 0,
          duration: duration,
          curve: PremiumAnimations.smoothOut,
        )
        .scaleXY(
          begin: 0.95,
          end: 1,
          duration: duration,
          curve: PremiumAnimations.spring,
        );

  /// Animacao de card premium
  Widget premiumCard({
    Duration delay = Duration.zero,
    Duration duration = PremiumAnimations.fast,
  }) => animate(delay: delay).fadeIn(duration: duration).slideY(
          begin: 0.02,
          end: 0,
          duration: duration,
          curve: PremiumAnimations.smoothOut,
        );

  /// Animacao de modal premium
  Widget premiumModal({
    Duration duration = PremiumAnimations.medium,
  }) => animate().fadeIn(duration: duration).scaleXY(
          begin: 0.9,
          end: 1,
          duration: duration,
          curve: PremiumAnimations.spring,
        );
}
