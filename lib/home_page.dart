// lib/home_page.dart

import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import './gradient_button.dart';
import 'package:another_flushbar/flushbar.dart';

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

enum BottomNavItem { Home, Library, Browse, Subscriptions, Settings }

class _HomePageState extends State<HomePage> {
  BottomNavItem _currentNavItem = BottomNavItem.Home;

  // Sample Data
  final List<String> featuredImages = [
    'https://via.placeholder.com/400x200.png?text=Featured+Video+1',
    'https://via.placeholder.com/400x200.png?text=Featured+Video+2',
    'https://via.placeholder.com/400x200.png?text=Featured+Video+3',
  ];

  final List<String> categories = [
    'Movies',
    'TV Shows',
    'Live Streams',
    'New Releases',
    'Top Picks',
  ];

  final List<Map<String, String>> videoRecommendations = List.generate(
    10,
        (index) => {
      'title': 'Recommended Video ${index + 1}',
      'image': 'https://via.placeholder.com/150.png?text=Video+${index + 1}',
    },
  );

  final List<Map<String, String>> continueWatching = List.generate(
    5,
        (index) => {
      'title': 'Continue Watching ${index + 1}',
      'image': 'https://via.placeholder.com/150.png?text=Continue+${index + 1}',
    },
  );

  final List<Map<String, String>> recentlyAdded = List.generate(
    5,
        (index) => {
      'title': 'Recently Added ${index + 1}',
      'image': 'https://via.placeholder.com/150.png?text=Recent+${index + 1}',
    },
  );

  final List<Map<String, String>> popularSubscriptions = List.generate(
    5,
        (index) => {
      'title': 'Channel ${index + 1}',
      'image': 'https://via.placeholder.com/100.png?text=Channel+${index + 1}',
    },
  );

  final List<String> genres = [
    'Action',
    'Comedy',
    'Drama',
    'Horror',
    'Romance',
    'Sci-Fi',
    'Thriller',
    'Documentary',
  ];

  final List<Map<String, String>> playlists = List.generate(
    5,
        (index) => {
      'title': 'Playlist ${index + 1}',
      'image': 'https://via.placeholder.com/150.png?text=Playlist+${index + 1}',
    },
  );

  // Subscription Details
  String subscriptionStatus = 'Premium';
  String renewalDate = '2024-12-31';

  // Account Details
  String profileName = 'John Doe';
  String paymentMethod = 'Visa **** 1234';
  List<Map<String, String>> watchHistory = List.generate(
    5,
        (index) => {
      'title': 'Watched Video ${index + 1}',
      'image': 'https://via.placeholder.com/100.png?text=Watch+${index + 1}',
    },
  );

  // Handle Bottom Navigation
  void _onNavItemTapped(int index) {
    setState(() {
      _currentNavItem = BottomNavItem.values[index];
    });

    // Implement navigation to respective pages if needed
    // For example:
    // if (_currentNavItem == BottomNavItem.Home) { /* Navigate to Home */ }
  }

  // Show SnackBar Example
  void _showSnackBar(String title, String message, Color color, IconData icon) {
    Flushbar(
      title: title,
      message: message,
      duration: Duration(seconds: 3),
      backgroundColor: color,
      icon: Icon(
        icon,
        size: 28.0,
        color: Colors.white,
      ),
      leftBarIndicatorColor: Colors.white,
    )..show(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Header Section
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        title: Row(
          children: [
            // App Logo/Branding
            Icon(
              Icons.stream,
              color: Colors.blue,
              size: 32,
            ),
            SizedBox(width: 8),
            Text(
              'Nexstream',
              style: TextStyle(
                color: Colors.black,
                fontWeight: FontWeight.bold,
                fontSize: 20,
              ),
            ),
            Spacer(),
            // Notification Bell
            IconButton(
              icon: FaIcon(FontAwesomeIcons.bell, color: Colors.black),
              onPressed: () {
                _showSnackBar(
                  'Notifications',
                  'No new notifications',
                  Colors.blueAccent,
                  FontAwesomeIcons.infoCircle,
                );
              },
            ),
            // Profile Icon
            GestureDetector(
              onTap: () {
                _showSnackBar(
                  'Profile',
                  'Profile details not implemented yet.',
                  Colors.green,
                  FontAwesomeIcons.user,
                );
              },
              child: CircleAvatar(
                backgroundImage:
                NetworkImage('https://via.placeholder.com/150.png?text=Profile'),
              ),
            ),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: Size.fromHeight(60),
          child: Padding(
            padding: EdgeInsets.all(8.0),
            child: _buildSearchBar(),
          ),
        ),
      ),

      // Body Section
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(8.0),
          child: Column(
            children: [
              // Featured/Trending Videos Slider
              _buildFeaturedSlider(),

              SizedBox(height: 20),

              // Category Tabs
              _buildCategoryTabs(),

              SizedBox(height: 20),

              // Video Recommendations
              _buildSectionTitle('Recommendations'),
              _buildVideoList(videoRecommendations),

              SizedBox(height: 20),

              // Continue Watching
              _buildSectionTitle('Continue Watching'),
              _buildVideoList(continueWatching),

              SizedBox(height: 20),

              // Recently Added
              _buildSectionTitle('Recently Added'),
              _buildVideoList(recentlyAdded),

              SizedBox(height: 20),

              // Popular Subscriptions
              _buildSectionTitle('Popular Subscriptions'),
              _buildSubscriptionList(),

              SizedBox(height: 20),

              // Subscription Details
              _buildSubscriptionDetails(),

              SizedBox(height: 20),

              // Account Details
              _buildAccountDetails(),

              SizedBox(height: 20),

              // Video Gallery Section
              _buildSectionTitle('Browse Categories'),
              _buildGenresList(),

              SizedBox(height: 20),

              _buildSectionTitle('Playlists'),
              _buildPlaylistList(),

              SizedBox(height: 20),
            ],
          ),
        ),
      ),

