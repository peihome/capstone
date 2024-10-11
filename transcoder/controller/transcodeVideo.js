const path = require('path');
const { downloadFileFromS3, uploadFileToS3 } = require('./s3Utils');
const { createDirectoryIfNotExists, cleanupLocalFiles } = require('./fileUtils');
const { downscaleVideo, transcodeAndUploadSegments, createMasterPlaylist } = require('./transcoding');
const s3 = require('./s3Client');

async function transcodeVideo(etag) {
    try {
        const objects = await s3.listObjectsV2({ Bucket: process.env.s3BucketName }).promise();
        const s3Object = objects.Contents.find(obj => obj.ETag.replace(/^"|"$/g, '') === etag);

        if (!s3Object) {
            throw new Error('No files found with the given ETag');
        }

        const fileKey = s3Object.Key;
        const localFilePath = path.join(__dirname, '../output', fileKey.replace(/ /g, '_'));

        createDirectoryIfNotExists(path.dirname(localFilePath));
        await downloadFileFromS3(fileKey, localFilePath);

        const resolutions = process.env.video_resolutions.split(',');
        const resolutionSizes = JSON.parse(''+process.env.video_resolution_sizes);

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

        // Copy the original file to the new folder
        await s3.copyObject({
            Bucket: process.env.s3BucketName,
            CopySource: `${process.env.s3BucketName}/${fileKey}`,
            Key: `archived/${fileKey.replace(/ /g, '_')}`
        }).promise();

        // Delete the original file after copying
        await s3.deleteObject({
            Bucket: process.env.s3BucketName,
            Key: fileKey
        }).promise();

        // Cleanup local files
        const cleanupPaths = [localFilePath, ...downscaledFiles, masterPlaylistPath, ...resolutions.map(resolution => path.join(path.dirname(localFilePath), `${path.basename(fileKey.replace(/ /g, '_'), path.extname(fileKey.replace(/ /g, '_')))}_${resolution}`))];
        await cleanupLocalFiles(cleanupPaths);
    } catch (error) {
        console.error('Error during transcoding:', error);
        throw error;
    }
}

module.exports = { transcodeVideo };