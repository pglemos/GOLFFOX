// ========================================
// GolfFox Hover Scale Widget
// Widget de escala no hover
// ========================================

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

class GfHoverScale extends StatefulWidget {

  const GfHoverScale({
    required this.child,
    super.key,
    this.scale = 1.05,
    this.duration = const Duration(milliseconds: 200),
    this.onTap,
  });
  final Widget child;
  final double scale;
  final Duration duration;
  final VoidCallback? onTap;

  @override
  State<GfHoverScale> createState() => _GfHoverScaleState();
}

class _GfHoverScaleState extends State<GfHoverScale>
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
      end: widget.scale,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onEnter(PointerEnterEvent event) {
    if (!_isHovered) {
      _isHovered = true;
      _controller.forward();
    }
  }

  void _onExit(PointerExitEvent event) {
    if (_isHovered) {
      _isHovered = false;
      _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) => MouseRegion(
      onEnter: _onEnter,
      onExit: _onExit,
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedBuilder(
          animation: _scaleAnimation,
          builder: (context, child) => Transform.scale(
            scale: _scaleAnimation.value,
            child: widget.child,
          ),
        ),
      ),
    );
}
