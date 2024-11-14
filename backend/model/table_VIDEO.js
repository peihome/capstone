const { client: pgClient } = require('../controller/postgre.js');

const createVideo = async (req, res) => {
    const { title, description, etag, bucket_name, transcoding_status, user_id } = req.body;
  
    if (!title || !etag || !bucket_name || !user_id) {
      return res.status(400).json({ message: 'Title, ETag, Bucket Name, and User ID are required' });
    }
  
    try {
      // Insert the video into PostgreSQL
      const query = `
        INSERT INTO "VIDEO" (title, description, etag, bucket_name, transcoding_status, user_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const values = [title, description, etag, bucket_name, transcoding_status || 'pending', user_id];
      const result = await pgClient.query(query, values);
  
      res.status(201).json({ video: result.rows[0] });
    } catch (error) {
      console.error('Error inserting video:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
};  

const getVideoDetails = async (req, res) => {
  const { uuid } = req.params;

  try {
    const query = `
      SELECT 
        v.video_id,
        v.title,
        v.description AS video_description,
        v.user_id,
        v.created_at,
        v.video_url,
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

module.exports = { createVideo , getVideoDetails, createVideoVsReview, updateVideoVsReview};