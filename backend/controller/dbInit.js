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
        await newPostgresClient.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);

        // Create the new database
        await newPostgresClient.query(`CREATE DATABASE ${process.env.DB_NAME}`);

        // Close the connection to 'postgres'
        await newPostgresClient.end();

        newPostgresClient = new Client(pgConf);
        await newPostgresClient.connect();

        const queries = `
        
        -- Creating the ROLE table
        CREATE TABLE IF NOT EXISTS "ROLE" (
            role_id SERIAL PRIMARY KEY,
            role_name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT
        );

        -- Creating the USER_STATUS table
        CREATE TABLE IF NOT EXISTS "USER_STATUS" (
            status_id SERIAL PRIMARY KEY,
            status_name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT
        );

        -- Creating the USER table
        CREATE TABLE IF NOT EXISTS "USER" (
            user_id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            status_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (status_id) REFERENCES "USER_STATUS"(status_id)
        );

        -- Creating the USER_ROLE table
        CREATE TABLE IF NOT EXISTS "USER_ROLE" (
            user_role_id SERIAL PRIMARY KEY,
            user_id INT NOT NULL,
            role_id INT NOT NULL,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
            FOREIGN KEY (role_id) REFERENCES "ROLE"(role_id) ON DELETE CASCADE
        );

        -- Creating the CHANNEL_STATUS table
        CREATE TABLE IF NOT EXISTS "CHANNEL_STATUS" (
            status_id SERIAL PRIMARY KEY,
            status_name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT
        );

        -- Creating the CHANNEL table
        CREATE TABLE IF NOT EXISTS "CHANNEL" (
            channel_id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            user_id INT,
            status_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
            FOREIGN KEY (status_id) REFERENCES "CHANNEL_STATUS"(status_id)
        );

        -- Creating the USER_CHANNEL table to store userIdVsChannelId details
        CREATE TABLE IF NOT EXISTS "USER_VS_CHANNEL" (
            user_vs_channel_id SERIAL PRIMARY KEY,
            user_id INT,
            channel_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
            FOREIGN KEY (channel_id) REFERENCES "CHANNEL"(channel_id) ON DELETE CASCADE
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
            video_url TEXT,
            channel_id INT,
            FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
            FOREIGN KEY (channel_id) REFERENCES "CHANNEL"(channel_id) ON DELETE CASCADE
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

        -- Creating the NOTIFICATION_TYPE table
        CREATE TABLE IF NOT EXISTS "NOTIFICATION_TYPE" (
            notification_type_id SERIAL PRIMARY KEY,
            type_name VARCHAR(50) NOT NULL UNIQUE
        );

        -- Creating the USERS_VS_NOTIFICATION table
        CREATE TABLE IF NOT EXISTS "USERS_VS_NOTIFICATION" (
            user_vs_notification_id SERIAL PRIMARY KEY,
            user_id INT NOT NULL,
            notification_type_id INT NOT NULL,
            is_enabled BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
            FOREIGN KEY (notification_type_id) REFERENCES "NOTIFICATION_TYPE"(notification_type_id) ON DELETE CASCADE,
            UNIQUE (user_id, notification_type_id)
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
            subscribed_to_channel_id INT,
            subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (subscriber_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
            FOREIGN KEY (subscribed_to_channel_id) REFERENCES "CHANNEL"(channel_id) ON DELETE CASCADE
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

        -- Creating the DISPUTE_STATUS table
        CREATE TABLE IF NOT EXISTS "DISPUTE_STATUS" (
            status_id SERIAL PRIMARY KEY,
            status_name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT
        );

        -- Creating the DISPUTE_TYPE table
        CREATE TABLE IF NOT EXISTS "DISPUTE_TYPE" (
            dispute_type_id SERIAL PRIMARY KEY,
            type_name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT
        );

        -- Creating the DISPUTE table
        CREATE TABLE IF NOT EXISTS "DISPUTE" (
            dispute_id SERIAL PRIMARY KEY,
            video_id INT NOT NULL, 
            reporter_id INT NOT NULL,
            dispute_type_id INT NOT NULL,
            status_id INT NOT NULL,
            reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (video_id) REFERENCES "VIDEO"(video_id) ON DELETE CASCADE,
            FOREIGN KEY (reporter_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
            FOREIGN KEY (dispute_type_id) REFERENCES "DISPUTE_TYPE"(dispute_type_id),
            FOREIGN KEY (status_id) REFERENCES "DISPUTE_STATUS"(status_id)
        );

        CREATE TABLE IF NOT EXISTS "APPEAL_TYPE" (
            appeal_type_id SERIAL PRIMARY KEY,
            type_name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS "APPEAL_STATUS" (
            status_id SERIAL PRIMARY KEY,
            status_name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS "APPEAL_REQUEST" (
            appeal_id SERIAL PRIMARY KEY,
            user_id INT NOT NULL,
            appeal_type_id INT NOT NULL,
            video_id INT NULL,
            channel_id INT NULL,
            reason TEXT NOT NULL,
            status_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
            FOREIGN KEY (appeal_type_id) REFERENCES "APPEAL_TYPE"(appeal_type_id),
            FOREIGN KEY (video_id) REFERENCES "VIDEO"(video_id) ON DELETE CASCADE,
            FOREIGN KEY (channel_id) REFERENCES "CHANNEL"(channel_id) ON DELETE CASCADE,
            FOREIGN KEY (status_id) REFERENCES "APPEAL_STATUS"(status_id)
        );

        -- Insert Queries goes here
        -- Inserting data into the ROLE table
        INSERT INTO "ROLE" (role_name, description) VALUES 
        ('Admin', 'Administrator with full access rights'),
        ('Moderator', 'Can manage user content and moderate channels'),
        ('User', 'Regular user with basic access rights');

        -- Inserting data into the USER_STATUS table
        INSERT INTO "USER_STATUS" (status_id, status_name, description) VALUES 
        (1, 'Active', 'User is active and can access the platform'),
        (0, 'Inactive', 'User is inactive and cannot access the platform'),
        (-1, 'Suspended', 'User is suspended due to violations');

        -- Inserting data into the USER table
        INSERT INTO "USER" (name, email, status_id) VALUES 
        ('Alice Johnson', 'alice@example.com', 1),
        ('Bob Smith', 'bob@example.com', 1),
        ('Charlie Brown', 'charlie@example.com', 2),
        ('David Williams', 'david@example.com', 1),
        ('Eva Green', 'eva@example.com', 3);

        -- Inserting data into the USER_ROLE table
        INSERT INTO "USER_ROLE" (user_id, role_id) VALUES 
        (1, 1), -- Alice as Admin
        (2, 2), -- Bob as Moderator
        (3, 3), -- Charlie as User
        (4, 3), -- David as User
        (5, 3); -- Eva as User

        -- Inserting data into the CHANNEL_STATUS table
        INSERT INTO "CHANNEL_STATUS" (status_name, description) VALUES 
        ('Active', 'Channel is active and visible to users'),
        ('Inactive', 'Channel is inactive and not visible to users'),
        ('Suspended', 'Channel is suspended due to violations');

        -- Inserting data into the CHANNEL table
        INSERT INTO "CHANNEL" (name, description, user_id, status_id) VALUES 
        ('Tech Reviews', 'Channel dedicated to technology reviews', 1, 1),
        ('Cooking Mastery', 'Channel sharing cooking recipes and techniques', 2, 1),
        ('Travel Vlogs', 'Adventures and travel experiences', 4, 2);

        -- Inserting data into the USER_VS_CHANNEL table
        INSERT INTO "USER_VS_CHANNEL" (user_id, channel_id) VALUES 
        (1, 1),
        (2, 1),
        (3, 2),
        (4, 1),
        (5, 3);

        -- Inserting data into the VIDEO table
        INSERT INTO "VIDEO" (title, description, etag, bucket_name, transcoding_status, user_id, channel_id, video_url) VALUES 
        ('The Future of Tech', 'Exploring upcoming technologies', 'etag123', 'mybucket', 'Completed', 1, 1, 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/2_Minute_Timer.mp4/master.m3u8'),
        ('Delicious Pasta Recipe', 'How to make authentic pasta at home', 'etag124', 'mybucket', 'Completed', 2, 2, 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/2_Minute_Timer.mp4/master.m3u8'),
        ('Top 10 Travel Destinations', 'Must-visit places around the world', 'etag125', 'mybucket', 'Processing', 4, 3, 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/2_Minute_Timer.mp4/master.m3u8');

        -- Inserting data into the COMMENT table
        INSERT INTO "COMMENT" (content, user_id, video_id) VALUES 
        ('Great video! Very informative.', 3, 1),
        ('I love this recipe, cant wait to try it!', 4, 2),
        ('Amazing places, I want to visit them all!', 5, 3);

        -- Inserting data into the NOTIFICATION_TYPE table
        INSERT INTO "NOTIFICATION_TYPE" (type_name) VALUES 
        ('New Subscriber'),
        ('New Comment'),
        ('New Video Uploaded');

        -- Inserting data into the USERS_VS_NOTIFICATION table
        INSERT INTO "USERS_VS_NOTIFICATION" (user_id, notification_type_id, is_enabled) VALUES 
        (1, 1, TRUE),
        (2, 2, TRUE),
        (3, 3, FALSE);

        -- Inserting data into the NOTIFICATION table
        INSERT INTO "NOTIFICATION" (message, user_id, video_id) VALUES 
        ('You have a new subscriber!', 1, NULL),
        ('Your video received a new comment.', 2, 1),
        ('Your video has been uploaded successfully.', 4, 3);

        -- Inserting data into the SUBSCRIPTION table
        INSERT INTO "SUBSCRIPTION" (subscriber_id, subscribed_to_channel_id) VALUES 
        (5, 1),
        (4, 2),
        (3, 3);

        -- Inserting data into the PLAYLIST table
        INSERT INTO "PLAYLIST" (name, user_id) VALUES 
        ('Favorite Tech Videos', 1),
        ('Best Cooking Videos', 2);

        -- Inserting data into the VIDEO_PLAYLIST table
        INSERT INTO "VIDEO_PLAYLIST" (video_id, playlist_id) VALUES 
        (1, 1),
        (2, 2);

        -- Inserting data into the TRANSCODING table
        INSERT INTO "TRANSCODING" (video_id, status) VALUES 
        (1, 'Completed'),
        (2, 'In Progress');

        -- Inserting data into the DISPUTE_STATUS table
        INSERT INTO "DISPUTE_STATUS" (status_name, description) VALUES 
        ('Open', 'Dispute is currently open and under review'),
        ('Resolved', 'Dispute has been resolved');

        -- Inserting data into the DISPUTE_TYPE table
        INSERT INTO "DISPUTE_TYPE" (type_name, description) VALUES 
        ('Copyright Infringement', 'Reported for copyright issues'),
        ('Harassment', 'Reported for harassment behavior');

        -- Inserting data into the DISPUTE table
        INSERT INTO "DISPUTE" (video_id, reporter_id, dispute_type_id, status_id) VALUES 
        (1, 3, 1, 1),
        (2, 4, 2, 1);

        -- Inserting data into the APPEAL_TYPE table
        INSERT INTO "APPEAL_TYPE" (type_name, description) VALUES 
        ('Copyright Appeal', 'Appeal against copyright disputes'),
        ('General Appeal', 'General appeal for any issue');

        -- Inserting data into the APPEAL_STATUS table
        INSERT INTO "APPEAL_STATUS" (status_name, description) VALUES 
        ('Pending', 'Appeal is pending review'),
        ('Accepted', 'Appeal has been accepted'),
        ('Rejected', 'Appeal has been rejected');

        -- Inserting data into the APPEAL_REQUEST table
        INSERT INTO "APPEAL_REQUEST" (user_id, appeal_type_id, video_id, reason, status_id) VALUES 
        (3, 1, 1, 'I believe this video does not infringe any copyright.', 1),
        (4, 2, NULL, 'Requesting a review of my account status.', 1);
        
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
          VALUES (uuid(), 'Video 1', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th2.jpg', {'Java'}, 400)
      `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 2', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th3.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 3', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th4.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 4', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th5.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 5', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th6.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 6', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th7.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 7', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th8.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 8', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th9.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 9', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th9.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 10', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th10.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 11', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th11.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 1', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th2.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 2', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th3.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 3', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th4.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 4', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th5.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 5', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th6.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 6', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th7.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 7', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th8.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 8', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th9.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 9', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th9.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 10', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th10.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 11', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th11.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 1', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th2.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 2', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th3.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 3', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th4.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 4', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th5.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 5', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th6.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 6', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th7.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 7', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th8.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 8', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th9.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 9', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th9.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 10', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th10.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 11', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th11.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 1', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th2.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 2', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th3.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 3', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th4.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 4', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th5.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 5', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th6.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 6', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th7.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 7', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th8.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 8', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th9.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 9', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th9.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 10', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th10.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 11', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th11.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 1', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th2.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 2', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th3.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 3', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th4.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 4', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th5.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 5', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th6.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 6', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th7.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 7', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th8.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 8', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th9.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 9', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th9.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 10', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th10.jpg', {'Java'}, 400)
              `);
        await cassandraClient.execute(`
                  INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, views, likes, dislikes, published_at, thumbnail, tag, rating)
                  VALUES (uuid(), 'Video 11', uuid(), 'Test', 150, 5, 100, toTimestamp(now()), 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/th11.jpg', {'Java'}, 400)
              `);

        console.log('Cassandra database initialized successfully');

        await esInit();
    } catch (error) {
        console.error('Error initializing Cassandra database', error);
    }
};

esInit = async () => {
  let indexName = process.env.es_index_video_rating;

  try {
    // Check if the index exists
    let indexExists = await esClient.indices.exists({ index: indexName });

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

    indexName = process.env.es_index_users;
    indexExists = await esClient.indices.exists({ index: indexName });

    // Delete the index if it exists
    if (indexExists) {
      console.log(`Index ${indexName} already exists. Deleting...`);
      await esClient.indices.delete({ index: indexName });
      console.log(`Index ${indexName} deleted.`);
    }

    await esClient.indices.create({
      index: indexName,
      body: {
        mappings: {
          properties: {
            email: { type: 'keyword' }
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
      let query = 'SELECT video_id, tag, rating FROM video_metadata_by_id';
      let result = await cassandraClient.execute(query);
  
      // Iterate over the rows from Cassandra
      for (const row of result.rows) {
        const { video_id, tag, rating } = row;
  
        // Insert into Elasticsearch
        await esClient.index({
          index: process.env.es_index_video_rating,
          id: video_id.toString(),
          body: {
            video_id: video_id.toString(),
            tag: [...tag],
            rating: rating,
          },
        });
  
        console.log(`Inserted video_id: ${video_id} into Elasticsearch`);
      }


      // Fetch data from POSTGRES
      query = 'SELECT user_id, email FROM "USER"';
      result = await pgClient.query(query);

      // Iterate over the rows from POSTGRES
      for (const row of result.rows) {
        const { user_id, email } = row;

        // Insert into Elasticsearch
        await esClient.index({
          index: process.env.es_index_users,
          id: user_id.toString(), // Use user_id as the document ID
          body: {
            email: email
          },
        });

        console.log(`Inserted user_id: ${user_id} into Elasticsearch`);
      }
  
      console.log('Replication from Cassandra to Elasticsearch completed.');
    } catch (error) {
      console.error('Error replicating data to Elasticsearch:', error);
    }
  }


//initDB();
//initializeCassandraAndES();