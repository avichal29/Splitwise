import 'package:flutter/material.dart';
import '../config/theme.dart';

class GradientAvatar extends StatelessWidget {
  final String name;
  final double size;
  final double fontSize;

  const GradientAvatar({
    super.key,
    required this.name,
    this.size = 40,
    this.fontSize = 16,
  });

  @override
  Widget build(BuildContext context) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: AppColors.getAvatarGradient(name),
        boxShadow: [
          BoxShadow(
            color: AppColors.getAvatarGradient(name).colors.first.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Center(
        child: Text(
          initial,
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: fontSize,
          ),
        ),
      ),
    );
  }
}
