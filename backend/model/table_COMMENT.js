const { Comment, User } = require('../ORM/sequelizeInit.js');

const getVideoComments = async (req, res) => {
  const { video_id } = req.params;  // Extract video_id from path parameters
  const pageSize = 10;
  const page = parseInt(req.query.page) || 0;
  const offset = page * pageSize;

  try {
    // Query to fetch comments along with user data (user's name)
    const comments = await Comment.findAll({
      where: { video_id },
      limit: pageSize,
      offset,
      order: [['created_at', 'DESC']],  // Order comments by creation date
      include: [
        {
          model: User,  // Join with User model
          attributes: ['name']  // Only fetch the 'name' attribute
        }
      ]
    });

    // If no comments are found, return an empty list
    if (comments.length === 0) {
      return res.json({
        comments: [],
        nextPage: null,
        hasMore: false
      });
    }

    // Format comments to include user name
    const formattedComments = comments.map(comment => ({
      comment_id: comment.comment_id,
      user_id: comment.user_id,
      user_name: comment.User.name,  // Fetch the user's name from the User model
      content: comment.content,
      created_at: comment.created_at
    }));

    // Check if there is a next page by seeing if we got the full page of results
    const hasMore = comments.length === pageSize;

    res.json({
      comments: formattedComments,
      nextPage: hasMore ? page + 1 : null,
      hasMore: hasMore
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const postComment = async (req, res) => {
  const { video_id } = req.params;  // Get video_id from path params
  const { user_id, content } = req.body;  // Get user_id and content from request body

  // Validate input
  if (!user_id || !content) {
    return res.status(400).json({ message: 'user_id and content are required' });
  }

  try {
    // Insert the new comment into the database
    const newComment = await Comment.create({
      user_id,
      video_id,   // Video ID comes from the path parameter
      content,
    });

    // Respond with the created comment
    res.status(201).json({
      message: 'Comment created successfully',
      comment: {
        comment_id: newComment.comment_id,
        user_id: newComment.user_id,
        video_id: newComment.video_id,
        content: newComment.content,
        created_at: newComment.created_at,
      },
    });
  } catch (error) {
    console.error('Error posting comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { getVideoComments, postComment };