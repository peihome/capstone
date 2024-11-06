// lib/gradient_button.dart

import 'package:flutter/material.dart';

class GradientButton extends StatefulWidget {
  final VoidCallback onPressed;
  final String text;
  final Gradient gradient;
  final double height;
  final double borderRadius;
  final double fontSize;
  final Color textColor;
  final IconData? icon;
  final Color? iconColor;

  GradientButton({
    required this.onPressed,
    required this.text,
    this.gradient = const LinearGradient(
      colors: [Colors.blue, Colors.lightBlueAccent],
    ),
    this.height = 50.0,
    this.borderRadius = 25.0,
    this.fontSize = 18.0,
    this.textColor = Colors.white,
    this.icon,
    this.iconColor,
  });

  @override
  _GradientButtonState createState() => _GradientButtonState();
}

class _GradientButtonState extends State<GradientButton>
    with SingleTickerProviderStateMixin {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onPressed,
      onTapDown: (_) {
        setState(() {
          _isPressed = true;
        });
      },
      onTapUp: (_) {
        setState(() {
          _isPressed = false;
        });
      },
      onTapCancel: () {
        setState(() {
          _isPressed = false;
        });
      },
      child: AnimatedContainer(
        duration: Duration(milliseconds: 100),
        height: widget.height,
        decoration: BoxDecoration(
          gradient: widget.gradient,
          borderRadius: BorderRadius.circular(widget.borderRadius),
          boxShadow: [
            BoxShadow(
              color: widget.gradient.colors.last
                  .withOpacity(_isPressed ? 0.3 : 0.6),
              offset: Offset(0, 4),
              blurRadius: 5.0,
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            onTap: widget.onPressed,
            splashColor: Colors.white24,
            highlightColor: Colors.white10,
            child: Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (widget.icon != null) ...[
                    Icon(
                      widget.icon,
                      color: widget.iconColor ?? widget.textColor,
                    ),
                    SizedBox(width: 8),
                  ],
                  Text(
                    widget.text,
                    style: TextStyle(
                      color: widget.textColor,
                      fontSize: widget.fontSize,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
