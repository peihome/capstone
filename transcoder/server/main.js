require('dotenv').config({ path: './variables.env' });

const express = require('express');
const app = express();
const port = process.env.transcoder_PORT;
const cors = require('cors');
const { sendMessage } = require('../controller/kafkaProducer');

// Set up CORS and static file serving
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up routes
app.post('/send', (req, res) => {
  const { message } = req.body;

  sendMessage(message, (err, result) => {
    if (err) {
      return res.status(500).send('Error sending message');
    }
    res.send(result);
  });
});

app.listen(port, function () {
    console.log(`Transcoder service running at http://localhost:${port}`);
});