      // Bottom Navigation Bar
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _currentNavItem.index,
        onTap: _onNavItemTapped,
        selectedItemColor: Colors.blueAccent,
        unselectedItemColor: Colors.grey,
        items: [
          BottomNavigationBarItem(
            icon: FaIcon(FontAwesomeIcons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: FaIcon(FontAwesomeIcons.book),
            label: 'Library',
          ),
          BottomNavigationBarItem(
            icon: FaIcon(FontAwesomeIcons.images),
            label: 'Browse',
          ),
          BottomNavigationBarItem(
            icon: FaIcon(FontAwesomeIcons.cog),
            label: 'Subscriptions',
          ),
          BottomNavigationBarItem(
            icon: FaIcon(FontAwesomeIcons.cog),
            label: 'Settings',
          ),
        ],
      ),
    );
  }

  // Search Bar Widget
  Widget _buildSearchBar() {
    return Container(
      height: 40,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(20),
      ),
      child: TextField(
        decoration: InputDecoration(
          hintText: 'Search for videos, movies, or series',
          border: InputBorder.none,
          prefixIcon: Icon(Icons.search, color: Colors.grey),
        ),
        onSubmitted: (value) {
          _showSnackBar(
            'Search',
            'You searched for "$value"',
            Colors.blueAccent,
            FontAwesomeIcons.search,
          );
        },
      ),
    );
  }

  // Featured Slider Widget
  Widget _buildFeaturedSlider() {
    return Container(
      height: 200.0,
      child: PageView.builder(
        controller: PageController(viewportFraction: 0.8),
        itemCount: featuredImages.length,
        itemBuilder: (context, index) {
          final imageUrl = featuredImages[index];
          return GestureDetector(
            onTap: () {
              _showSnackBar(
                'Video Selected',
                'You selected a featured video.',
                Colors.green,
                FontAwesomeIcons.playCircle,
              );
            },
            child: Container(
              margin: EdgeInsets.symmetric(horizontal: 5.0),
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(10),
                image: DecorationImage(
                  image: NetworkImage(imageUrl),
                  fit: BoxFit.cover,
                ),
              ),
              child: Align(
                alignment: Alignment.bottomLeft,
                child: Padding(
                  padding: EdgeInsets.all(8.0),
                  child: Text(
                    'Featured Video',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      backgroundColor: Colors.black45,
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // Category Tabs Widget
  Widget _buildCategoryTabs() {
    return Container(
      height: 40,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        itemBuilder: (context, index) {
          return GestureDetector(
            onTap: () {
              _showSnackBar(
                'Category Selected',
                'You selected "${categories[index]}"',
                Colors.blueAccent,
                FontAwesomeIcons.tag,
              );
            },
            child: Container(
              margin: EdgeInsets.symmetric(horizontal: 8),
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.blueAccent,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Center(
                child: Text(
                  categories[index],
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // Section Title Widget
  Widget _buildSectionTitle(String title) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        title,
        style:
        TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
      ),
    );
  }

  // Video List Widget
  Widget _buildVideoList(List<Map<String, String>> videos) {
    return Container(
      height: 200,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: videos.length,
        itemBuilder: (context, index) {
          return GestureDetector(
            onTap: () {
              _showSnackBar(
                'Video Selected',
                'You selected "${videos[index]['title']}"',
                Colors.green,
                FontAwesomeIcons.playCircle,
              );
            },
            child: Container(
              width: 150,
              margin: EdgeInsets.symmetric(horizontal: 8),
              child: Column(
                children: [
                  // Video Thumbnail
                  Container(
                    height: 120,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      image: DecorationImage(
                        image: NetworkImage(videos[index]['image']!),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  SizedBox(height: 8),
                  // Video Title
                  Text(
                    videos[index]['title']!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // Subscription List Widget
  Widget _buildSubscriptionList() {
    return Container(
      height: 120,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: popularSubscriptions.length,
        itemBuilder: (context, index) {
          return GestureDetector(
            onTap: () {
              _showSnackBar(
                'Subscription Selected',
                'You selected "${popularSubscriptions[index]['title']}"',
                Colors.green,
                FontAwesomeIcons.checkCircle,
              );
            },
            child: Container(
              width: 100,
              margin: EdgeInsets.symmetric(horizontal: 8),
              child: Column(
                children: [
                  // Subscription Thumbnail
                  CircleAvatar(
                    radius: 35,
                    backgroundImage:
                    NetworkImage(popularSubscriptions[index]['image']!),
                  ),
                  SizedBox(height: 8),
                  // Subscription Title
                  Text(
                    popularSubscriptions[index]['title']!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // Subscription Details Widget
  Widget _buildSubscriptionDetails() {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Subscription Status',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Row(
              children: [
                FaIcon(FontAwesomeIcons.crown, color: Colors.blueAccent),
                SizedBox(width: 8),
                Text(
                  '$subscriptionStatus',
                  style: TextStyle(fontSize: 16),
                ),
                Spacer(),
                TextButton(
                  onPressed: () {
                    _showSnackBar(
                      'Manage Subscription',
                      'Subscription management not implemented yet.',
                      Colors.blueAccent,
                      FontAwesomeIcons.infoCircle,
                    );
                  },
                  child: Text('Manage'),
                ),
              ],
            ),
            SizedBox(height: 8),
            Text('Renewal Date: $renewalDate',
                style: TextStyle(fontSize: 14, color: Colors.grey[700])),
            SizedBox(height: 16),
            Text('Special Offers',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            Container(
              height: 50,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.orange, Colors.deepOrangeAccent],
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(
                  'Upgrade to Premium & Get 1 Month Free!',
                  style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Account Details Widget
  Widget _buildAccountDetails() {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Account Details',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            SizedBox(height: 8),
            // Profile Info
            ListTile(
              leading: FaIcon(FontAwesomeIcons.user, color: Colors.blueAccent),
              title: Text('Profile Info'),
              subtitle: Text(profileName),
              trailing: FaIcon(FontAwesomeIcons.arrowRight, size: 16),
              onTap: () {
                _showSnackBar(
                  'Profile Info',
                  'Edit profile functionality not implemented yet.',
                  Colors.blueAccent,
                  FontAwesomeIcons.infoCircle,
                );
              },
            ),
            Divider(),
            // Payment Details
            ListTile(
              leading: FaIcon(FontAwesomeIcons.wallet, color: Colors.green),
              title: Text('Payment Details'),
              subtitle: Text(paymentMethod),
              trailing: FaIcon(FontAwesomeIcons.arrowRight, size: 16),
              onTap: () {
                _showSnackBar(
                  'Payment Details',
                  'Manage payment methods not implemented yet.',
                  Colors.blueAccent,
                  FontAwesomeIcons.infoCircle,
                );
              },
            ),
            Divider(),
            // Watch History
            ListTile(
              leading: FaIcon(FontAwesomeIcons.history, color: Colors.redAccent),
              title: Text('Watch History'),
              trailing: FaIcon(FontAwesomeIcons.arrowRight, size: 16),
              onTap: () {
                _showSnackBar(
                  'Watch History',
                  'View watch history functionality not implemented yet.',
                  Colors.blueAccent,
                  FontAwesomeIcons.infoCircle,
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  // Genres List Widget
  Widget _buildGenresList() {
    return Container(
      height: 50,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: genres.length,
        itemBuilder: (context, index) {
          return GestureDetector(
            onTap: () {
              _showSnackBar(
                'Genre Selected',
                'You selected "${genres[index]}" genre.',
                Colors.blueAccent,
                FontAwesomeIcons.tag,
              );
            },
            child: Container(
              margin: EdgeInsets.symmetric(horizontal: 8),
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.purple, Colors.deepPurpleAccent],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Center(
                child: Text(
                  genres[index],
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // Playlist List Widget
  Widget _buildPlaylistList() {
    return Container(
      height: 180,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: playlists.length,
        itemBuilder: (context, index) {
          return GestureDetector(
            onTap: () {
              _showSnackBar(
                'Playlist Selected',
                'You selected "${playlists[index]['title']}"',
                Colors.green,
                FontAwesomeIcons.list, // Replaced 'playlist' with 'list'
              );
            },
            child: Container(
              width: 150,
              margin: EdgeInsets.symmetric(horizontal: 8),
              child: Column(
                children: [
                  // Playlist Thumbnail
                  Container(
                    height: 120,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      image: DecorationImage(
                        image: NetworkImage(playlists[index]['image']!),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  SizedBox(height: 8),
                  // Playlist Title
                  Text(
                    playlists[index]['title']!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
