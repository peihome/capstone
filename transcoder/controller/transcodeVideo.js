const path = require('path');
const { downloadFileFromS3, uploadFileToS3 } = require('./s3Utils');
const { createDirectoryIfNotExists, cleanupLocalFiles } = require('./fileUtils');
const { downscaleVideo, transcodeAndUploadSegments, createMasterPlaylist } = require('./transcoding');
const s3 = require('./s3Client');
const backendHOST = `http://localhost:${process.env.backend_PORT}`;
const axios = require('axios');

const { exec } = require('child_process');

async function transcodeVideo(etag, title, description, user_id) {
    let video_id = null;

    try {
        const videoData = {
            title,
            description,
            user_id,
            etag
        };
        const createVideoResponse = await axios.post(`${backendHOST}/api/video`, videoData);
        video_id = createVideoResponse.data.video.video_id;
        if (!video_id) {
            console.error('Video creation failed: No video ID returned');
            return;
        }


        const objects = await s3.listObjectsV2({ Bucket: process.env.s3BucketName }).promise();
        const s3Object = objects.Contents.find(obj => obj.ETag.replace(/^"|"$/g, '') === etag);

        if (!s3Object) {
            throw new Error('No files found with the given ETag');
        }

        const fileKey = s3Object.Key;
        const localFilePath = path.join(__dirname, '../output', fileKey.replace(/ /g, '_'));

        createDirectoryIfNotExists(path.dirname(localFilePath));
        await downloadFileFromS3(fileKey, localFilePath);

        // Extract a thumbnail from the first segment of the video
        const thumbnailName = `${path.basename(fileKey.replace(/ /g, '_'), path.extname(fileKey))}.jpg`;
        const thumbnailPath = path.join(path.dirname(localFilePath), thumbnailName);
        await extractThumbnail(localFilePath, thumbnailPath);

        // Upload the thumbnail to the same folder as master.m3u8
        const thumbnailKey = `${fileKey.replace(/ /g, '_')}/${thumbnailName}`;
        await uploadFileToS3(thumbnailPath, thumbnailKey);

        const thumbnailUrl = `https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/${thumbnailKey}`;

        const resolutions = process.env.video_resolutions.split(',');
        const resolutionSizes = JSON.parse('' + process.env.video_resolution_sizes);

        const downscaledFiles = await Promise.all(
            resolutions.map(resolution => downscaleVideo(localFilePath, resolution, resolutionSizes))
        );

        await Promise.all(
            resolutions.map((resolution, index) =>
                transcodeAndUploadSegments(downscaledFiles[index], fileKey.replace(/ /g, '_'), resolution, process.env.segmentDuration)
            )
        );

        const masterPlaylistPath = createMasterPlaylist(fileKey.replace(/ /g, '_'), resolutions, resolutionSizes, path.dirname(localFilePath));
        await uploadFileToS3(masterPlaylistPath, `${fileKey.replace(/ /g, '_')}/master.m3u8`);

        console.log('Master playlist created and uploaded successfully');

        // Copy the original file to the archived folder
        const archivedKey = `archived/${fileKey.replace(/ /g, '_')}`;
        await s3.copyObject({
            Bucket: process.env.s3BucketName,
            CopySource: `${process.env.s3BucketName}/${fileKey}`,
            Key: archivedKey
        }).promise();

        const archivedUrl = `https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/${archivedKey}`;

        // Delete the original file after copying
        await s3.deleteObject({
            Bucket: process.env.s3BucketName,
            Key: fileKey
        }).promise();

        // Cleanup local files
        const cleanupPaths = [localFilePath, thumbnailPath, ...downscaledFiles, masterPlaylistPath, ...resolutions.map(resolution => path.join(path.dirname(localFilePath), `${path.basename(fileKey.replace(/ /g, '_'), path.extname(fileKey.replace(/ /g, '_')))}_${resolution}`))];
        await cleanupLocalFiles(cleanupPaths);

        const videoUrl = `https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/${fileKey.replace(/ /g, '_')}/master.m3u8`;

        // Send the video transcoding completion status
        await axios.post(`${backendHOST}/api/videos/${video_id}/transcoding/complete`, {
            video_id,
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
            archived_url: archivedUrl
        });

        console.log(`Archived MP4 video URL: ${archivedUrl}`);
    } catch (error) {
        console.error('Error during transcoding:', error);

        if (video_id) {
            try {
                console.log(`Deleting video entry for ID: ${video_id} due to error.`);
                await axios.delete(`${backendHOST}/api/video/${video_id}`);
                console.log(`Video entry with ID: ${video_id} deleted successfully.`);
            } catch (deleteError) {
                console.error(`Failed to delete video entry for ID: ${video_id}:`, deleteError.message);
            }
        }

        throw error;
    }
}

function extractThumbnail(videoPath, thumbnailPath) {
    return new Promise((resolve, reject) => {
        const command = `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 "${thumbnailPath}"`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Error extracting thumbnail:', stderr);
                return reject(error);
            }
            resolve();
        });
    });
}

module.exports = { transcodeVideo };