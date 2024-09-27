const { client: pgClient, clientConf : pgConf } = require('../controller/postgre.js');
const { Client } = require('pg');
const { client: cassandraClient } = require('../controller/cassandra.js');
const { client: esClient } = require('../controller/elasticSearch.js');

async function initDB() {
    try {

        await pgClient.end();

        // Connect to the default 'postgres' database first
        let postgresConf = { ...pgConf, database: 'postgres' };

        let newPostgresClient = new Client(postgresConf);
        await newPostgresClient.connect();

        // Drop the existing database
        await newPostgresClient.query('DROP DATABASE IF EXISTS nexstreamdb');

        // Create the new database
        await newPostgresClient.query('CREATE DATABASE nexstreamdb');

        // Close the connection to 'postgres'
        await newPostgresClient.end();

        newPostgresClient = new Client(pgConf);
        await newPostgresClient.connect();

        const queries = `
        
        -- Creating the USER table
        CREATE TABLE IF NOT EXISTS "USER" (
            user_id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Creating the VIDEO table with ETag and bucket_name instead of URL
        CREATE TABLE IF NOT EXISTS "VIDEO" (
            video_id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            etag VARCHAR(255) NOT NULL,  -- S3 ETag for identifying the video file
            bucket_name VARCHAR(255) NOT NULL,  -- S3 bucket where the file is stored
            transcoding_status VARCHAR(50),
            user_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE
        );

        -- Creating the COMMENT table
        CREATE TABLE IF NOT EXISTS "COMMENT" (
            comment_id SERIAL PRIMARY KEY,
            content TEXT,
            user_id INT,
            video_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
            FOREIGN KEY (video_id) REFERENCES "VIDEO"(video_id) ON DELETE CASCADE
        );

        -- Creating the NOTIFICATION table
        CREATE TABLE IF NOT EXISTS "NOTIFICATION" (
            notification_id SERIAL PRIMARY KEY,
            message VARCHAR(255),
            user_id INT,
            video_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
            FOREIGN KEY (video_id) REFERENCES "VIDEO"(video_id) ON DELETE CASCADE
        );

        -- Creating the SUBSCRIPTION table
        CREATE TABLE IF NOT EXISTS "SUBSCRIPTION" (
            sub_id SERIAL PRIMARY KEY,
            subscriber_id INT,
            subscribed_to_user_id INT,
            subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (subscriber_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
            FOREIGN KEY (subscribed_to_user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE
        );

        -- Creating the PLAYLIST table
        CREATE TABLE IF NOT EXISTS "PLAYLIST" (
            playlist_id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            user_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE
        );

        -- Creating the VIDEO_PLAYLIST table
        CREATE TABLE IF NOT EXISTS "VIDEO_PLAYLIST" (
            video_playlist_id SERIAL PRIMARY KEY,
            video_id INT,
            playlist_id INT,
            FOREIGN KEY (video_id) REFERENCES "VIDEO"(video_id) ON DELETE CASCADE,
            FOREIGN KEY (playlist_id) REFERENCES "PLAYLIST"(playlist_id) ON DELETE CASCADE
        );

        -- Creating the TRANSCODING table
        CREATE TABLE IF NOT EXISTS "TRANSCODING" (
            trans_id SERIAL PRIMARY KEY,
            video_id INT,
            status VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP NULL,
            FOREIGN KEY (video_id) REFERENCES "VIDEO"(video_id) ON DELETE CASCADE
        );
        
        -- Insert Queries goes here
        -- Inserting sample data into USER table
        INSERT INTO "USER" (name, email, password, created_at) VALUES
        ('Alice Johnson', 'alice@example.com', 'password123', CURRENT_TIMESTAMP),
        ('Bob Smith', 'bob@example.com', 'password456', CURRENT_TIMESTAMP),
        ('Charlie Brown', 'charlie@example.com', 'password789', CURRENT_TIMESTAMP);

        -- Inserting sample data into VIDEO table (using ETag and bucket_name)
        INSERT INTO "VIDEO" (title, description, etag, bucket_name, transcoding_status, user_id, created_at) VALUES
        ('Introduction to PostgreSQL', 'A beginner-friendly guide to PostgreSQL.', 'etag1234567890', 'my-s3-bucket', 'completed', 1, CURRENT_TIMESTAMP),
        ('Advanced SQL Techniques', 'Learn advanced SQL queries and performance tuning.', 'etag0987654321', 'my-s3-bucket', 'pending', 2, CURRENT_TIMESTAMP),
        ('Understanding Joins', 'A deep dive into SQL joins and their use cases.', 'etag1122334455', 'my-s3-bucket', 'completed', 1, CURRENT_TIMESTAMP);

        -- Inserting sample data into COMMENT table
        INSERT INTO "COMMENT" (content, user_id, video_id, created_at) VALUES
        ('Great video! Very informative.', 1, 1, CURRENT_TIMESTAMP),
        ('I learned a lot from this, thanks!', 2, 2, CURRENT_TIMESTAMP),
        ('Can you explain the join types again?', 1, 3, CURRENT_TIMESTAMP);

        -- Inserting sample data into NOTIFICATION table
        INSERT INTO "NOTIFICATION" (message, user_id, video_id, created_at) VALUES
        ('Alice commented on your video.', 2, 1, CURRENT_TIMESTAMP),
        ('Bob subscribed to your channel.', 1, NULL, CURRENT_TIMESTAMP),
        ('Charlie liked your video.', 1, 3, CURRENT_TIMESTAMP);

        -- Inserting sample data into SUBSCRIPTION table
        INSERT INTO "SUBSCRIPTION" (subscriber_id, subscribed_to_user_id, subscribed_at) VALUES
        (1, 2, CURRENT_TIMESTAMP),
        (2, 1, CURRENT_TIMESTAMP),
        (3, 1, CURRENT_TIMESTAMP);

        -- Inserting sample data into PLAYLIST table
        INSERT INTO "PLAYLIST" (name, user_id, created_at) VALUES
        ('My Favorite Videos', 1, CURRENT_TIMESTAMP),
        ('Learning SQL', 2, CURRENT_TIMESTAMP),
        ('PostgreSQL Tutorials', 1, CURRENT_TIMESTAMP);

        -- Inserting sample data into VIDEO_PLAYLIST table
        INSERT INTO "VIDEO_PLAYLIST" (video_id, playlist_id) VALUES
        (1, 1),
        (2, 2),
        (3, 3),
        (1, 3);
        
        `;

        await newPostgresClient.query(queries);
        console.log('Postgres database initialized successfully!');
        await newPostgresClient.end();

    } catch (err) {
        console.error('Error initializing Postgres database:', err);
    }
}


