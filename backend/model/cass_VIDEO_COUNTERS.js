const { client: cassandraClient } = require('../controller/cassandra.js');

// GET Method to fetch views, likes, and dislikes
const getVideoCounters = async (req, res) => {
    const { video_id } = req.params; // Video ID from the request URL

    try {
        const query = `
            SELECT views, likes, dislikes
            FROM video_counters
            WHERE video_id = ?
        `;

        const result = await cassandraClient.execute(query, [video_id], { prepare: true });

        if (result.rowLength === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const counters = result.first(); // Get the first row
        res.json({
            video_id: video_id,
            views: counters.views,
            likes: counters.likes,
            dislikes: counters.dislikes
        });
    } catch (error) {
        console.error('Error fetching video counters:', error.message || error);
        res.status(500).json({ error: 'Error fetching video counters' });
    }
};

// PUT Method to increment views by 1
const incrementVideoViews = async (req, res) => {
    const { video_id } = req.params;

    try {
        const query = `
            UPDATE video_counters
            SET views = views + 1
            WHERE video_id = ?
        `;

        await cassandraClient.execute(query, [video_id], { prepare: true });
        res.json({ message: 'Views incremented by 1' });
    } catch (error) {
        console.error('Error incrementing video views:', error.message || error);
        res.status(500).json({ error: 'Error incrementing video views' });
    }
};

// PUT Method to increment likes by 1
const incrementVideoLikes = async (req, res) => {
    const { video_id } = req.params;

    try {
        const query = `
            UPDATE video_counters
            SET likes = likes + 1
            WHERE video_id = ?
        `;

        await cassandraClient.execute(query, [video_id], { prepare: true });
        res.json({ message: 'Likes incremented by 1' });
    } catch (error) {
        console.error('Error incrementing video likes:', error.message || error);
        res.status(500).json({ error: 'Error incrementing video likes' });
    }
};

// PUT Method to increment dislikes by 1
const incrementVideoDislikes = async (req, res) => {
    const { video_id } = req.params;

    try {
        const query = `
            UPDATE video_counters
            SET dislikes = dislikes + 1
            WHERE video_id = ?
        `;

        await cassandraClient.execute(query, [video_id], { prepare: true });
        res.json({ message: 'Dislikes incremented by 1' });
    } catch (error) {
        console.error('Error incrementing video dislikes:', error.message || error);
        res.status(500).json({ error: 'Error incrementing video dislikes' });
    }
};

module.exports = {
    getVideoCounters,
    incrementVideoViews,
    incrementVideoLikes,
    incrementVideoDislikes
};