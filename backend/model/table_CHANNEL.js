const { client: pgClient } = require('../controller/postgre.js');
const { getCurrentUserId } = require('./table_USER.js');
const { Channel } = require('../ORM/sequelizeInit.js');
const { addUserToChannel } = require('../model/table_USER_VS_CHANNEL.js');

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

        await addUserToChannel(newChannel.channel_id);

        res.status(201).json({ message: 'Channel created successfully', channel: newChannel });
    } catch (error) {
        console.error('Error creating channel:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const updateChannelStatus = async (channel_id, user_id, status_id) => {
    if (!channel_id || !user_id || !status_id) {
        throw new Error('Channel ID, User ID, and Status ID are required');
    }

    try {
        // Update status_id in CHANNEL table where both channel_id and user_id match
        const query = 'UPDATE "CHANNEL" SET status_id = $1 WHERE channel_id = $2 AND user_id = $3';
        const values = [status_id, channel_id, user_id];

        const result = await pgClient.query(query, values);

        if (result.rowCount === 0) {
            throw new Error('Channel not found or user does not match');
        }

        return 'Channel status updated successfully';
    } catch (error) {
        console.error('Error updating channel status:', error);
        throw new Error('Internal server error');
    }
};

// Activates the channel by setting status_id to 1
const activateChannel = async (channel_id, user_id) => {
    try {
        const message = await updateChannelStatus(channel_id, user_id, 1);
        console.log(message);
        return message;
    } catch (error) {
        console.error('Error activating channel:', error.message);
        throw error;
    }
};

// Deactivates the channel by setting status_id to -1
const deactivateChannel = async (channel_id, user_id) => {
    try {
        const message = await updateChannelStatus(channel_id, user_id, -1);
        console.log(message);
        return message;
    } catch (error) {
        console.error('Error deactivating channel:', error.message);
        throw error;
    }
};

const updateChannel = async (req, res) => {
    const { channel_id, name, description, status_id } = req.body;
    const user_id = getCurrentUserId();

    // Basic validation
    if (!channel_id || !name || !description || status_id === undefined) {
        return res.status(400).json({ error: 'Channel ID, name, description, and status ID are required fields.' });
    }

    try {
        // Check if the channel exists for the given user_id and channel_id
        const checkQuery = 'SELECT channel_id FROM "CHANNEL" WHERE channel_id = $1 AND user_id = $2';
        const checkValues = [channel_id, user_id];
        const checkResult = await pgClient.query(checkQuery, checkValues);

        if (checkResult.rowCount === 0) {
            return res.status(404).json({ error: 'Channel not found or user does not match' });
        }

        // Update the channel
        const updateQuery = `
            UPDATE "CHANNEL" 
            SET name = $1, description = $2, status_id = $3
            WHERE channel_id = $4 AND user_id = $5
            RETURNING channel_id, name, description, user_id, status_id, created_at;
        `;
        const updateValues = [name, description, status_id, channel_id, user_id];
        
        const result = await pgClient.query(updateQuery, updateValues);
        const updatedChannel = result.rows[0];

        res.status(200).json({ message: 'Channel updated successfully', channel: updatedChannel });
    } catch (error) {
        console.error('Error updating channel:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = {createChannel};