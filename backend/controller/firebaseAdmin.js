const admin = require('firebase-admin');
const path = require('path');

// Path to your service account key JSON file
const serviceAccount = require(path.join(__dirname, '../firebase/nexstream-firebase-auth.json'));

// Initialize the Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;