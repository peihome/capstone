const { client: cassandraClient } = require('../controller/cassandra.js');
const moment = require('moment');

const formatViews = (views) => {
    if (views >= 1000 && views < 1000000) {
        return (views / 1000).toFixed(1) + 'K';
    } else if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    }
    return views.toString();
};

const formatPublishedTime = (timestamp) => {
    return moment(timestamp).fromNow();
};

const getDashboard = async (req, res) => {
    try {
        const pageSize = 10;
        const pageState = req.query.pageState || null;

        // First query to get video IDs from the video_rating table
        const cassandraQuery = `SELECT video_id FROM video_rating`;

        const cassandraResult = await cassandraClient.execute(cassandraQuery, [], {
            prepare: true,
            fetchSize: pageSize,
            pageState: pageState
        });

        const videoIds = cassandraResult.rows.map(row => row.video_id);

        // If no video IDs were returned, send an empty response
        if (videoIds.length === 0) {
            return res.json({
                videos: [],
                nextPageState: cassandraResult.pageState || null,
                hasMore: !!cassandraResult.pageState
            });
        }

        // Second query to get video metadata including thumbnail based on the video IDs
        const videoMetadataQuery = `
            SELECT video_id, title, channel_id, channel_name, views, published_at, thumbnail
            FROM video_metadata_by_id
            WHERE video_id IN ?
        `;

        const videoMetadataResult = await cassandraClient.execute(videoMetadataQuery, [videoIds], { prepare: true });

        // Format the videos data
        const videos = videoMetadataResult.rows.map(video => ({
            video_id: video.video_id,
            title: video.title,
            channel_id: video.channel_id,
            channel_name: video.channel_name,
            views: formatViews(video.views),
            published_at: formatPublishedTime(video.published_at),
            thumbnail: video.thumbnail // Include the video thumbnail
        }));

        // Return the response with pagination info
        res.json({
            videos: videos,
            nextPageState: cassandraResult.pageState || null,
            hasMore: !!cassandraResult.pageState
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).send('Error fetching dashboard data');
    }
};

module.exports = { getDashboard };