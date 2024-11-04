const { client: pgClient } = require('../controller/postgre.js');
const { getCurrentUserId } = require('./table_USER.js');

const createChannel = async (req, res) => {
    const { name, description } = req.body;
    user_id = getCurrentUserId();

    // Basic validation
    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required fields.' });
    }

    //Validate if the user already has a row in Channel table
    TODO

    try {
        const query = `
        INSERT INTO "CHANNEL" (name, description, user_id, status_id)
        VALUES ($1, $2, $3, $4) RETURNING channel_id, name, description, user_id, status_id, created_at;
        `;
        const values = [name, description, user_id, 1]; // 1 for Active

        const result = await pgClient.query(query, values);
        const newChannel = result.rows[0];

        res.status(201).json({ message: 'Channel created successfully', channel: newChannel });
    } catch (error) {
        console.error('Error creating channel:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {createChannel};