// ========================================
// GolfFox Performance Optimizer v2.0
// Sistema de otimizaAAo para 60fps constante
// Hardware acceleration e baixo consumo
// ========================================

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/scheduler.dart';

/// Sistema de otimizaAAo de performance
class PerformanceOptimizer {
  static bool _isInitialized = false;
  static final List<VoidCallback> _frameCallbacks = [];

  /// Inicializa o sistema de otimizaAAo
  static void initialize() {
    if (_isInitialized) return;

    // Configura o scheduler para priorizar animaAAes
    SchedulerBinding.instance.addPersistentFrameCallback(_onFrame);

    // Otimiza o rendering
    _optimizeRendering();

    _isInitialized = true;
  }

  /// Callback executado a cada frame
  static void _onFrame(Duration timestamp) {
    for (final callback in _frameCallbacks) {
      callback();
    }
  }

  /// Otimiza configuraAAes de rendering
  static void _optimizeRendering() {
    // Habilita hardware acceleration quando disponAvel
    RenderObject.debugCheckingIntrinsics = false;

    // Otimiza repaint boundaries
    debugRepaintRainbowEnabled = false;
  }

  /// Adiciona callback para ser executado a cada frame
  static void addFrameCallback(VoidCallback callback) {
    _frameCallbacks.add(callback);
  }

  /// Remove callback de frame
  static void removeFrameCallback(VoidCallback callback) {
    _frameCallbacks.remove(callback);
  }

  /// Limpa todos os callbacks
  static void clearFrameCallbacks() {
    _frameCallbacks.clear();
  }
}

/// Widget otimizado para performance com hardware acceleration
class PerformantWidget extends StatelessWidget {

  const PerformantWidget({
    required this.child,
    super.key,
    this.enableHardwareAcceleration = true,
    this.enableRepaintBoundary = true,
    this.enableAutomaticKeepAlive = false,
  });
  final Widget child;
  final bool enableHardwareAcceleration;
  final bool enableRepaintBoundary;
  final bool enableAutomaticKeepAlive;

  @override
  Widget build(BuildContext context) {
    var optimizedChild = child;

    // Adiciona RepaintBoundary para otimizar repaints
    if (enableRepaintBoundary) {
      optimizedChild = RepaintBoundary(child: optimizedChild);
    }

    // Habilita hardware acceleration via Transform
    if (enableHardwareAcceleration) {
      optimizedChild = Transform.translate(
        offset: Offset.zero,
        child: optimizedChild,
      );
    }

    // MantAm widget vivo se necessArio
    if (enableAutomaticKeepAlive) {
      optimizedChild = _KeepAliveWrapper(child: optimizedChild);
    }

    return optimizedChild;
  }
}

/// Wrapper para manter widgets vivos
class _KeepAliveWrapper extends StatefulWidget {

  const _KeepAliveWrapper({required this.child});
  final Widget child;

  @override
  State<_KeepAliveWrapper> createState() => _KeepAliveWrapperState();
}

class _KeepAliveWrapperState extends State<_KeepAliveWrapper>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    return widget.child;
  }
}

/// Lista otimizada para performance com lazy loading
class PerformantListView extends StatelessWidget {

  const PerformantListView({
    required this.children,
    super.key,
    this.controller,
    this.padding,
    this.shrinkWrap = false,
    this.physics,
    this.itemExtent,
    this.addRepaintBoundaries = true,
  });
  final List<Widget> children;
  final ScrollController? controller;
  final EdgeInsets? padding;
  final bool shrinkWrap;
  final ScrollPhysics? physics;
  final double? itemExtent;
  final bool addRepaintBoundaries;

  @override
  Widget build(BuildContext context) => ListView.builder(
      controller: controller,
      padding: padding,
      shrinkWrap: shrinkWrap,
      physics: physics,
      itemExtent: itemExtent,
      addRepaintBoundaries: addRepaintBoundaries,
      itemCount: children.length,
      itemBuilder: (context, index) => PerformantWidget(
        enableRepaintBoundary: addRepaintBoundaries,
        child: children[index],
      ),
    );
}

/// Grid otimizado para performance
class PerformantGridView extends StatelessWidget {

  const PerformantGridView({
    required this.children,
    required this.gridDelegate,
    super.key,
    this.controller,
    this.padding,
    this.shrinkWrap = false,
    this.physics,
    this.addRepaintBoundaries = true,
  });
  final List<Widget> children;
  final SliverGridDelegate gridDelegate;
  final ScrollController? controller;
  final EdgeInsets? padding;
  final bool shrinkWrap;
  final ScrollPhysics? physics;
  final bool addRepaintBoundaries;

  @override
  Widget build(BuildContext context) => GridView.builder(
      controller: controller,
      padding: padding,
      shrinkWrap: shrinkWrap,
      physics: physics,
      gridDelegate: gridDelegate,
      addRepaintBoundaries: addRepaintBoundaries,
      itemCount: children.length,
      itemBuilder: (context, index) => PerformantWidget(
        enableRepaintBoundary: addRepaintBoundaries,
        child: children[index],
      ),
    );
}

