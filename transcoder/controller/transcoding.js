const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { createDirectoryIfNotExists } = require('./fileUtils');
const { uploadFileToS3 } = require('./s3Utils');
const fs = require('fs');

const EXT_X_VERSION = process.env.EXT_X_VERSION;
const EXT_X_TARGETDURATION = process.env.segmentDuration;
const EXT_X_MEDIA_SEQUENCE = 0;

function downscaleVideo(localFilePath, resolution, resolutionSizes) {
    const downscaledFilePath = path.join(path.dirname(localFilePath), `${path.basename(localFilePath, path.extname(localFilePath))}_${resolution}.mp4`);
    return new Promise((resolve, reject) => {
        ffmpeg(localFilePath)
            .outputOptions([
                `-vf scale=${resolutionSizes[resolution]}`,
                '-c:v libx264',
                '-preset fast',
                '-crf 23',
                '-c:a aac',
                '-b:a 128k',
                '-y'
            ])
            .on('end', () => resolve(downscaledFilePath))
            .on('error', reject)
            .save(downscaledFilePath);
    });
}

function transcodeAndUploadSegments(downscaledFilePath, fileKey, resolution, segmentDuration) {
    const segmentOutputDir = path.join(path.dirname(downscaledFilePath), `${path.basename(downscaledFilePath, path.extname(downscaledFilePath))}`);
    createDirectoryIfNotExists(segmentOutputDir);

    return new Promise((resolve, reject) => {
        ffmpeg(downscaledFilePath)
            .outputOptions([
                '-f hls',
                `-hls_time ${segmentDuration}`,
                '-hls_segment_type mpegts',
                '-hls_list_size 0',
                `-hls_segment_filename ${path.join(segmentOutputDir, 'segment_%03d.ts')}`,
                '-hls_flags independent_segments',
                '-y'
            ])
            .output(path.join(segmentOutputDir, 'playlist.m3u8'))
            .on('end', async () => {
                try {
                    const segmentFiles = fs.readdirSync(segmentOutputDir).filter(file => file.endsWith('.ts'));
                    const uploadPromises = segmentFiles.map(segmentFile => uploadFileToS3(path.join(segmentOutputDir, segmentFile), `${fileKey}/${resolution}/${segmentFile}`));
                    await Promise.all(uploadPromises);

                    await uploadFileToS3(path.join(segmentOutputDir, 'playlist.m3u8'), `${fileKey}/${resolution}/playlist.m3u8`);
                    resolve(`All ${resolution} segments and playlist uploaded successfully`);
                } catch (error) {
                    reject(error);
                }
            })
            .on('error', reject)
            .run();
    });
}

function createMasterPlaylist(fileKey, resolutions, resolutionSizes, outputDir) {
    const masterPlaylistPath = path.join(outputDir, `${path.basename(fileKey, path.extname(fileKey))}_master.m3u8`);

    const masterPlaylistContent = [
        '#EXTM3U',
        `#EXT-X-VERSION:${EXT_X_VERSION}`,
        `#EXT-X-TARGETDURATION:${EXT_X_TARGETDURATION}`,
        `#EXT-X-MEDIA-SEQUENCE:${EXT_X_MEDIA_SEQUENCE}`,
        ...resolutions.map(resolution => {
            return `#EXT-X-STREAM-INF:BANDWIDTH=${resolution === '720p' ? 3000000 : resolution === '480p' ? 1500000 : 500000},RESOLUTION=${resolutionSizes[resolution]}\n${resolution}/playlist.m3u8`;
        })
    ].join('\n');

    fs.writeFileSync(masterPlaylistPath, masterPlaylistContent);
    return masterPlaylistPath;
}

module.exports = { downscaleVideo, transcodeAndUploadSegments, createMasterPlaylist };