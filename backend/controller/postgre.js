const { Client } = require('pg');

const clientConf = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    // ssl: {
    //        rejectUnauthorized: false
    // },
};

const client = new Client(clientConf);

client.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));

module.exports = {
    client,
    clientConf
}