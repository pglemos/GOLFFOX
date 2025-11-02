import 'package:flutter/material.dart';
import '../../../core/theme/unified_theme.dart';

class GfAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;
  final bool automaticallyImplyLeading;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double? elevation;
  final bool centerTitle;

  const GfAppBar({
    super.key,
    required this.title,
    this.actions,
    this.leading,
    this.automaticallyImplyLeading = true,
    this.backgroundColor,
    this.foregroundColor,
    this.elevation,
    this.centerTitle = true,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(
        title,
        style: TextStyle(
          color: foregroundColor ?? GolfFoxTheme.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      actions: actions,
      leading: leading,
      automaticallyImplyLeading: automaticallyImplyLeading,
      backgroundColor: backgroundColor ?? GolfFoxTheme.backgroundLight,
      foregroundColor: foregroundColor ?? GolfFoxTheme.textPrimary,
      elevation: elevation ?? 0,
      centerTitle: centerTitle,
      surfaceTintColor: Colors.transparent,
      shadowColor: Colors.transparent,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
