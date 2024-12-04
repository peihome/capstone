const { client: pgClient } = require('../controller/postgre.js');
const { Dispute, Video, Channel } = require('../ORM/sequelizeInit.js');
const { getCurrentUserId } = require('../controller/session.js');
const { client: esClient } = require('../controller/elasticSearch.js');

const createVideo = async (req, res) => {
  const { title, description, etag } = req.body;
  const user_id = getCurrentUserId(req);
  const bucket_name = process.env.s3BucketName;

  // Validate input
  if (!title || !description || !user_id) {
      return res.status(400).json({ message: 'Title, Description, and User ID are required' });
  }

  try {
      // Fetch the channel_id for the given user_id
      const channel = await Channel.findOne({ where: { user_id } });

      if (!channel) {
          return res.status(404).json({ message: 'Channel not found for the user' });
      }

      const channel_id = channel.channel_id;

      // Create the video using Sequelize ORM
      const newVideo = await Video.create({
          title,
          description,
          transcoding_status: 'pending', // Default status
          user_id,
          channel_id,
          etag,
          bucket_name
      });

      // Respond with the created video
      res.status(201).json({ video: newVideo });
  } catch (error) {
      console.error('Error inserting video:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

const transcodingComplete = async (req, res) => {
  const { video_id } = req.params;
  const { video_url, thumbnail_url, archived_url } = req.body;

  // Validate input
  if (!video_id || !video_url) {
      return res.status(400).json({ message: 'Video ID and Video URL are required' });
  }

  try {
      // Find the video by ID
      const video = await Video.findOne({ where: { video_id: video_id } });

      if (!video) {
          return res.status(404).json({ message: 'Video not found' });
      }

      // Update the transcoding_status and video_url
      video.transcoding_status = 'completed';
      video.video_url = video_url;
      if(thumbnail_url){
        video.thumbnail_url = thumbnail_url;
      }

      if(archived_url){
        video.archived_url = archived_url;
      }

      // Save the updated video object
      await video.save();


      // Dummy values for `rating` and `tags`
    const rating = 5; // Placeholder for a default rating
    const tags = ['sample', 'video', 'transcoded']; // Placeholder tags

    // Indexing the video in Elasticsearch
    await esClient.index({
      index: process.env.es_index_video_rating,
      id: video_id.toString(),
      body: {
        video_id: video_id.toString(),
        tags: tags, // Use dummy tags
        rating: rating, // Use dummy rating
      },
    });

      // Respond with the updated video object
      res.status(200).json({ message: 'Video updated successfully', video });
  } catch (error) {
      console.error('Error updating video:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};


const getVideoDetails = async (req, res) => {
  const { uuid } = req.params;

  try {

    const isAvailable = await isVideoAvailable(uuid);

    if (!isAvailable) {
      return res.status(404).json({ message: "Video unavailable" });
    }

    const query = `
      SELECT 
        v.video_id,
        v.title,
        v.description AS video_description,
        v.user_id,
        v.created_at,
        v.video_url,
        v.archived_url,
        c.name AS channel_name,
        c.description AS channel_description
      FROM "VIDEO" v
      JOIN "CHANNEL" c ON v.channel_id = c.channel_id
      WHERE v.video_id = $1
    `;
    
    const values = [uuid];
    const result = await pgClient.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }

    

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error retrieving video details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

const isVideoAvailable = async (video_id) => {
  try {
      // Query the Dispute table to check for video_id and status_id == -1
      const dispute = await Dispute.findOne({
          where: {
              video_id: video_id,
              status_id: -1
          }
      });

      // If a dispute is found
      if (dispute) {
          console.log('Dispute found with status_id = -1');
          return false;  // You can return the dispute details if needed
      } else {
          console.log('No dispute found with status_id = -1');
          return true;
      }
  } catch (error) {
      console.error('Error querying dispute:', error);
      throw error; // Handle the error as needed
  }
};


const createVideoVsReview = async (req, res) => {
  const { video_id, status_id } = req.body;

  try {
    const query = `
      INSERT INTO "VIDEO_VS_REVIEW" (video_id, status_id, reviewed_at)
      VALUES ($1, $2, NOW())
      RETURNING *
    `;

    const values = [video_id, status_id];
    const result = await pgClient.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating video vs review record:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateVideoVsReview = async (req, res) => {
  const { review_id } = req.params;
  const { video_id, status_id } = req.body;

  try {
    const query = `
      UPDATE "VIDEO_VS_REVIEW"
      SET video_id = $1, status_id = $2, reviewed_at = NOW()
      WHERE review_id = $3
      RETURNING *
    `;

    const values = [video_id, status_id, review_id];
    const result = await pgClient.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Review record not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating video vs review record:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { createVideo , getVideoDetails, createVideoVsReview, updateVideoVsReview, transcodingComplete};