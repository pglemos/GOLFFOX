import 'package:flutter/material.dart';

class GxSkeleton extends StatefulWidget {
  final double height;
  final double? width;
  final BorderRadius borderRadius;

  const GxSkeleton(
      {super.key,
      this.height = 16,
      this.width,
      this.borderRadius = const BorderRadius.all(Radius.circular(8))});

  @override
  State<GxSkeleton> createState() => _GxSkeletonState();
}

class _GxSkeletonState extends State<GxSkeleton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    _animation = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    _controller.repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          height: widget.height,
          width: widget.width,
          decoration: BoxDecoration(
            color:
                cs.surfaceContainerHighest.withValues(alpha: _animation.value),
            borderRadius: widget.borderRadius,
          ),
        );
      },
    );
  }
}