const initializeCassandraAndES = async () => {
    try {

        const cassandra_db = process.env.ec2_cassandra_db;

        //DROP Keyspace if exists
        await cassandraClient.execute(`
            DROP KEYSPACE IF EXISTS ${cassandra_db};
        `);

        // Create keyspace
        await cassandraClient.execute(`
            CREATE KEYSPACE IF NOT EXISTS ${cassandra_db}
            WITH REPLICATION = {
                'class': 'SimpleStrategy',
                'replication_factor': 1
            }
        `);

        // Use the keyspace
        await cassandraClient.execute(`USE ${cassandra_db}`);

        // Create tables
        await cassandraClient.execute(`
            CREATE TABLE video_metadata_by_id (
                video_id UUID PRIMARY KEY, 
                title TEXT,
                channel_id UUID,
                channel_name TEXT,
                views INT,
                likes INT,
                dislikes INT,
                published_at TIMESTAMP,
                thumbnail TEXT,
                tag SET<TEXT>,
                rating INT,
            );
        `);

        // Insert sample data
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
            VALUES (uuid(), 'Sample Video', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'http://localhost:8080', {'Java'}, 400)
        `);
        
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
            VALUES (uuid(), 'Sample Video', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'http://localhost:8080', {'HTML'}, 300)
        `);
        
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
            VALUES (uuid(), 'Sample Video', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'http://localhost:8080', {'CSS'}, 500)
        `);

        console.log('Cassandra database initialized successfully');

        await esInit();
    } catch (error) {
        console.error('Error initializing Cassandra database', error);
    }
};

esInit = async () => {
  const indexName = process.env.es_index;

  try {
    // Check if the index exists
    const indexExists = await esClient.indices.exists({ index: indexName });

    // Delete the index if it exists
    if (indexExists) {
      console.log(`Index ${indexName} already exists. Deleting...`);
      await esClient.indices.delete({ index: indexName });
      console.log(`Index ${indexName} deleted.`);
    }

    // Create a new index with the necessary mappings
    console.log(`Creating new index ${indexName}...`);
    await esClient.indices.create({
      index: indexName,
      body: {
        mappings: {
          properties: {
            video_id: { type: 'keyword' }, // Store UUID as a keyword
            tag: { type: 'keyword' },      // Store tags as a keyword (Elasticsearch equivalent of SET<TEXT>)
            rating: { type: 'integer' },   // Store rating as an integer
          },
        },
      },
    });

    console.log(`Index ${indexName} created successfully.`);

    replicateToElasticsearch();
  } catch (error) {
    console.error('Error during Elasticsearch dbInit:', error);
  }
}

replicateToElasticsearch = async () => {
    try {
      // Fetch data from Cassandra
      const query = 'SELECT video_id, tag, rating FROM video_metadata_by_id';
      const result = await cassandraClient.execute(query);
  
      // Iterate over the rows from Cassandra
      for (const row of result.rows) {
        const { video_id, tag, rating } = row;
  
        // Insert into Elasticsearch
        await esClient.index({
          index: process.env.es_index,
          id: video_id.toString(),
          body: {
            video_id: video_id.toString(),
            tag: [...tag],
            rating: rating,
          },
        });
  
        console.log(`Inserted video_id: ${video_id} into Elasticsearch`);
      }
  
      console.log('Replication from Cassandra to Elasticsearch completed.');
    } catch (error) {
      console.error('Error replicating data to Elasticsearch:', error);
    }
  }


//initDB();
initializeCassandraAndES();