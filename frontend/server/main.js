require('dotenv').config({ path: './variables.env' });

const express = require('express');
const app = express();
const port = process.env.UI_SERVER_PORT || 3000;
app.use(express.static('public'));

app.listen(port, function () {
    console.log('http://localhost:'+port);
});