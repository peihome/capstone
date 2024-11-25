const { client: pgClient } = require('../controller/postgre.js');
const { client: esClient } = require('../controller/elasticSearch.js');
const { searchUsers } = require('../controller/elasticSearch.js');
const { User, UserStatus } = require('../ORM/sequelizeInit.js');

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
        INSERT INTO "USER" (name, email, status_id)
        VALUES ($1, $2, 1)
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

const confirmUser = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const query = 'UPDATE "USER" SET status_id = $1 WHERE email = $2';
        const values = [1, email];  // setting status_id to Active

        const result = await pgClient.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User status updated successfully' });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getCurrentUserId = () => {
  return 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f';
}

const getUserDetails = async (page = 1, pageSize = 10, status_id = null) => {
  try {
      const offset = (page - 1) * pageSize;

      const whereClause = status_id ? { status_id } : {};

      const users = await User.findAll({
          attributes: ['user_id', 'status_id', 'email', 'name'],
          where: whereClause,
          limit: pageSize,
          offset: offset,
      });

      const totalRecords = await User.count({
          where: whereClause,
      });
      const totalPages = Math.ceil(totalRecords / pageSize);
      const hasNext = page < totalPages;

      return {
          message: 'User details fetched successfully.',
          data: users,
          pagination: {
              totalRecords,
              totalPages,
              currentPage: page,
              pageSize,
              hasNext,
          },
      };

  } catch (error) {
      console.error('Error in fetching user details:', error);
      throw new Error('Internal server error');
  }
};

const getAllUsers = async (req, res) => {
  const { page = 1, pageSize = 10, status_id } = req.query; // Get query parameters

    try {
        // Call the function and pass the parameters
        const result = await getUserDetails(
            parseInt(page, 10),
            parseInt(pageSize, 10),
            parseInt(status_id, 10)
        );

        // Send the response
        res.json(result);
    } catch (error) {
        console.error('Error in /api/admin/users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const updateUserStatus = async (req, res) => {
  const { user_id } = req.params; // Extract user_id from URL params
  const { status_id } = req.body; // Extract new status_id from request body

  // Validate that status_id is provided
  if (status_id == null) {
      return res.status(400).json({ error: 'status_id is required.' });
  }

  try {
      // Find the user by primary key (user_id)
      const user = await User.findByPk(user_id);

      // Check if user exists
      if (!user) {
          return res.status(404).json({ error: 'User not found.' });
      }

      // Update the user's status_id
      user.status_id = status_id;
      await user.save();

      // Respond with the updated user data
      return res.status(200).json({
          message: 'User status updated successfully.',
          data: user,
      });
  } catch (error) {
      console.error('Error updating user status:', error);
      return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { confirmUser, createUser, getCurrentUserId, getAllUsers, updateUserStatus };