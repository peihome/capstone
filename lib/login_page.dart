// lib/login_page.dart

import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import './signup_page.dart'; // Import the SignupPage
import './gradient_button.dart'; // Import the GradientButton
import 'package:another_flushbar/flushbar.dart'; // Import Flushbar
import './home_page.dart'; // Import HomePage (optional if using routes)

class LoginPage extends StatefulWidget {
  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage>
    with SingleTickerProviderStateMixin {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

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

    _emailController.dispose();
    _passwordController.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _handleLogin() {
    String email = _emailController.text.trim();
    String password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      Flushbar(
        title: 'Error',
        message: 'Please enter both email and password',
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


    Flushbar(
      title: 'Success',
      message: 'Login Successful!',
      duration: Duration(seconds: 3),
      backgroundColor: Colors.green,
      icon: Icon(
        Icons.check_circle,
        size: 28.0,
        color: Colors.white,
      ),
      leftBarIndicatorColor: Colors.white,
    )..show(context).then((_) {
      // Navigate to HomePage after Flushbar is dismissed
      Navigator.pushReplacementNamed(context, '/home');
    });


  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Login to Nexstream'),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        titleTextStyle: TextStyle(color: Colors.black, fontSize: 20),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(height: 40),
            SlideTransition(
              position: _slideAnimation,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: Icon(
                  FontAwesomeIcons.user,
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
            SizedBox(height: 40),
            // Google Sign-in Button
            SlideTransition(
              position: _slideAnimation,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: OutlinedButton.icon(
                  icon: FaIcon(FontAwesomeIcons.google, color: Colors.red),
                  label: Text(
                    'Sign in with Google',
                    style: TextStyle(color: Colors.black),
                  ),
                  onPressed: () {
                    // Implement Google sign-in functionality
                    _showGoogleSignInSnackBar();
                  },
                  style: OutlinedButton.styleFrom(
                    minimumSize: Size(double.infinity, 50),
                    side: BorderSide(color: Colors.grey),
                  ),
                ),
              ),
            ),
            SizedBox(height: 10),
            // Facebook Sign-in Button
            SlideTransition(
              position: _slideAnimation,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: OutlinedButton.icon(
                  icon: FaIcon(FontAwesomeIcons.facebookF, color: Colors.blue[800]),
                  label: Text(
                    'Sign in with Facebook',
                    style: TextStyle(color: Colors.black),
                  ),
                  onPressed: () {
                    // Implement Facebook sign-in functionality
                    _showFacebookSignInSnackBar();
                  },
                  style: OutlinedButton.styleFrom(
                    minimumSize: Size(double.infinity, 50),
                    side: BorderSide(color: Colors.grey),
                  ),
                ),
              ),
            ),
            SizedBox(height: 20),
            // Stylish Gradient Login Button
            SlideTransition(
              position: _slideAnimation,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: GradientButton(
                  onPressed: _handleLogin,
                  text: 'Login',
                  icon: Icons.login, // Optional: Add an icon
                  iconColor: Colors.white,
                  gradient: LinearGradient(
                    colors: [Colors.blue, Colors.blueAccent],
                  ),
                  height: 50.0,
                  borderRadius: 25.0,
                  fontSize: 18.0,
                  textColor: Colors.white,
                ),
              ),
            ),
            SizedBox(height: 20),
            // Navigation Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SlideTransition(
                  position: _slideAnimation,
                  child: FadeTransition(
                    opacity: _fadeAnimation,
                    child: TextButton(
                      onPressed: () {
                        Navigator.pushNamed(context, '/signup');
                      },
                      child: Text('Not Registered? Register Now'),
                    ),
                  ),
                ),
                SlideTransition(
                  position: _slideAnimation,
                  child: FadeTransition(
                    opacity: _fadeAnimation,
                    child: TextButton(
                      onPressed: () {
                        // Implement forgot password functionality
                        Flushbar(
                          title: 'Forgot Password',
                          message:
                          'Forgot Password functionality is not implemented yet.',
                          duration: Duration(seconds: 3),
                          backgroundColor: Colors.blueAccent,
                          icon: Icon(
                            Icons.info_outline,
                            size: 28.0,
                            color: Colors.white,
                          ),
                          leftBarIndicatorColor: Colors.white,
                        )..show(context);
                      },
                      child: Text('Forgot Password?'),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Optional: Show SnackBar for Google Sign-In Button
  void _showGoogleSignInSnackBar() {
    Flushbar(
      title: 'Google Sign-In',
      message: 'Google sign-in functionality is not implemented yet.',
      duration: Duration(seconds: 3),
      backgroundColor: Colors.redAccent,
      icon: FaIcon(
        FontAwesomeIcons.google,
        size: 28.0,
        color: Colors.white,
      ),
      leftBarIndicatorColor: Colors.white,
    )..show(context);
  }

  // Optional: Show SnackBar for Facebook Sign-In Button
  void _showFacebookSignInSnackBar() {
    Flushbar(
      title: 'Facebook Sign-In',
      message: 'Facebook sign-in functionality is not implemented yet.',
      duration: Duration(seconds: 3),
      backgroundColor: Colors.blueAccent,
      icon: FaIcon(
        FontAwesomeIcons.facebookF,
        size: 28.0,
        color: Colors.white,
      ),
      leftBarIndicatorColor: Colors.white,
    )..show(context);
  }
}
