// elasticsearch.js
const { Client } = require('@elastic/elasticsearch');

const client = new Client({
    node: `http://${process.env.es_HOST}:${process.env.es_PORT}` // Ensure these env variables are set
});

// Function to search in the video_rating index
const searchVideoRatings = async (query) => {
    try {
        const response = await client.search({
            index: `${process.env.es_index_video_rating}`,
            body: query
        });
        
        return response.hits.hits;
    } catch (error) {
        console.error('Error searching video ratings:', error);
        throw error;
    }
};

// Function to search in the users index
const searchUsers = async (query) => {
    try {
        const response = await client.search({
            index: `${process.env.es_index_users}`,
            body: query
        });
        
        return response.hits;
    } catch (error) {
        console.error('Error searching users index:', error);
        throw error;
    }
};

module.exports = {
    searchVideoRatings,
    searchUsers,
    client
};