require('dotenv').config({ path: './variables.env' });

const express = require('express');
const app = express();
const port = process.env.API_SERVER_PORT || 8000;
const cors = require('cors');

// Multer setup to handle file uploads
const multer = require('multer');
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

// Set up CORS and static file serving
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//DB Init
//require('../controller/dbInit.js');

//Start PostGre Server
require('../controller/postgre.js');

//Start Cassandra Server
require('../controller/cassandra.js');

// Import and use request handlers
require('../requestHandler/requestMapper.js')(app, upload);

app.listen(port, function () {
    console.log(`Server running at http://localhost:${port}`);
});