import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';

/// Sistema avancado de microinteracoes para feedback visual premium
class MicroInteractions {
  /// Feedback haptico baseado no tipo de interacao
  static void hapticFeedback(HapticType type) {
    switch (type) {
      case HapticType.light:
        HapticFeedback.lightImpact();
        break;
      case HapticType.medium:
        HapticFeedback.mediumImpact();
        break;
      case HapticType.heavy:
        HapticFeedback.heavyImpact();
        break;
      case HapticType.selection:
        HapticFeedback.selectionClick();
        break;
      case HapticType.vibrate:
        HapticFeedback.vibrate();
        break;
    }
  }
}

enum HapticType { light, medium, heavy, selection, vibrate }

/// Widget para botoes com microinteracoes premium
class InteractiveButton extends StatefulWidget {

  const InteractiveButton({
    required this.child,
    super.key,
    this.onPressed,
    this.backgroundColor,
    this.foregroundColor,
    this.padding,
    this.borderRadius,
    this.elevation,
    this.hapticType = HapticType.light,
    this.enableRipple = true,
    this.enableScale = true,
    this.enableGlow = false,
  });
  final Widget child;
  final VoidCallback? onPressed;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final EdgeInsetsGeometry? padding;
  final BorderRadius? borderRadius;
  final double? elevation;
  final HapticType hapticType;
  final bool enableRipple;
  final bool enableScale;
  final bool enableGlow;

  @override
  State<InteractiveButton> createState() => _InteractiveButtonState();
}

