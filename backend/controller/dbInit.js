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
            dispute_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            video_id UUID NOT NULL, 
            dispute_type_id INT NOT NULL,
            status_id INT NOT NULL,
            FOREIGN KEY (video_id) REFERENCES "VIDEO"(video_id) ON DELETE CASCADE,
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

        INSERT INTO "ROLE" (role_id, role_name, description) VALUES
        (1, 'Admin', 'Administrator role with full access'),
        (2, 'User', 'Standard user with limited access');

        -- Inserting into USER_STATUS table
        INSERT INTO "USER_STATUS" (status_id, status_name, description) VALUES
        (0, 'Suspended', 'User is suspended'),
        (1, 'Active', 'User is active and can perform actions'),
        (-1, 'Inactive', 'User is inactive and cannot perform actions');

        -- Inserting into USER table
        INSERT INTO "USER" (user_id, name, email, status_id) VALUES
        ('a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'John Doe', 'john.doe@example.com', 1),
        ('f9bcf29e-daf8-4933-8e93-2e7b017c68b2', 'Jane Smith', 'jane.smith@example.com', 1);

        -- Inserting into USER_ROLE table
        INSERT INTO "USER_ROLE" (user_id, role_id) VALUES
        ('a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 1),
        ('f9bcf29e-daf8-4933-8e93-2e7b017c68b2', 2);

        -- Inserting into CHANNEL_STATUS table
        INSERT INTO "CHANNEL_STATUS" (status_id, status_name, description) VALUES
        (1, 'Active', 'Channel is active and can broadcast content'),
        (-1, 'Inactive', 'Channel is inactive and cannot broadcast content');

        -- Inserting into CHANNEL table
        INSERT INTO "CHANNEL" (channel_id, name, description, user_id, status_id) VALUES
        ('b3e2f383-bbdf-41b1-baba-d77282654e1d', 'Tech Channel', 'A channel for tech discussions', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 1),
        ('8bb4e74f-b6d9-41e0-82d2-9a46c684762d', 'Gaming Channel', 'A channel for gaming content', 'f9bcf29e-daf8-4933-8e93-2e7b017c68b2', -1);

        -- Inserting into USER_VS_CHANNEL table
        INSERT INTO "USER_VS_CHANNEL" (user_id, channel_id) VALUES
        ('a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('f9bcf29e-daf8-4933-8e93-2e7b017c68b2', '8bb4e74f-b6d9-41e0-82d2-9a46c684762d');

        -- Inserting into VIDEO table
        INSERT INTO "VIDEO" (video_id, title, description, etag, bucket_name, transcoding_status, user_id, video_url, channel_id) VALUES
        ('d30fa567-5b8e-4f57-bd68-4b1a3d7d9b8e', 'About Eating Meat', 'Nas Daily explores the cultural, ethical, and environmental questions surrounding meat consumption, sharing insights on its global impact.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/About_Eating_Meat..._-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('9e3b024f-3df6-4b2a-bb0e-d5a36bda74c6', 'He Built a Robot From Trash!', 'Meet an innovative individual who constructed a functioning robot using discarded materials, demonstrating creativity and resourcefulness.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/He_Built_A_Robot_From_Trash!!_-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('b4b503bb-e40f-4dfd-a6b3-bc5c217e04f4', 'He Knows Every Language!', 'Discover the story of a remarkable polyglot who has mastered multiple languages, bridging cultures and showcasing the power of communication.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/He_Knows_Every_Language!_-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('ae4b8c98-ea34-41f9-b3d0-d4b963d899a6', 'He Wants to Beat Google', 'This video highlights a tech entrepreneur’s ambitious mission to create a search engine that competes with the giants, taking on Google with unique approaches.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/He_Wants_To_Beat_Google_-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('5170da8e-2724-4e13-84ae-387c7679ab68', 'How Cheap Is Egypt?', 'Nas Daily examines the cost of living in Egypt, comparing it to global standards and revealing what life is like on a budget in this diverse country.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/How_Cheap_Is_Egypt_!_-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('aa3c49f4-ef5e-43a7-8a5e-e43a1c5e4a5c', 'How Expensive Is Apple?', 'A deep dive into the high prices of Apple products, analyzing what makes them premium and whether they’re worth the cost.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/How_Expensive_Is_Apple__-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('509e0f67-d9c7-4d7b-9a5e-d7c9bc750d9b', 'How I Learned to Swim', 'A personal journey of overcoming fear and learning to swim, encouraging viewers to take on new challenges and conquer fears.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/How_I_Learned_To_Swim_-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('602fb2b8-fbd9-42cc-b80c-b1d20798a2b1', 'How Singapore Drives', 'A look into Singapore’s efficient transportation system, showcasing how technology and strict policies create one of the world''s best driving environments.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/How_Singapore_Drives_-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('4ec80e66-90cf-4c63-8b1d-d4e1cb4de431', 'She Can Build a House From Glass', 'Discover an architect’s unique project of constructing homes out of glass, challenging traditional building methods with innovation and transparency.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/She_Can_Build_A_House_From_Glass_-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('9f036a5f-d7ab-4d4f-8772-937d9f93b458', 'The Coolest Museum That You’ve Never Seen', 'Explore a lesser-known but incredible museum filled with fascinating exhibits and cutting-edge displays that leave visitors in awe.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/The_Coolest_Museum_That_You''ve_Never_Seen._-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('d6e6e5f5-c313-4a68-8fa5-4bfa5fda128b', 'The Country of Olives', 'An introduction to a country famous for its olive production, exploring its agricultural heritage and the role olives play in its culture and economy.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/The_Country_Of_Olives_-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('120fa7b4-31ae-4644-b568-6cc6d432826b', 'The Country of Potatoes!', 'Nas Daily takes you to a country where potatoes are central to culture and cuisine, revealing interesting facts about this beloved crop.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/The_Country_Of_Potatoes!_-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('d99ab256-14ba-4b63-857d-2e8cb2f31ef6', 'The Country With No Army!', 'Discover the unique story of a nation that has maintained peace without a military, offering an inspiring perspective on conflict resolution.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/The_Country_With_No_Army!_-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('7a2f3b59-ef02-4f5c-bd99-16f69e3fbc4a', 'The Ocean Disappeared!', 'A fascinating look at a location where an entire ocean vanished, examining the environmental and geological impacts of this mysterious phenomenon.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/The_Ocean_Disappeared!_-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('315d7997-2b5c-4d43-9f61-91f3f4d74dfb', 'The Visa-Free Country', 'Learn about a country that opens its doors without requiring visas, promoting travel and connection with a welcoming approach to visitors.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/The_Visa-Free_Country_-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('3c7e0742-6cd9-4fd4-b440-7ac859a3f607', 'Where Eggs Don’t Fall!', 'Discover a place with a gravitational anomaly where eggs seem to defy physics, sparking curiosity and scientific questions.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/Where_Eggs_Don''t_Fall!_-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('a6d12562-00fc-4d0b-b603-1b47ad1f63a3', 'Why Canadians Are the Best', 'A heartwarming tribute to Canada and its people, celebrating Canadian kindness, inclusivity, and friendliness on the global stage.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/Why_Canadians_Are_The_Best_-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d'),
        ('c3e62f56-1017-46c9-a2a2-d3e26bcde923', 'World’s Best Metro!', 'Nas Daily examines a world-class metro system that sets the standard for public transportation with its efficiency, cleanliness, and design.', 'etag_abc123', 'tech_bucket', 'Completed', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/World''s_Best_Metro!_-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8', 'b3e2f383-bbdf-41b1-baba-d77282654e1d');
       
       INSERT INTO "COMMENT" (comment_id, content, user_id, video_id) VALUES
        ('b4e12c1f-0cf3-4b25-8506-5a4bdbd11a8d', 'Great video!', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 'd30fa567-5b8e-4f57-bd68-4b1a3d7d9b8e'),
        ('d2c3a564-9b9b-40ac-8778-6f3b4d1e7b43', 'Very helpful!', 'f9bcf29e-daf8-4933-8e93-2e7b017c68b2', '9e3b024f-3df6-4b2a-bb0e-d5a36bda74c6');
       
       INSERT INTO "NOTIFICATION_TYPE" (type_name) VALUES
        ('Video Uploaded'),
        ('Comment Received');
       
      INSERT INTO "USERS_VS_NOTIFICATION" (user_id, notification_type_id) VALUES
        ('a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 1),
        ('f9bcf29e-daf8-4933-8e93-2e7b017c68b2', 2);
       
      INSERT INTO "SUBSCRIPTION" (subscriber_id, subscribed_to_channel_id) VALUES
        ('a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', '8bb4e74f-b6d9-41e0-82d2-9a46c684762d'),
        ('f9bcf29e-daf8-4933-8e93-2e7b017c68b2', 'b3e2f383-bbdf-41b1-baba-d77282654e1d');
       
       
       INSERT INTO "PLAYLIST" (playlist_id, name, user_id) VALUES
        ('111fa56b-8e5a-4671-b0de-20754f9d9572', 'Tech Videos', 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f'),
        ('7d81b5c8-f4c5-43f3-b8f0-2c9c9e295743', 'Gaming Highlights', 'f9bcf29e-daf8-4933-8e93-2e7b017c68b2');

        -- Inserting into VIDEO_PLAYLIST table
        INSERT INTO "VIDEO_PLAYLIST" (video_id, playlist_id) VALUES
        ('d30fa567-5b8e-4f57-bd68-4b1a3d7d9b8e', '111fa56b-8e5a-4671-b0de-20754f9d9572'),
        ('9e3b024f-3df6-4b2a-bb0e-d5a36bda74c6', '7d81b5c8-f4c5-43f3-b8f0-2c9c9e295743');
       
        -- Inserting into TRANSCODING table
        INSERT INTO "TRANSCODING" (video_id, status_id) VALUES
        ('9e3b024f-3df6-4b2a-bb0e-d5a36bda74c6', 1),
        ('d30fa567-5b8e-4f57-bd68-4b1a3d7d9b8e', 0);

        -- Inserting into DISPUTE_STATUS table
        INSERT INTO "DISPUTE_STATUS" (status_id, status_name) VALUES
        (-1, 'Rejected'),
        (0, 'Reported'),
        (1, 'Approved');

        -- Inserting into DISPUTE_TYPE table
        INSERT INTO "DISPUTE_TYPE" (type_name, description) VALUES
        ('Copyright', 'Claiming copyright infringement'),
        ('Content', 'Inappropriate content');

        -- Inserting into DISPUTE table

        -- Inserting into APPEAL_TYPE table
        INSERT INTO "APPEAL_TYPE" (appeal_type_id, type_name) VALUES
        (1, 'Copyright Claim'),
        (2, 'Content Removal');

        -- Inserting into APPEAL_STATUS table
        INSERT INTO "APPEAL_STATUS" (status_id, status_name) VALUES
        (-1, 'Rejected'),
        (0, 'Pending'),
        (1, 'Approved');

        -- Inserting into APPEAL_REQUEST table
        INSERT INTO "APPEAL_REQUEST" (appeal_id, appeal_type_id, user_id, status_id, reason, video_id) VALUES
        ('e1f3e4c5-3851-40b9-a6e3-fb93c0c4311b', 1, 'a3d9b643-17ab-4bfe-96b9-b3cddac1ee7f', 1, 'Interesting...', '9e3b024f-3df6-4b2a-bb0e-d5a36bda74c6'),
        ('f7b6a2d1-73e7-4f87-b536-6c1e8ac3507a', 2, 'f9bcf29e-daf8-4933-8e93-2e7b017c68b2', 0, 'Not my issue...', 'd30fa567-5b8e-4f57-bd68-4b1a3d7d9b8e');

        -- Inserting into VIDEO_VS_REVIEW table
        INSERT INTO "VIDEO_VS_REVIEW" (video_id, status_id) VALUES
        ('d30fa567-5b8e-4f57-bd68-4b1a3d7d9b8e', 1),
        ('9e3b024f-3df6-4b2a-bb0e-d5a36bda74c6', 0);
        
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
            CREATE TABLE IF NOT EXISTS video_dispute_count (
                video_id UUID PRIMARY KEY,
                report_count counter
            );
        `);

        await cassandraClient.execute(`
            CREATE TABLE IF NOT EXISTS video_vs_reporter (
                video_id UUID,
                user_id UUID,
                reported_at TIMESTAMP,
                PRIMARY KEY (video_id, user_id)
            );
        `);

        await cassandraClient.execute(`
            CREATE TABLE video_counters (
                video_id UUID PRIMARY KEY,
                views COUNTER,
                likes COUNTER,
                dislikes COUNTER
            );

        `);

        // Insert sample data
        await cassandraClient.execute(`
            INSERT INTO video_statistics (id, total_videos, total_views, video_uploads_per_month)
            VALUES (uuid(), 12332, 1231, [10, 30, 40, 50, 40, 20, 10, 38, 89, 34, 23, 45])
        `);

        // Insert sample data
        /*
        await cassandraClient.execute(`
            INSERT INTO video_dispute_count (video_id, report_count)
            VALUES (d30fa567-5b8e-4f57-bd68-4b1a3d7d9b8e, 15)
        `);

        await cassandraClient.execute(`
            INSERT INTO video_dispute_count (video_id, report_count)
            VALUES (7f12bce6-9abf-4e45-bf7a-bd7356d8db6e, 3)
        `);
        */

        await cassandraClient.execute(`
            INSERT INTO video_vs_reporter (video_id, user_id, reported_at)
            VALUES (7f12bce6-9abf-4e45-bf7a-bd7356d8db6e, e3eb7c89-89b1-4067-967d-625bf438b173, toTimestamp(now()))
        `);

        await cassandraClient.execute(`
            INSERT INTO video_vs_reporter (video_id, user_id, reported_at)
            VALUES (7f12bce6-9abf-4e45-bf7a-bd7356d8db6e, 1f12bfe6-9abf-4e45-bf7a-bd7356d8db6e, toTimestamp(now()))
        `);

        
        
        
        //Video metadata
        
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (d30fa567-5b8e-4f57-bd68-4b1a3d7d9b8e, 'About Eating Meat', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/About+Eating+Meat...+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900)
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (9e3b024f-3df6-4b2a-bb0e-d5a36bda74c6,  'He Built a Robot From Trash!', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/He+Built+A+Robot+From+Trash!!+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (b4b503bb-e40f-4dfd-a6b3-bc5c217e04f4,  'He Knows Every Language!', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/He+Knows+Every+Language!+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (ae4b8c98-ea34-41f9-b3d0-d4b963d899a6,  'He Wants to Beat Google', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/He+Wants+To+Beat+Google+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (5170da8e-2724-4e13-84ae-387c7679ab68,  'How Cheap Is Egypt?', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/How+Cheap+Is+Egypt_!+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (aa3c49f4-ef5e-43a7-8a5e-e43a1c5e4a5c,  'How Expensive Is Apple?', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/How+Expensive+Is+Apple_+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (509e0f67-d9c7-4d7b-9a5e-d7c9bc750d9b,  'How I Learned to Swim', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/How+I+Learned+To+Swim+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (602fb2b8-fbd9-42cc-b80c-b1d20798a2b1,  'How Singapore Drives', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/How+Singapore+Drives+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (4ec80e66-90cf-4c63-8b1d-d4e1cb4de431,  'She Can Build a House From Glass', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/She+Can+Build+A+House+From+Glass+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (9f036a5f-d7ab-4d4f-8772-937d9f93b458,  'The Coolest Museum That You''ve Never Seen', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/The+Coolest+Museum+That+You''ve+Never+Seen.+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (d6e6e5f5-c313-4a68-8fa5-4bfa5fda128b,  'The Country of Olives', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/The+Country+Of+Olives+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (120fa7b4-31ae-4644-b568-6cc6d432826b,  'The Country of Potatoes!', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/The+Country+Of+Potatoes!+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (d99ab256-14ba-4b63-857d-2e8cb2f31ef6,  'The Country With No Army!', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/The+Country+With+No+Army!+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (7a2f3b59-ef02-4f5c-bd99-16f69e3fbc4a,  'The Ocean Disappeared!', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/The+Ocean+Disappeared!+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (315d7997-2b5c-4d43-9f61-91f3f4d74dfb,  'The Visa-Free Country', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/The+Visa-Free+Country+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (3c7e0742-6cd9-4fd4-b440-7ac859a3f607,  'Where Eggs Don''t Fall!', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/Where+Eggs+Don''t+Fall!+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (a6d12562-00fc-4d0b-b603-1b47ad1f63a3,  'Why Canadians Are the Best', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/Why+Canadians+Are+The+Best+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);
        await cassandraClient.execute(`
            INSERT INTO video_metadata_by_id (video_id, title, channel_id, channel_name, published_at, thumbnail, tag, rating)
            VALUES (c3e62f56-1017-46c9-a2a2-d3e26bcde923,  'World''s Best Metro!', b3e2f383-bbdf-41b1-baba-d77282654e1d, 'Nas Daily', '2024-10-10', 'https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/thumbnails/World''s+Best+Metro!+-+Nas+Daily+(1080p%2C+h264)_thumbnail.jpg', {'food', 'meat', 'culture'}, 900);
        `);            
        

        //Views, likes, dislikes
        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = d30fa567-5b8e-4f57-bd68-4b1a3d7d9b8e
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = 9e3b024f-3df6-4b2a-bb0e-d5a36bda74c6
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = b4b503bb-e40f-4dfd-a6b3-bc5c217e04f4
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = ae4b8c98-ea34-41f9-b3d0-d4b963d899a6
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = 5170da8e-2724-4e13-84ae-387c7679ab68
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = aa3c49f4-ef5e-43a7-8a5e-e43a1c5e4a5c
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = 509e0f67-d9c7-4d7b-9a5e-d7c9bc750d9b
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = 602fb2b8-fbd9-42cc-b80c-b1d20798a2b1
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = 4ec80e66-90cf-4c63-8b1d-d4e1cb4de431
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = 9f036a5f-d7ab-4d4f-8772-937d9f93b458
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = d6e6e5f5-c313-4a68-8fa5-4bfa5fda128b
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = 120fa7b4-31ae-4644-b568-6cc6d432826b
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = d99ab256-14ba-4b63-857d-2e8cb2f31ef6
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = 7a2f3b59-ef02-4f5c-bd99-16f69e3fbc4a
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = 315d7997-2b5c-4d43-9f61-91f3f4d74dfb
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = 3c7e0742-6cd9-4fd4-b440-7ac859a3f607
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = a6d12562-00fc-4d0b-b603-1b47ad1f63a3
        `);

        await cassandraClient.execute(`
            UPDATE video_counters 
            SET views = views + 150000, likes = likes + 1200, dislikes = dislikes + 50 
            WHERE video_id = c3e62f56-1017-46c9-a2a2-d3e26bcde923
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