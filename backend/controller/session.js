const { User } = require('../ORM/sequelizeInit.js');


/*
const admin = require('../controller/firebaseAdmin.js');
const setUserSession = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Save the token and user details in the session
    req.session.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      token,
    };

    // Respond with success
    res.status(200).json({ message: 'Token stored in session', user: req.session.user, sessionId: req.sessionID });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}
*/

const setUserSession = async (req, res) => {
  const { email } = req.body;

  try {

    // Query the USER table using Sequelize
    const userRecord = await User.findOne({ where: { email } });

    if (!userRecord) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Respond with success
    res.status(200).json({
      message: 'User found successfully',
      user_id: userRecord.user_id,
    });
  } catch (error) {
      console.error('Error during session setup:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

const getUser = (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'User not logged in' });
    }

    res.status(200).json({ user: req.session.user });
};
  
const getCurrentUserId = (req) => req.body.user_id || "";

// Logout route to clear the session
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to logout' });
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        res.status(200).json({ message: 'Logged out successfully' });
    });
};

module.exports = {
    setUserSession,
    getUser,
    logout,
    getCurrentUserId
}