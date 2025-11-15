import 'package:flutter/material.dart';

enum GxChipVariant {
  filled,
  outlined,
  elevated,
}

class GxChip extends StatelessWidget {

  const GxChip({
    required this.label,
    super.key,
    this.icon,
    this.onTap,
    this.onDelete,
    this.selected = false,
    this.variant = GxChipVariant.filled,
    this.color,
    this.selectedColor,
    this.elevation,
    this.padding,
  });
  final String label;
  final IconData? icon;
  final VoidCallback? onTap;
  final VoidCallback? onDelete;
  final bool selected;
  final GxChipVariant variant;
  final Color? color;
  final Color? selectedColor;
  final double? elevation;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    final effectiveColor = selected
        ? (selectedColor ?? colorScheme.primary)
        : (color ?? colorScheme.surfaceContainerHighest);

    final textColor =
        selected ? colorScheme.onPrimary : colorScheme.onSurfaceVariant;

    final borderColor = variant == GxChipVariant.outlined
        ? (selected ? effectiveColor : colorScheme.outline)
        : null;

    return Material(
      elevation: variant == GxChipVariant.elevated ? (elevation ?? 2) : 0,
      borderRadius: BorderRadius.circular(20),
      color: variant == GxChipVariant.outlined
          ? (selected ? effectiveColor : Colors.transparent)
          : effectiveColor,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: padding ??
              const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: borderColor != null
                ? Border.all(color: borderColor)
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(
                  icon,
                  size: 16,
                  color: textColor,
                ),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: textColor,
                  fontWeight: FontWeight.w500,
                ),
              ),
              if (onDelete != null) ...[
                const SizedBox(width: 6),
                GestureDetector(
                  onTap: onDelete,
                  child: Icon(
                    Icons.close,
                    size: 16,
    color: textColor.withValues(alpha: 0.7),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// Widget para grupo de chips
class GxChipGroup extends StatelessWidget {

  const GxChipGroup({
    required this.chips,
    super.key,
    this.direction = Axis.horizontal,
    this.alignment = WrapAlignment.start,
    this.spacing = 8,
    this.runSpacing = 8,
  });
  final List<GxChip> chips;
  final Axis direction;
  final WrapAlignment alignment;
  final double spacing;
  final double runSpacing;

  @override
  Widget build(BuildContext context) {
    if (direction == Axis.vertical) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: chips
            .map((chip) => Padding(
                  padding: EdgeInsets.only(bottom: spacing),
                  child: chip,
                ))
            .toList(),
      );
    }

    return Wrap(
      alignment: alignment,
      spacing: spacing,
      runSpacing: runSpacing,
      children: chips,
    );
  }
}

// Widget para chips selecionaveis
class GxSelectableChipGroup extends StatefulWidget {

  const GxSelectableChipGroup({
    required this.options,
    super.key,
    this.selectedOptions = const [],
    this.onSelectionChanged,
    this.multiSelect = true,
    this.variant = GxChipVariant.filled,
    this.color,
    this.selectedColor,
    this.spacing = 8,
    this.runSpacing = 8,
  });
  final List<String> options;
  final List<String> selectedOptions;
  final ValueChanged<List<String>>? onSelectionChanged;
  final bool multiSelect;
  final GxChipVariant variant;
  final Color? color;
  final Color? selectedColor;
  final double spacing;
  final double runSpacing;

  @override
  State<GxSelectableChipGroup> createState() => _GxSelectableChipGroupState();
}

class _GxSelectableChipGroupState extends State<GxSelectableChipGroup> {
  late List<String> _selectedOptions;

  @override
  void initState() {
    super.initState();
    _selectedOptions = List.from(widget.selectedOptions);
  }

  @override
  void didUpdateWidget(GxSelectableChipGroup oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.selectedOptions != oldWidget.selectedOptions) {
      _selectedOptions = List.from(widget.selectedOptions);
    }
  }

  void _toggleSelection(String option) {
    setState(() {
      if (_selectedOptions.contains(option)) {
        _selectedOptions.remove(option);
      } else {
        if (widget.multiSelect) {
          _selectedOptions.add(option);
        } else {
          _selectedOptions = [option];
        }
      }
    });
    widget.onSelectionChanged?.call(_selectedOptions);
  }

  @override
  Widget build(BuildContext context) => GxChipGroup(
      spacing: widget.spacing,
      runSpacing: widget.runSpacing,
      chips: widget.options.map((option) {
        final isSelected = _selectedOptions.contains(option);
        return GxChip(
          label: option,
          selected: isSelected,
          variant: widget.variant,
          color: widget.color,
          selectedColor: widget.selectedColor,
          onTap: () => _toggleSelection(option),
        );
      }).toList(),
    );
}
