require('dotenv').config({ path: './variables.env' });
//require('../controller/sessionKeyGenerator.js');

const express = require('express');
const session = require('express-session');
const app = express();
const port = process.env.backend_PORT || 8000;
const cors = require('cors');


// Multer setup to handle file uploads
const multer = require('multer');
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

// Set up CORS and static file serving
app.use(cors({
    origin: ['https://nexstream.live', 'https://api.nexstream.live', 'http://localhost:5173'],
    credentials: true,  // Allow cookies to be sent
  }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: `${process.env.sessionKey}`,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false,
        maxAge: 3600000, // 1 hour
     },
}));

//DB Init
require('../controller/dbInit.js');

//Start PostGre Server
require('../controller/postgre.js');

//Start Cassandra Server
require('../controller/cassandra.js');

// Import and use request handlers
require('../requestHandler/requestMapper.js')(app, upload);

app.listen(port, function () {
    console.log(`Server running at http://localhost:${port}`);
});