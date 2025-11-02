import 'package:flutter/material.dart';

class GxAvatar extends StatelessWidget {
  final String? imageUrl;
  final String? name;
  final double size;
  final Color? backgroundColor;
  final Color? textColor;
  final VoidCallback? onTap;
  final bool showBorder;
  final Color? borderColor;
  final double borderWidth;
  final IconData? fallbackIcon;

  const GxAvatar({
    super.key,
    this.imageUrl,
    this.name,
    this.size = 40,
    this.backgroundColor,
    this.textColor,
    this.onTap,
    this.showBorder = false,
    this.borderColor,
    this.borderWidth = 2,
    this.fallbackIcon,
  });

  String _getInitials(String name) {
    final words = name.trim().split(' ');
    if (words.isEmpty) return '?';
    if (words.length == 1) {
      return words[0].substring(0, 1).toUpperCase();
    }
    return '${words[0].substring(0, 1)}${words[1].substring(0, 1)}'
        .toUpperCase();
  }

  Color _generateColorFromName(String name) {
    final colors = [
      Colors.red,
      Colors.pink,
      Colors.purple,
      Colors.deepPurple,
      Colors.indigo,
      Colors.blue,
      Colors.lightBlue,
      Colors.cyan,
      Colors.teal,
      Colors.green,
      Colors.lightGreen,
      Colors.lime,
      Colors.yellow,
      Colors.amber,
      Colors.orange,
      Colors.deepOrange,
    ];

    final hash = name.hashCode;
    return colors[hash.abs() % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final effectiveBackgroundColor = backgroundColor ??
        (name != null
            ? _generateColorFromName(name!)
            : colorScheme.surfaceContainerHighest);

    final effectiveTextColor = textColor ??
        (backgroundColor != null
            ? (ThemeData.estimateBrightnessForColor(backgroundColor!) ==
                    Brightness.dark
                ? Colors.white
                : Colors.black87)
            : Colors.white);

    Widget avatar = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: effectiveBackgroundColor,
        shape: BoxShape.circle,
        border: showBorder
            ? Border.all(
                color: borderColor ?? colorScheme.outline,
                width: borderWidth,
              )
            : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipOval(
        child: imageUrl != null && imageUrl!.isNotEmpty
            ? Image.network(
                imageUrl!,
                width: size,
                height: size,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return _buildFallback(effectiveTextColor);
                },
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Container(
                    width: size,
                    height: size,
                    color: effectiveBackgroundColor,
                    child: Center(
                      child: SizedBox(
                        width: size * 0.4,
                        height: size * 0.4,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(effectiveTextColor),
                        ),
                      ),
                    ),
                  );
                },
              )
            : _buildFallback(effectiveTextColor),
      ),
    );

    if (onTap != null) {
      avatar = InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(size / 2),
        child: avatar,
      );
    }

    return avatar;
  }

  Widget _buildFallback(Color textColor) {
    if (fallbackIcon != null) {
      return Icon(
        fallbackIcon,
        size: size * 0.5,
        color: textColor,
      );
    }

    if (name != null && name!.isNotEmpty) {
      return Center(
        child: Text(
          _getInitials(name!),
          style: TextStyle(
            color: textColor,
            fontSize: size * 0.4,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
    }

    return Icon(
      Icons.person,
      size: size * 0.5,
      color: textColor,
    );
  }
}

// Widget para grupo de avatares
class GxAvatarGroup extends StatelessWidget {
  final List<GxAvatar> avatars;
  final double size;
  final int maxVisible;
  final double overlap;
  final VoidCallback? onMoreTap;

  const GxAvatarGroup({
    super.key,
    required this.avatars,
    this.size = 32,
    this.maxVisible = 3,
    this.overlap = 8,
    this.onMoreTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final visibleAvatars = avatars.take(maxVisible).toList();
    final remainingCount = avatars.length - maxVisible;

    return SizedBox(
      height: size,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ...visibleAvatars.asMap().entries.map((entry) {
            final index = entry.key;
            final avatar = entry.value;

            return Padding(
              padding: EdgeInsets.only(
                left: index > 0 ? -overlap : 0,
              ),
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: theme.colorScheme.surface,
                    width: 2,
                  ),
                ),
                child: GxAvatar(
                  imageUrl: avatar.imageUrl,
                  name: avatar.name,
                  size: size,
                  backgroundColor: avatar.backgroundColor,
                  textColor: avatar.textColor,
                  onTap: avatar.onTap,
                ),
              ),
            );
          }),
          if (remainingCount > 0)
            Padding(
              padding: EdgeInsets.only(left: -overlap),
              child: GxAvatar(
                size: size,
                name: '+$remainingCount',
                backgroundColor: theme.colorScheme.surfaceContainerHighest,
                textColor: theme.colorScheme.onSurfaceVariant,
                onTap: onMoreTap,
                showBorder: true,
                borderColor: theme.colorScheme.surface,
              ),
            ),
        ],
      ),
    );
  }
}
