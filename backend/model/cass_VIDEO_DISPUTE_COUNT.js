
const { client: cassandraClient } = require('../controller/cassandra.js');
const { Video, Dispute } = require('../ORM/sequelizeInit.js');
const { getCurrentUserId } = require('../model/table_USER.js');

const getVideoDisputes = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, status_id } = req.query;
        const offset = (page - 1) * pageSize;

        // Query Cassandra for video disputes with report_count >= 5
        const cassandraQuery = 'SELECT video_id, report_count FROM video_dispute_count';
        const cassandraResult = await cassandraClient.execute(cassandraQuery);

        // Extract video_ids from Cassandra result
        const videoIds = cassandraResult.rows.filter(row => {
            const reportCount = parseInt(row.report_count, 10);
            return reportCount > 5;
        }).map(row => row.video_id);

        console.log("videoIds" + videoIds);

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

const updateReportCount = async (req, res) => {
    const videoId = req.params.video_id;

    try {

        const getQuery = `
            SELECT report_count
            FROM video_dispute_count
            WHERE video_id = ?;
        `;
        const result = await cassandraClient.execute(getQuery, [videoId], { prepare: true });

        // Extract report_count from the query result
        const reportCount = result.rows[0]?.report_count || 0;


        if(reportCount == 0){
            createVideoDispute(videoId);
        }

        // Log the report count to the console
        console.log(`Report count for video_id ${videoId}:`, reportCount);


        // Update query to increment the report_count for the specified video_id
        const updateQuery = `
            UPDATE video_dispute_count
            SET report_count = report_count + 1
            WHERE video_id = ?;
        `;
        
        // Execute the update query
        await cassandraClient.execute(updateQuery, [videoId], { prepare: true });

        // Log the successful increment operation
        console.log(`Incremented report_count for video_id ${videoId}`);

        // Send a success response
        res.status(200).json({ message: `Report count incremented for video_id ${videoId}` });
    } catch (error) {
        console.error("Error incrementing report_count:", error.message || error);
        res.status(500).send("Error incrementing report count");
    }
}


const createVideoDispute = async (video_id) => {
    const dispute_type_id = 1;
    const reporter_id = getCurrentUserId(); // Assuming you have a method to get the current user's ID

    // Validate input data
    if (!video_id || !dispute_type_id) {
        return { error: 'video_id and dispute_type_id are required.' }; // Return the error instead of using res
    }

    try {
        // Create a new dispute
        const newDispute = await Dispute.create({
            video_id,
            reporter_id,
            dispute_type_id,
            status_id: 0,
        });

        return {
            message: 'Dispute created successfully.',
            data: newDispute,
        };
    } catch (error) {
        console.error('Error creating dispute:', error);
        return { error: 'Internal server error' }; // Return the error instead of using res
    }
};

module.exports = { getVideoDisputes , updateReportCount};