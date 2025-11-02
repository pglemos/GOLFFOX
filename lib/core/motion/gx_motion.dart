import 'dart:ui' show Offset;

import 'package:flutter/animation.dart' show Curve, Curves;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/gf_tokens.dart';

/// GolfFox Motion System
/// Inspired by Apple's fluid animations and Tesla's smooth transitions
extension GxMotion on Widget {
  /// Fade in with slide from bottom (Apple-style)
  Widget fadeInUp({
    Duration? delay,
    Duration? duration,
  }) =>
      this
          .animate(delay: delay ?? Duration.zero)
          .slideY(
            begin: 0.3,
            end: 0,
            duration: duration ?? GfTokens.durationSlow,
            curve: Curves.easeOutCubic,
          )
          .fadeIn(
            duration: duration ?? GfTokens.durationSlow,
            curve: Curves.easeOut,
          );

  /// Fade in with slide from right (Tesla-style)
  Widget fadeInRight({
    Duration? delay,
    Duration? duration,
  }) =>
      this
          .animate(delay: delay ?? Duration.zero)
          .slideX(
            begin: 0.3,
            end: 0,
            duration: duration ?? GfTokens.duration,
            curve: Curves.easeOutCubic,
          )
          .fadeIn(
            duration: duration ?? GfTokens.duration,
            curve: Curves.easeOut,
          );

  /// Scale in with bounce (Nubank-style)
  Widget scaleIn({
    Duration? delay,
    Duration? duration,
  }) =>
      this
          .animate(delay: delay ?? Duration.zero)
          .scale(
            begin: const Offset(0.8, 0.8),
            end: const Offset(1.0, 1.0),
            duration: duration ?? GfTokens.durationFast,
            curve: Curves.elasticOut,
          )
          .fadeIn(
            duration: duration ?? GfTokens.durationFast,
            curve: Curves.easeOut,
          );

  /// Shimmer loading effect
  Widget shimmer({Duration? duration}) => this
      .animate(onPlay: (controller) => controller.repeat())
      .fadeIn(duration: GfTokens.durationSlow)
      .then(delay: duration ?? const Duration(milliseconds: 800))
      .fadeOut(
        duration: GfTokens.duration,
      );

  /// Stagger animation for lists
  Widget staggerIn({
    Duration? delay,
    Duration? duration,
  }) =>
      this
          .animate(delay: delay ?? Duration.zero)
          .fadeIn(duration: GfTokens.durationFast)
          .slideY(
            begin: 0.2,
            end: 0,
            duration: duration ?? GfTokens.duration,
            curve: Curves.easeOutCubic,
          );

  /// Pulse animation for attention
  Widget pulse({
    Duration? duration,
    double? scale,
  }) =>
      this
          .animate(onPlay: (controller) => controller.repeat(reverse: true))
          .scale(
            begin: const Offset(1.0, 1.0),
            end: Offset(scale ?? 1.05, scale ?? 1.05),
            duration: duration ?? GfTokens.durationSlower,
            curve: Curves.easeInOut,
          );

  /// Bounce animation for interactions
  Widget bounce({Duration? duration}) => this
      .animate(onPlay: (controller) => controller.forward())
      .scale(
        begin: const Offset(1.0, 1.0),
        end: const Offset(0.95, 0.95),
        duration: duration ?? GfTokens.durationFast,
        curve: Curves.easeInOut,
      )
      .then()
      .scale(
        begin: const Offset(0.95, 0.95),
        end: const Offset(1.0, 1.0),
        duration: duration ?? GfTokens.durationFast,
        curve: Curves.elasticOut,
      );

  /// Slide in from left
  Widget slideInLeft({
    Duration? delay,
    Duration? duration,
  }) =>
      this
          .animate(delay: delay ?? Duration.zero)
          .slideX(
            begin: -1.0,
            end: 0,
            duration: duration ?? GfTokens.duration,
            curve: Curves.easeOutCubic,
          )
          .fadeIn(
            duration: duration ?? GfTokens.duration,
            curve: Curves.easeOut,
          );

  /// Slide in from top
  Widget slideInTop({
    Duration? delay,
    Duration? duration,
  }) =>
      this
          .animate(delay: delay ?? Duration.zero)
          .slideY(
            begin: -1.0,
            end: 0,
            duration: duration ?? GfTokens.durationSlow,
            curve: Curves.easeOutCubic,
          )
          .fadeIn(duration: GfTokens.durationSlow)
          .then()
          .fadeIn(
            duration: duration ?? GfTokens.durationSlow,
            curve: Curves.easeOut,
          );
}

/// Motion timing utilities
class GxTiming {
  static Duration get fast => GfTokens.durationFast;
  static Duration get normal => GfTokens.duration;
  static Duration get slow => GfTokens.durationSlow;
  static Duration get slower => GfTokens.durationSlower;
}
