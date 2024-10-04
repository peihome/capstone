const { client: cassandraClient } = require('../controller/cassandra.js');
const { searchUsers, searchVideoRatings } = require('../controller/elasticSearch.js');
const { client: pgClient } = require('../controller/postgre.js');
const { client: esClient } = require('../controller/elasticSearch.js');

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

        // Fetch video metadata from Cassandra based on video IDs
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
            thumbnail: video.thumbnail
        }));

        // Check if there's a next page
        const hasMore = videoIds.length === pageSize;

        // Return the response with pagination info
        res.json({
            videos: videos,
            nextPage: hasMore ? page + 1 : null,
            hasMore: hasMore
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error.message || error);
        res.status(500).send('Error fetching dashboard data');
    }
};

const createUser = async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  try {
    // Check if the email already exists in Elasticsearch
    const esQuery = {
      query: {
        match: {
          email: email
        }
      }
    };

    const esResult = await searchUsers(esQuery);

    // If any results were found in Elasticsearch, email already exists
    if (esResult.total.value > 0) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // If email doesn't exist in Elasticsearch, proceed with inserting into PostgreSQL
    const query = `
      INSERT INTO "USER" (name, email, status)
      VALUES ($1, $2, 0)
      RETURNING *;
    `;
    const values = [name, email];
    const result = await pgClient.query(query, values);

    // Insert the user info into Elasticsearch as well after inserting into PostgreSQL
    const esInsert = {
      index: 'users',
      id: result.rows[0].user_id, // Use PostgreSQL's user_id as the Elasticsearch document ID
      body: {
        name: name,
        email: email,
        status: 0,
        created_at: result.rows[0].created_at
      }
    };
    await esClient.index(esInsert);

    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error inserting user:', error);
    res.status(500).json({ message: 'Internal server error' });
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

module.exports = { getDashboard, createUser, authenticate };