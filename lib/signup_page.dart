// lib/signup_page.dart

import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'login_page.dart'; // Import the LoginPage if needed
import './gradient_button.dart'; // Import the GradientButton
import 'package:another_flushbar/flushbar.dart'; // Import Flushbar

class SignupPage extends StatefulWidget {
  @override
  _SignupPageState createState() => _SignupPageState();
}

class _SignupPageState extends State<SignupPage>
    with SingleTickerProviderStateMixin {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
  TextEditingController();

  // Animation variables
  late AnimationController _controller;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();

    // Initialize the animation controller
    _controller = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 800),
    );

    // Define slide animation
    _slideAnimation = Tween<Offset>(
      begin: Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    ));

    // Define fade animation
    _fadeAnimation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeIn,
    ));

    // Start the animations
    _controller.forward();
  }

  @override
  void dispose() {
    // Dispose controllers to free up resources
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _controller.dispose();
    super.dispose();
  }

  // Function to handle sign up logic
  void _handleSignUp() {
    String name = _nameController.text.trim();
    String email = _emailController.text.trim();
    String password = _passwordController.text;
    String confirmPassword = _confirmPasswordController.text;

    if (name.isEmpty ||
        email.isEmpty ||
        password.isEmpty ||
        confirmPassword.isEmpty) {
      Flushbar(
        title: 'Error',
        message: 'Please fill in all fields',
        duration: Duration(seconds: 3),
        backgroundColor: Colors.redAccent,
        icon: Icon(
          Icons.error_outline,
          size: 28.0,
          color: Colors.white,
        ),
        leftBarIndicatorColor: Colors.white,
      )..show(context);
      return;
    }

    if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(email)) {
      Flushbar(
        title: 'Invalid Email',
        message: 'Please enter a valid email address',
        duration: Duration(seconds: 3),
        backgroundColor: Colors.orangeAccent,
        icon: Icon(
          Icons.warning,
          size: 28.0,
          color: Colors.white,
        ),
        leftBarIndicatorColor: Colors.white,
      )..show(context);
      return;
    }

    if (password != confirmPassword) {
      Flushbar(
        title: 'Password Mismatch',
        message: 'Passwords do not match',
        duration: Duration(seconds: 3),
        backgroundColor: Colors.redAccent,
        icon: Icon(
          Icons.error_outline,
          size: 28.0,
          color: Colors.white,
        ),
        leftBarIndicatorColor: Colors.white,
      )..show(context);
      return;
    }

    if (password.length < 6) {
      Flushbar(
        title: 'Weak Password',
        message: 'Password should be at least 6 characters',
        duration: Duration(seconds: 3),
        backgroundColor: Colors.orangeAccent,
        icon: Icon(
          Icons.warning,
          size: 28.0,
          color: Colors.white,
        ),
        leftBarIndicatorColor: Colors.white,
      )..show(context);
      return;
    }

    // If all validations pass
    Flushbar(
      title: 'Success',
      message: 'Sign up Successful!',
      duration: Duration(seconds: 3),
      backgroundColor: Colors.green,
      icon: Icon(
        Icons.check_circle,
        size: 28.0,
        color: Colors.white,
      ),
      leftBarIndicatorColor: Colors.white,
    )..show(context);

    // Optionally, navigate back to the Login Page
    // Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Sign Up to Nexstream'),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        titleTextStyle: TextStyle(color: Colors.black, fontSize: 20),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () {
            Navigator.pop(context); // Navigate back to LoginPage
          },
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(height: 20),
            SlideTransition(
              position: _slideAnimation,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: Icon(
                  FontAwesomeIcons.userPlus,
                  size: 100,
                  color: Colors.blue,
                ),
              ),
            ),
            SizedBox(height: 20),
            SlideTransition(
              position: _slideAnimation,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: TextField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: 'Full Name',
                    hintText: 'Enter your full name',
                    prefixIcon: Icon(Icons.person),
                  ),
                  keyboardType: TextInputType.name,
                ),
              ),
            ),
            SizedBox(height: 20),
            SlideTransition(
              position: _slideAnimation,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: TextField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    labelText: 'Email',
                    hintText: 'Enter your email',
                    prefixIcon: Icon(Icons.email),
                  ),
                  keyboardType: TextInputType.emailAddress,
                ),
              ),
            ),
            SizedBox(height: 20),
            SlideTransition(
              position: _slideAnimation,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    hintText: 'Enter your password',
                    prefixIcon: Icon(Icons.lock),
                  ),
                ),
              ),
            ),
            SizedBox(height: 20),
            SlideTransition(
              position: _slideAnimation,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: TextField(
                  controller: _confirmPasswordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'Confirm Password',
                    hintText: 'Re-enter your password',
                    prefixIcon: Icon(Icons.lock),
                  ),
                ),
              ),
            ),
            SizedBox(height: 40),
            // Google Sign-up Button
            SlideTransition(
              position: _slideAnimation,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: OutlinedButton.icon(
                  icon: FaIcon(FontAwesomeIcons.google, color: Colors.red),
                  label:
                  Text('Sign up with Google', style: TextStyle(color: Colors.black)),
                  onPressed: () {
                    // Implement Google sign-up functionality
                  },
                  style: OutlinedButton.styleFrom(
                    minimumSize: Size(double.infinity, 50),
                    side: BorderSide(color: Colors.grey),
                  ),
                ),
              ),
            ),
            SizedBox(height: 10),
            // Facebook Sign-up Button
            SlideTransition(
              position: _slideAnimation,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: OutlinedButton.icon(
                  icon: FaIcon(FontAwesomeIcons.facebook, color: Colors.blue[800]),
                  label: Text('Sign up with Facebook',
                      style: TextStyle(color: Colors.black)),
                  onPressed: () {
                    // Implement Facebook sign-up functionality
                  },
                  style: OutlinedButton.styleFrom(
                    minimumSize: Size(double.infinity, 50),
                    side: BorderSide(color: Colors.grey),
                  ),
                ),
              ),
            ),
            SizedBox(height: 20),
            // Stylish Gradient Sign Up Button
            SlideTransition(
              position: _slideAnimation,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: GradientButton(
                  onPressed: _handleSignUp,
                  text: 'Sign Up',
                  icon: Icons.person_add, // Optional: Add an icon
                  iconColor: Colors.white,
                  gradient: LinearGradient(
                    colors: [Colors.green, Colors.lightGreen],
                  ),
                  height: 50.0,
                  borderRadius: 25.0,
                  fontSize: 18.0,
                  textColor: Colors.white,
                ),
              ),
            ),
            SizedBox(height: 20),
            // Navigation Button
            SlideTransition(
              position: _slideAnimation,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: TextButton(
                  onPressed: () {
                    Navigator.pop(context); // Navigate back to LoginPage
                  },
                  child: Text('Already have an account? Login'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
