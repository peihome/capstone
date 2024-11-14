const { client: pgClient } = require('../controller/postgre.js');

const getVideoComments = async (req, res) => {
    const { video_id } = req.params;
    const pageSize = 10;
    const page = parseInt(req.query.page) || 0;
    const offset = page * pageSize;
  
    try {
      // Query to fetch comments with pagination
      const query = `
        SELECT comment_id, user_id, content, created_at
        FROM "COMMENT"
        WHERE video_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
  
      const values = [video_id, pageSize, offset];
      const result = await pgClient.query(query, values);
  
      // Check if there are any comments
      if (result.rows.length === 0) {
        return res.json({
          comments: [],
          nextPage: null,
          hasMore: false
        });
      }
  
      // Format comments for the response
      const comments = result.rows.map(comment => ({
        comment_id: comment.comment_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at
      }));
  
      // Check if there is a next page by seeing if we got the full page of results
      const hasMore = result.rows.length === pageSize;
  
      res.json({
        comments: comments,
        nextPage: hasMore ? page + 1 : null,
        hasMore: hasMore
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
};  

module.exports = { getVideoComments };