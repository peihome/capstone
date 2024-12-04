const { client: cassandraClient } = require('../controller/cassandra.js');
const { searchVideoRatings } = require('../controller/elasticSearch.js');
const { Dispute, Op, Video, Channel } = require('../ORM/sequelizeInit.js');

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


/*
const getDashboard = async (req, res) => {
    try {
        const pageSize = 24;
        const page = parseInt(req.query.page) || 0;
        const from = page * pageSize;

        // Construct the Elasticsearch query
        const esQuery = {
            from: from,
            size: pageSize,
            sort: [
                { rating: { order: 'desc' } }
            ],
            query: {
                match_all: {}
            }
        };

        // Fetch video ratings from Elasticsearch
        const esResults = await searchVideoRatings(esQuery);
        const videoIds = esResults.map(hit => hit._id); // Extract video IDs from hits

        // If no video IDs were returned, send an empty response
        if (videoIds.length === 0) {
            return res.json({
                videos: [],
                nextPage: null,
                hasMore: false
            });
        }

        // Fetch video metadata and channel names from Postgres
        const videos = await Video.findAll({
            where: { video_id: videoIds },
            include: [{
                model: Channel,
                attributes: ['name'], // Fetch channel name
                required: true
            }]
        });

        // If no videos found in the database, return an empty response
        if (!videos || videos.length === 0) {
            return res.json({
                videos: [],
                nextPage: null,
                hasMore: false
            });
        }

        // Fetch video counters from Cassandra
        const videoCountersQuery = `
            SELECT video_id, views, likes, dislikes
            FROM video_counters
            WHERE video_id IN ?
        `;
        const videoCountersResult = await cassandraClient.execute(videoCountersQuery, [videoIds], { prepare: true });

        // Convert counters result to a map for quick lookup
        const videoCountersMap = videoCountersResult.rows.reduce((map, counter) => {
            map[counter.video_id] = {
                views: counter.views,
                likes: counter.likes,
                dislikes: counter.dislikes
            };
            return map;
        }, {});

        // Query the dispute table in Postgres to get videoIds where status_id is not 1
        const disputes = await Dispute.findAll({
            where: {
                video_id: videoIds,
                status_id: { [Op.ne]: 1 }
            }
        });

        // Get the videoIds where status_id is not 1
        const invalidVideoIds = disputes.map(dispute => dispute.video_id);

        // Filter valid videos by excluding invalid videoIds
        const validVideos = videos.filter(video =>
            !invalidVideoIds.includes(video.video_id.toString())
        );

        // Format the valid videos data
        const formattedVideos = validVideos.map(video => {
            const counters = videoCountersMap[video.video_id] || { views: 0, likes: 0, dislikes: 0 }; // Default counters if not found
            return {
                video_id: video.video_id,
                title: video.title,
                channel_id: video.channel_id,
                channel_name: video.Channel.channel_name, // Channel name from associated Channel model
                views: formatViews(counters.views),
                likes: counters.likes,
                dislikes: counters.dislikes,
                published_at: formatPublishedTime(video.published_at),
                thumbnail: video.thumbnail_url
            };
        });

        // Check if there's a next page
        const hasMore = videoIds.length === pageSize;

        // Return the response with pagination info
        res.json({
            videos: formattedVideos,
            nextPage: hasMore ? page + 1 : null,
            hasMore: hasMore
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error.message || error);
        res.status(500).send('Error fetching dashboard data');
    }
};


*/


const getDashboard = async (req, res) => {
    try {
        const pageSize = 12;
        const page = parseInt(req.query.page) || 0;
        const offset = page * pageSize;

        // Fetch video metadata and channel names from Postgres with pagination
        const videos = await Video.findAll({
            limit: pageSize,
            offset: offset,
            include: [{
                model: Channel,
                attributes: ['name'], // Fetch channel name
                required: true
            }]
        });

        // If no videos found in the database, return an empty response
        if (!videos || videos.length === 0) {
            return res.json({
                videos: [],
                nextPage: null,
                hasMore: false
            });
        }

        // Fetch video counters from Cassandra
        const videoIds = videos.map(video => video.video_id); // Extract video IDs from the result
        const videoCountersQuery = `
            SELECT video_id, views, likes, dislikes
            FROM video_counters
            WHERE video_id IN ?
        `;
        const videoCountersResult = await cassandraClient.execute(videoCountersQuery, [videoIds], { prepare: true });

        // Convert counters result to a map for quick lookup
        const videoCountersMap = videoCountersResult.rows.reduce((map, counter) => {
            map[counter.video_id] = {
                views: counter.views,
                likes: counter.likes,
                dislikes: counter.dislikes
            };
            return map;
        }, {});

        // Query the dispute table in Postgres to get videoIds where status_id is not 1
        const disputes = await Dispute.findAll({
            where: {
                video_id: videoIds,
                status_id: { [Op.ne]: 1 }
            }
        });

        // Get the videoIds where status_id is not 1
        const invalidVideoIds = disputes.map(dispute => dispute.video_id);

        // Filter valid videos by excluding invalid videoIds
        const validVideos = videos.filter(video =>
            !invalidVideoIds.includes(video.video_id.toString())
        );

        // Format the valid videos data
        const formattedVideos = validVideos.map(video => {
            const counters = videoCountersMap[video.video_id] || { views: 0, likes: 0, dislikes: 0 }; // Default counters if not found
            return {
                video_id: video.video_id,
                title: video.title,
                channel_id: video.channel_id,
                channel_name: video.Channel.name, // Channel name from associated Channel model
                views: formatViews(counters.views),
                likes: counters.likes+"",
                dislikes: counters.dislikes+"",
                published_at: formatPublishedTime(video.published_at),
                thumbnail: video.thumbnail_url
            };
        });

        // Check if there's a next page
        const hasMore = videos.length === pageSize;

        // Return the response with pagination info
        res.json({
            videos: formattedVideos,
            nextPage: hasMore ? page + 1 : null,
            hasMore: hasMore
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error.message || error);
        res.status(500).send('Error fetching dashboard data');
    }
};


// API route for authenticating user with ID token
const authenticate = async (req, res) => {
  const { idToken } = req.body;

  try {
      // Verify the ID token with Firebase Admin SDK
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Store the uid in the session
      req.session.userId = decodedToken.uid;

      // Send the redirect URL in the response
      res.json({ redirectUrl: '/' });
  } catch (error) {
      console.error('Error verifying ID token:', error);
      // Send the redirect URL for unauthorized access
      res.json({ redirectUrl: '/unauthorized' });
  }
};

module.exports = { getDashboard, authenticate };