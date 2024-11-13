
const { client: cassandraClient } = require('../controller/cassandra.js');

const getVideoStatistics = async (req, res) => {
    try {
        const query = 'SELECT total_videos, total_views, video_uploads_per_month FROM video_statistics LIMIT 1';
        const result = await cassandraClient.execute(query);

        if (result.rows.length > 0) {
            const row = result.rows[0];
            const response = {
                total_videos: row.total_videos,
                total_views: row.total_views,
                video_uploads_per_month: row.video_uploads_per_month
            };
            res.json(response);
        } else {
            res.status(404).json({ message: 'No data found' });
        }
    } catch (error) {
        console.error('Error fetching data from Cassandra:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { getVideoStatistics };