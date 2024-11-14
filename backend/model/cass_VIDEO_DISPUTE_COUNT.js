
const { client: cassandraClient } = require('../controller/cassandra.js');
const { Video, Dispute } = require('../ORM/sequelizeInit.js');

const getVideoDisputes = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, status_id } = req.query;
        const offset = (page - 1) * pageSize;

        // Query Cassandra for video disputes with report_count >= 5
        const cassandraQuery = 'SELECT video_id, report_count FROM video_dispute_count WHERE report_count >= 5 ALLOW FILTERING';
        const cassandraResult = await cassandraClient.execute(cassandraQuery);

        // Extract video_ids from Cassandra result
        const videoIds = cassandraResult.rows.map(row => row.video_id);

        // Construct the where clause for filtering by video_id and status_id (if provided)
        const whereClause = {
            video_id: videoIds,
            ...(status_id != null && { status_id })  // Only add status_id filter if it's not null
        };

        // Query PostgreSQL for video titles by joining Video and Dispute tables
        const videos = await Dispute.findAll({
            attributes: ['video_id', 'dispute_id', 'status_id'],
            where: whereClause,
            include: [{
                model: Video,
                attributes: ['title'], // Retrieve title from Video table
            }],
            limit: pageSize,
            offset: offset,
        });

        // Get total count for pagination
        const totalRecords = await Dispute.count({
            where: whereClause,
            include: [{
                model: Video,
            }],
        });
        const totalPages = Math.ceil(totalRecords / pageSize);
        const hasNext = page < totalPages;

        // Combine Cassandra data with PostgreSQL titles using video_id to match report_count
        const data = videos.map(video => {
            // Find the corresponding report_count from Cassandra result
            const reportCount = cassandraResult.rows.find(row => row.video_id == video.video_id)?.report_count;

            // Return video data along with report_count and title
            return {
                video_id: video.video_id,
                dispute_id: video.dispute_id,
                status_id: video.status_id,
                title: video.Video?.title || 'Title not available', // Access title from joined Video table
                report_count: reportCount || 0, // Default to 0 if no report_count is found
            };
        });

        res.json({
            message: 'Video disputes fetched successfully.',
            data,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: page,
                pageSize,
                hasNext,
            },
        });
    } catch (error) {
        console.error('Error fetching data from Cassandra or PostgreSQL:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { getVideoDisputes };