const s3 = require('./s3Client');
const fs = require('fs');
const stream = require('stream');

async function downloadFileFromS3(fileKey, localFilePath) {
    const fileStream = s3.getObject({ Bucket: process.env.s3BucketName, Key: fileKey }).createReadStream();
    const fileWriteStream = fs.createWriteStream(localFilePath);
    return new Promise((resolve, reject) => {
        fileStream.pipe(fileWriteStream)
            .on('finish', resolve)
            .on('error', reject);
    });
}

function uploadFileToS3(filePath, s3Key) {
    const fileStream = fs.createReadStream(filePath);
    return s3.upload({
        Bucket: process.env.s3BucketName,
        Key: s3Key,
        Body: fileStream
    }).promise();
}

module.exports = { downloadFileFromS3, uploadFileToS3 };