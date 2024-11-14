const admin = require('firebase-admin');
const path = require('path');

// Path to your service account key JSON file
//const serviceAccount = require(path.join(__dirname, 'path/to/your/serviceAccountKey.json'));

// Initialize the Firebase Admin SDK
admin.initializeApp({
    //credential: admin.credential.cert(serviceAccount),
});

// Export the Firebase Admin client
module.exports = admin;