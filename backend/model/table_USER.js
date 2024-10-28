const { client: pgClient } = require('../controller/postgre.js');
const { client: esClient } = require('../controller/elasticSearch.js');
const { searchUsers } = require('../controller/elasticSearch.js');

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
  return 1;
}

module.exports = { confirmUser, createUser, getCurrentUserId };