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
        CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
            user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            status_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (status_id) REFERENCES "USER_STATUS"(status_id)
        );

        -- Creating the USER_ROLE table
        CREATE TABLE IF NOT EXISTS "USER_ROLE" (
            user_role_id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
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
            channel_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            user_id UUID,
            status_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
            FOREIGN KEY (status_id) REFERENCES "CHANNEL_STATUS"(status_id)
        );

        -- Creating the USER_CHANNEL table to store userIdVsChannelId details
        CREATE TABLE IF NOT EXISTS "USER_VS_CHANNEL" (
            user_vs_channel_id SERIAL PRIMARY KEY,
            user_id UUID,
            channel_id UUID,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
            FOREIGN KEY (channel_id) REFERENCES "CHANNEL"(channel_id) ON DELETE CASCADE
        );

        -- Creating the VIDEO table with ETag and bucket_name instead of URL
        CREATE TABLE IF NOT EXISTS "VIDEO" (
            video_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            etag VARCHAR(255) NOT NULL,  -- S3 ETag for identifying the video file
            bucket_name VARCHAR(255) NOT NULL,  -- S3 bucket where the file is stored
            transcoding_status VARCHAR(50),
            user_id UUID,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            video_url TEXT,
            thumbnail_url TEXT,
            channel_id UUID,
            FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
            FOREIGN KEY (channel_id) REFERENCES "CHANNEL"(channel_id) ON DELETE CASCADE
        );

        -- Creating the COMMENT table
        CREATE TABLE IF NOT EXISTS "COMMENT" (
            comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            content TEXT,
            user_id UUID,
            video_id UUID,
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
            user_id UUID NOT NULL,
            notification_type_id INT NOT NULL,
            is_enabled BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
            FOREIGN KEY (notification_type_id) REFERENCES "NOTIFICATION_TYPE"(notification_type_id) ON DELETE CASCADE,
            UNIQUE (user_id, notification_type_id)
        );

        -- Creating the SUBSCRIPTION table
        CREATE TABLE IF NOT EXISTS "SUBSCRIPTION" (
            sub_id SERIAL PRIMARY KEY,
            subscriber_id UUID,
            subscribed_to_channel_id UUID,
            subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (subscriber_id) REFERENCES "USER"(user_id) ON DELETE CASCADE,
            FOREIGN KEY (subscribed_to_channel_id) REFERENCES "CHANNEL"(channel_id) ON DELETE CASCADE
        );

        -- Creating the PLAYLIST table
        CREATE TABLE IF NOT EXISTS "PLAYLIST" (
            playlist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255),
            user_id UUID,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES "USER"(user_id) ON DELETE CASCADE
        );

        -- Creating the VIDEO_PLAYLIST table
        CREATE TABLE IF NOT EXISTS "VIDEO_PLAYLIST" (
            video_playlist_id SERIAL PRIMARY KEY,
            video_id UUID,
            playlist_id UUID,
            FOREIGN KEY (video_id) REFERENCES "VIDEO"(video_id) ON DELETE CASCADE,
            FOREIGN KEY (playlist_id) REFERENCES "PLAYLIST"(playlist_id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS "VIDEO_REVIEW_STATUS" (
            status_id SERIAL PRIMARY KEY,
            status_name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT
        );

        -- Creating the TRANSCODING table
        CREATE TABLE IF NOT EXISTS "TRANSCODING" (
            trans_id SERIAL PRIMARY KEY,
            video_id UUID,
            status_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP NULL,
            FOREIGN KEY (video_id) REFERENCES "VIDEO"(video_id) ON DELETE CASCADE,
            FOREIGN KEY (status_id) REFERENCES "VIDEO_REVIEW_STATUS"(status_id) ON DELETE CASCADE
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
            video_id UUID NOT NULL, 
            reporter_id UUID NOT NULL,
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
            appeal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            appeal_type_id INT NOT NULL,
            video_id UUID NULL,
            channel_id UUID NULL,
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

        CREATE TABLE IF NOT EXISTS "VIDEO_VS_REVIEW" (
            review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            video_id UUID NOT NULL,
            status_id INT NOT NULL,
            reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (video_id) REFERENCES "VIDEO"(video_id) ON DELETE CASCADE,
            FOREIGN KEY (status_id) REFERENCES "VIDEO_REVIEW_STATUS"(status_id) ON DELETE CASCADE
        );



        -- Insert Queries goes here
        -- Inserting into ROLE table
        -- Inserting into VIDEO_REVIEW_STATUS table
        INSERT INTO "VIDEO_REVIEW_STATUS" (status_id, status_name, description) VALUES
        (0, 'Pending', 'Review is pending and has not been processed yet'),
        (1, 'Approved', 'Review has been approved'),
        (-1, 'Rejected', 'Review has been rejected due to violation of guidelines');

        INSERT INTO "ROLE" (role_name, description) VALUES
        ('Admin', 'Administrator role with full access'),
        ('User', 'Standard user with limited access');

        -- Inserting into USER_STATUS table
        INSERT INTO "USER_STATUS" (status_name, description) VALUES
        ('Active', 'User is active and can perform actions'),
        ('Inactive', 'User is inactive and cannot perform actions');

        -- Inserting into USER table
        INSERT INTO "USER" (user_id, name, email, status_id) VALUES
        ('a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'John Doe', 'john.doe@example.com', 1),
        ('f9bcf29e-daf8-4933-8e93-2e7b017c68b2', 'Jane Smith', 'jane.smith@example.com', 1);

        -- Inserting into USER_ROLE table
        INSERT INTO "USER_ROLE" (user_id, role_id) VALUES
        ('a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 1),
        ('f9bcf29e-daf8-4933-8e93-2e7b017c68b2', 2);

        -- Inserting into CHANNEL_STATUS table
        INSERT INTO "CHANNEL_STATUS" (status_name, description) VALUES
        ('Active', 'Channel is active and can broadcast content'),
        ('Inactive', 'Channel is inactive and cannot broadcast content');

        -- Inserting into CHANNEL table
        INSERT INTO "CHANNEL" (channel_id, name, description, user_id, status_id) VALUES
        ('b3e2f383-bbdf-41b1-baba-d77282654e1d', 'Tech Channel', 'A channel for tech discussions', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 1),
        ('8bb4e74f-b6d9-41e0-82d2-9a46c684762d', 'Gaming Channel', 'A channel for gaming content', 'f9bcf29e-daf8-4933-8e93-2e7b017c68b2', 1);

        -- Inserting into USER_VS_CHANNEL table
        INSERT INTO "USER_VS_CHANNEL" (user_id, channel_id) VALUES
        ('a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('f9bcf29e-daf8-4933-8e93-2e7b017c68b2', '8bb4e74f-b6d9-41e0-82d2-9a46c684762d');

        -- Inserting into VIDEO table
        INSERT INTO "VIDEO" (video_id, title, description, etag, bucket_name, transcoding_status, user_id, video_url, channel_id) VALUES
        ('d3eb7b89-89b1-4067-967d-625bf438b173', 'Tech Tutorial 1', 'A basic tech tutorial', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/2_Minute_Timer.mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('7f12bce6-9abf-4e45-bf7a-bd7356d8db6e', 'Gaming Tips', 'Best gaming strategies', 'etag_xyz456', 'gaming_bucket', 'Pending', 'f9bcf29e-daf8-4933-8e93-2e7b017c68b2', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/2_Minute_Timer.mp4/master.m3u8', '8bb4e74f-b6d9-41e0-82d2-9a46c684762d');

        -- Inserting into COMMENT table
        INSERT INTO "COMMENT" (comment_id, content, user_id, video_id) VALUES
        ('f36a22c7-89c9-4e77-bf66-b34cc6bc9c0f', 'Great video!', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'd3eb7b89-89b1-4067-967d-625bf438b173'),
        ('bb3d7e97-88f2-43c4-b8fd-76d1a9d98b3f', 'Very helpful!', 'f9bcf29e-daf8-4933-8e93-2e7b017c68b2', '7f12bce6-9abf-4e45-bf7a-bd7356d8db6e');

        -- Inserting into NOTIFICATION_TYPE table
        INSERT INTO "NOTIFICATION_TYPE" (type_name) VALUES
        ('Video Uploaded'),
        ('Comment Received');

        -- Inserting into USERS_VS_NOTIFICATION table
        INSERT INTO "USERS_VS_NOTIFICATION" (user_id, notification_type_id) VALUES
        ('a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 1),
        ('f9bcf29e-daf8-4933-8e93-2e7b017c68b2', 2);

        -- Inserting into SUBSCRIPTION table
        INSERT INTO "SUBSCRIPTION" (subscriber_id, subscribed_to_channel_id) VALUES
        ('a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', '8bb4e74f-b6d9-41e0-82d2-9a46c684762d'),
        ('f9bcf29e-daf8-4933-8e93-2e7b017c68b2', 'b3e2f383-bbdf-41b1-baba-d77282654e1d');

        -- Inserting into PLAYLIST table
        INSERT INTO "PLAYLIST" (playlist_id, name, user_id) VALUES
        ('111fa56b-8e5a-4671-b0de-20754f9d9572', 'Tech Videos', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f'),
        ('7d81b5c8-f4c5-43f3-b8f0-2c9c9e295743', 'Gaming Highlights', 'f9bcf29e-daf8-4933-8e93-2e7b017c68b2');

        -- Inserting into VIDEO_PLAYLIST table
        INSERT INTO "VIDEO_PLAYLIST" (video_id, playlist_id) VALUES
        ('d3eb7b89-89b1-4067-967d-625bf438b173', '111fa56b-8e5a-4671-b0de-20754f9d9572'),
        ('7f12bce6-9abf-4e45-bf7a-bd7356d8db6e', '7d81b5c8-f4c5-43f3-b8f0-2c9c9e295743');

        -- Inserting into TRANSCODING table
        INSERT INTO "TRANSCODING" (video_id, status_id) VALUES
        ('d3eb7b89-89b1-4067-967d-625bf438b173', 1),
        ('7f12bce6-9abf-4e45-bf7a-bd7356d8db6e', 0);

        -- Inserting into DISPUTE_STATUS table
        INSERT INTO "DISPUTE_STATUS" (status_name) VALUES
        ('Pending'),
        ('Resolved');

        -- Inserting into DISPUTE_TYPE table
        INSERT INTO "DISPUTE_TYPE" (type_name, description) VALUES
        ('Copyright', 'Claiming copyright infringement'),
        ('Content', 'Inappropriate content');

        -- Inserting into DISPUTE table
        INSERT INTO "DISPUTE" (video_id, reporter_id, dispute_type_id, status_id) VALUES
        ('d3eb7b89-89b1-4067-967d-625bf438b173', 'f9bcf29e-daf8-4933-8e93-2e7b017c68b2', 1, 1),
        ('7f12bce6-9abf-4e45-bf7a-bd7356d8db6e', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 2, 2);

        -- Inserting into APPEAL_TYPE table
        INSERT INTO "APPEAL_TYPE" (type_name) VALUES
        ('Copyright Claim'),
        ('Content Removal');

        -- Inserting into APPEAL_STATUS table
        INSERT INTO "APPEAL_STATUS" (status_name) VALUES
        ('Pending'),
        ('Approved');

        -- Inserting into APPEAL_REQUEST table
        INSERT INTO "APPEAL_REQUEST" (appeal_type_id, user_id, appeal_id, status_id, reason) VALUES
        (1, 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'e3eb7c89-89b1-4067-967d-625bf438b173', 1, 'Interesting...'),
        (2, 'f9bcf29e-daf8-4933-8e93-2e7b017c68b2', '1f12bfe6-9abf-4e45-bf7a-bd7356d8db6e', 2, 'Not my issue...');

        -- Inserting into VIDEO_VS_REVIEW table
        INSERT INTO "VIDEO_VS_REVIEW" (video_id, status_id) VALUES
        ('d3eb7b89-89b1-4067-967d-625bf438b173', 1),
        ('7f12bce6-9abf-4e45-bf7a-bd7356d8db6e', 0);
        
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

        // Create tables
        await cassandraClient.execute(`
            CREATE TABLE IF NOT EXISTS video_statistics (
                id UUID PRIMARY KEY,
                total_videos int,
                total_views int,
                video_uploads_per_month list<int>
            );
        `);

        await cassandraClient.execute(`
            CREATE TABLE IF NOT EXISTS video_disputes (
                video_id UUID PRIMARY KEY,
                report_count int
            );
        `);

        // Insert sample data
        await cassandraClient.execute(`
            INSERT INTO video_statistics (id, total_videos, total_views, video_uploads_per_month)
            VALUES (uuid(), 12332, 1231, [10, 30, 40, 50, 40, 20, 10, 38, 89, 34, 23, 45])
        `);

        // Insert sample data
        await cassandraClient.execute(`
            INSERT INTO video_disputes (video_id, report_count)
            VALUES (d3eb7b89-89b1-4067-967d-625bf438b173, 15)
        `);

        await cassandraClient.execute(`
            INSERT INTO video_disputes (video_id, report_count)
            VALUES (7f12bce6-9abf-4e45-bf7a-bd7356d8db6e, 3)
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