class _InteractiveButtonState extends State<InteractiveButton>
    with TickerProviderStateMixin {
  late AnimationController _scaleController;
  late AnimationController _glowController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();

    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );

    _glowController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1,
      end: 0.95,
    ).animate(CurvedAnimation(
      parent: _scaleController,
      curve: Curves.easeInOut,
    ));

    _glowAnimation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(
      parent: _glowController,
      curve: Curves.easeOut,
    ));
  }

  @override
  void dispose() {
    _scaleController.dispose();
    _glowController.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    if (widget.onPressed != null) {
      if (widget.enableScale) {
        _scaleController.forward();
      }

      if (widget.enableGlow) {
        _glowController.forward();
      }

      MicroInteractions.hapticFeedback(widget.hapticType);
    }
  }

  void _handleTapUp(TapUpDetails details) => _handleTapEnd();

  void _handleTapCancel() => _handleTapEnd();

  void _handleTapEnd() {
    if (widget.enableScale) {
      _scaleController.reverse();
    }

    if (widget.enableGlow) {
      _glowController.reverse();
    }
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
      onTapDown: _handleTapDown,
      onTapUp: _handleTapUp,
      onTapCancel: _handleTapCancel,
      onTap: widget.enableRipple ? null : widget.onPressed,
      child: AnimatedBuilder(
        animation: Listenable.merge([_scaleAnimation, _glowAnimation]),
        builder: (context, child) => Transform.scale(
          scale: widget.enableScale ? _scaleAnimation.value : 1.0,
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: widget.backgroundColor,
              borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
              boxShadow: [
                if (widget.elevation != null)
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: widget.elevation! * 2,
                    offset: Offset(0, widget.elevation!),
                  ),
                if (widget.enableGlow && _glowAnimation.value > 0)
                  BoxShadow(
                    color: (widget.backgroundColor ??
                            Theme.of(context).primaryColor)
                        .withValues(alpha: _glowAnimation.value * 0.3),
                    blurRadius: 20 * _glowAnimation.value,
                    spreadRadius: 5 * _glowAnimation.value,
                  ),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
                onTap: widget.enableRipple ? widget.onPressed : null,
                child: Padding(
                  padding: widget.padding ?? const EdgeInsets.all(16),
                  child: DefaultTextStyle(
                    style: TextStyle(
                      color: widget.foregroundColor ?? Colors.white,
                    ),
                    child: widget.child,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
}

/// Widget para cards com microinteracoes
class InteractiveCard extends StatefulWidget {

  const InteractiveCard({
    required this.child,
    super.key,
    this.onTap,
    this.backgroundColor,
    this.padding,
    this.margin,
    this.borderRadius,
    this.elevation,
    this.enableHover = true,
    this.enableScale = true,
    this.enableShadow = true,
  });
  final Widget child;
  final VoidCallback? onTap;
  final Color? backgroundColor;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final BorderRadius? borderRadius;
  final double? elevation;
  final bool enableHover;
  final bool enableScale;
  final bool enableShadow;

  @override
  State<InteractiveCard> createState() => _InteractiveCardState();
}

class _InteractiveCardState extends State<InteractiveCard>
    with TickerProviderStateMixin {
  late AnimationController _hoverController;
  late Animation<double> _elevationAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();

    _hoverController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );

    _elevationAnimation = Tween<double>(
      begin: widget.elevation ?? 2,
      end: (widget.elevation ?? 2) * 2,
    ).animate(CurvedAnimation(
      parent: _hoverController,
      curve: Curves.easeOut,
    ));

    _scaleAnimation = Tween<double>(
      begin: 1,
      end: 1.02,
    ).animate(CurvedAnimation(
      parent: _hoverController,
      curve: Curves.easeOut,
    ));
  }

  @override
  void dispose() {
    _hoverController.dispose();
    super.dispose();
  }

  void _handleHover(bool isHovered) {
    if (widget.enableHover && widget.onTap != null) {
      if (isHovered) {
        _hoverController.forward();
      } else {
        _hoverController.reverse();
      }
    }
  }

  @override
  Widget build(BuildContext context) => MouseRegion(
      onEnter: (_) => _handleHover(true),
      onExit: (_) => _handleHover(false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedBuilder(
          animation: _hoverController,
        builder: (context, child) {
          final decoration = BoxDecoration(
            color: widget.backgroundColor ?? Colors.white,
            borderRadius: widget.borderRadius ?? BorderRadius.circular(12),
            boxShadow: widget.enableShadow
                ? [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: _elevationAnimation.value * 2,
                      offset: Offset(0, _elevationAnimation.value),
                    ),
                  ]
                : null,
          );

          Widget content = DecoratedBox(
            decoration: decoration,
            child: Padding(
              padding: widget.padding ?? const EdgeInsets.all(16),
              child: widget.child,
            ),
          );

          if (widget.margin != null) {
            content = Padding(
              padding: widget.margin!,
              child: content,
            );
          }

          return Transform.scale(
            scale: widget.enableScale ? _scaleAnimation.value : 1.0,
            child: content,
          );
        },
        ),
      ),
    );
}

/// Widget para inputs com microinteracoes
class InteractiveInput extends StatefulWidget {

  const InteractiveInput({
    super.key,
    this.controller,
    this.labelText,
    this.hintText,
    this.prefixIcon,
    this.suffixIcon,
    this.obscureText = false,
    this.keyboardType,
    this.validator,
    this.onChanged,
    this.onTap,
    this.enabled = true,
    this.maxLines = 1,
    this.focusColor,
    this.borderColor,
  });
  final TextEditingController? controller;
  final String? labelText;
  final String? hintText;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final bool obscureText;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final VoidCallback? onTap;
  final bool enabled;
  final int? maxLines;
  final Color? focusColor;
  final Color? borderColor;

  @override
  State<InteractiveInput> createState() => _InteractiveInputState();
}

class _InteractiveInputState extends State<InteractiveInput>
    with TickerProviderStateMixin {
  late AnimationController _focusController;
  late Animation<double> _focusAnimation;
  late Animation<Color?> _borderColorAnimation;

  final FocusNode _focusNode = FocusNode();
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();

    _focusController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );

    _focusAnimation = Tween<double>(
      begin: 1,
      end: 1.02,
    ).animate(CurvedAnimation(
      parent: _focusController,
      curve: Curves.easeOut,
    ));

    _borderColorAnimation = ColorTween(
      begin: widget.borderColor ?? Colors.grey.shade300,
      end: widget.focusColor ?? Theme.of(context).primaryColor,
    ).animate(CurvedAnimation(
      parent: _focusController,
      curve: Curves.easeOut,
    ));

    _focusNode.addListener(_handleFocusChange);
  }

  @override
  void dispose() {
    _focusController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _handleFocusChange() {
    final isFocused = _focusNode.hasFocus;
    if (_isFocused != isFocused) {
      setState(() => _isFocused = isFocused);

      if (isFocused) {
        _focusController.forward();
        MicroInteractions.hapticFeedback(HapticType.light);
      } else {
        _focusController.reverse();
      }
    }
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
      animation: _focusController,
      builder: (context, child) => Transform.scale(
        scale: _focusAnimation.value,
        child: TextFormField(
          controller: widget.controller,
          focusNode: _focusNode,
          obscureText: widget.obscureText,
          keyboardType: widget.keyboardType,
          validator: widget.validator,
          onChanged: widget.onChanged,
          onTap: widget.onTap,
          enabled: widget.enabled,
          maxLines: widget.maxLines,
          decoration: InputDecoration(
            labelText: widget.labelText,
            hintText: widget.hintText,
            prefixIcon: widget.prefixIcon,
            suffixIcon: widget.suffixIcon,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: _borderColorAnimation.value ?? Colors.grey.shade300,
                width: _isFocused ? 2 : 1,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: widget.borderColor ?? Colors.grey.shade300,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: widget.focusColor ?? Theme.of(context).primaryColor,
                width: 2,
              ),
            ),
          ),
        ),
      ),
    );
}

/// Extensoes para microinteracoes rapidas
extension MicroInteractionExtensions on Widget {
  /// Adiciona efeito de pulse
  Widget pulse({Duration? duration, double scale = 1.1}) => animate(onPlay: (controller) => controller.repeat(reverse: true))
        .scaleXY(
      end: scale,
      duration: duration ?? const Duration(milliseconds: 1000),
      curve: Curves.easeInOut,
    );

  /// Adiciona efeito de breathing (respiracao)
  Widget breathe({Duration? duration}) => animate(onPlay: (controller) => controller.repeat(reverse: true))
        .fadeIn(
      duration: duration ?? const Duration(milliseconds: 2000),
      curve: Curves.easeInOut,
    );

  /// Adiciona efeito de glow
  Widget glow({Color? color, double intensity = 0.3}) => DecoratedBox(
      decoration: BoxDecoration(
        boxShadow: [
          BoxShadow(
            color: (color ?? Colors.blue).withValues(alpha: intensity),
            blurRadius: 20,
            spreadRadius: 5,
          ),
        ],
      ),
      child: this,
    );

  /// Adiciona feedback tatil ao toque
  Widget withHapticFeedback({HapticType type = HapticType.light}) => GestureDetector(
      onTap: () => MicroInteractions.hapticFeedback(type),
      child: this,
    );
}