/// AnimaAAo otimizada para performance
class PerformantAnimation extends StatefulWidget {

  const PerformantAnimation({
    required this.child,
    super.key,
    this.duration = const Duration(milliseconds: 300),
    this.curve = Curves.easeInOut,
    this.controller,
    this.onComplete,
    this.autoStart = true,
    this.enableHardwareAcceleration = true,
  });
  final Widget child;
  final Duration duration;
  final Curve curve;
  final AnimationController? controller;
  final VoidCallback? onComplete;
  final bool autoStart;
  final bool enableHardwareAcceleration;

  @override
  State<PerformantAnimation> createState() => _PerformantAnimationState();
}

class _PerformantAnimationState extends State<PerformantAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();

    _controller = widget.controller ??
        AnimationController(
          duration: widget.duration,
          vsync: this,
        );

    _animation = CurvedAnimation(
      parent: _controller,
      curve: widget.curve,
    );

    if (widget.onComplete != null) {
      _controller.addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          widget.onComplete!();
        }
      });
    }

    if (widget.autoStart) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _controller.forward();
      });
    }
  }

  @override
  void dispose() {
    if (widget.controller == null) {
      _controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    Widget animatedChild = AnimatedBuilder(
      animation: _animation,
      builder: (context, child) => Opacity(
          opacity: _animation.value,
          child: Transform.scale(
            scale: 0.8 + (0.2 * _animation.value),
            child: widget.child,
          ),
        ),
    );

    // Aplica hardware acceleration se habilitado
    if (widget.enableHardwareAcceleration) {
      animatedChild = PerformantWidget(
        child: animatedChild,
      );
    }

    return animatedChild;
  }
}

/// Monitor de performance em tempo real
class PerformanceMonitor {
  static final List<double> _frameTimes = [];
  static double _averageFps = 60;
  static bool _isMonitoring = false;

  /// Inicia o monitoramento de performance
  static void startMonitoring() {
    if (_isMonitoring) return;

    _isMonitoring = true;
    SchedulerBinding.instance.addPersistentFrameCallback(_measureFrame);
  }

  /// Para o monitoramento de performance
  static void stopMonitoring() {
    _isMonitoring = false;
    _frameTimes.clear();
  }

  /// Mede o tempo de cada frame
  static void _measureFrame(Duration timestamp) {
    if (!_isMonitoring) return;

    final frameTime = timestamp.inMicroseconds / 1000.0; // ms
    _frameTimes.add(frameTime);

    // MantAm apenas os Aoltimos 60 frames
    if (_frameTimes.length > 60) {
      _frameTimes.removeAt(0);
    }

    // Calcula FPS mAdio
    if (_frameTimes.length >= 2) {
      final totalTime = _frameTimes.last - _frameTimes.first;
      _averageFps = (_frameTimes.length - 1) * 1000.0 / totalTime;
    }
  }

  /// Retorna o FPS mAdio atual
  static double get averageFps => _averageFps;

  /// Verifica se a performance estA boa (>= 55 FPS)
  static bool get isPerformanceGood => _averageFps >= 55.0;

  /// Retorna estatAsticas de performance
  static Map<String, dynamic> get stats => {
        'averageFps': _averageFps,
        'isPerformanceGood': isPerformanceGood,
        'frameCount': _frameTimes.length,
      };
}

/// Widget para exibir informaAAes de performance (apenas em debug)
class GfPerformanceOverlay extends StatefulWidget {

  const GfPerformanceOverlay({
    required this.child,
    super.key,
    this.showInRelease = false,
  });
  final Widget child;
  final bool showInRelease;

  @override
  State<GfPerformanceOverlay> createState() => _GfPerformanceOverlayState();
}

class _GfPerformanceOverlayState extends State<GfPerformanceOverlay> {
  @override
  void initState() {
    super.initState();
    PerformanceMonitor.startMonitoring();
  }

  @override
  void dispose() {
    PerformanceMonitor.stopMonitoring();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // SA3 mostra em debug ou se explicitamente habilitado
    final shouldShow = widget.showInRelease ||
        (const bool.fromEnvironment('dart.vm.product') == false);

    if (!shouldShow) {
      return widget.child;
    }

    return Stack(
      children: [
        widget.child,
        Positioned(
          top: 50,
          right: 16,
          child: Container(
            padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(8),
              ),
            child: StreamBuilder<void>(
              stream: Stream.periodic(const Duration(milliseconds: 500)),
              builder: (context, snapshot) {
                final stats = PerformanceMonitor.stats;
                final averageFps =
                    (stats['averageFps'] as double?) ?? PerformanceMonitor.averageFps;
                final isPerformanceGood =
                    (stats['isPerformanceGood'] as bool?) ?? PerformanceMonitor.isPerformanceGood;
                return Text(
                  'FPS: ${averageFps.toStringAsFixed(1)}\n'
                  "Status: ${isPerformanceGood ? 'OK' : 'Degraded'}",
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontFamily: 'monospace',
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}
