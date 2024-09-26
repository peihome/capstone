const AWS = require('aws-sdk');

const bucketName = process.env.s3BucketName;

// Configure AWS SDK
const s3 = new AWS.S3({
  region: process.env.s3Region,
  credentials: new AWS.Credentials({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  })
});

const handleS3Upload = async (req, res) => {
    try {

      const fileName = req.body.fileName;
      const chunkIndex = parseInt(req.body.chunkIndex);
      const totalChunks = parseInt(req.body.totalChunks);
      const uploadId = req.body.uploadId;
  
      if (!fileName || isNaN(chunkIndex) || isNaN(totalChunks) || !uploadId) {
        throw new Error('Missing required fields');
      }

      console.log(chunkIndex + 1);
  
      // Upload each chunk
      const partParams = {
        Bucket: bucketName,
        Key: fileName,
        UploadId: uploadId,
        PartNumber: chunkIndex + 1,
        Body: req.file.buffer,
      };
  
      const uploadPartResponse = await s3.uploadPart(partParams).promise();
  
      // Track the ETag for each part
      const partETag = { ETag: uploadPartResponse.ETag };

      res.send(partETag);
    } catch (error) {
      console.error('Error uploading chunk:', error);
      res.status(500).send('Error uploading chunk');
    }
  };

const initiateS3Upload = async (req, res) => {
  try {

    const fileName = req.body.fileName;

    if (!fileName) {
      return res.status(400).send('File name is required');
    }

    const params = {
      Bucket: bucketName,
      Key: fileName,
    };

    const response = await s3.createMultipartUpload(params).promise();
    res.json({ uploadId: response.UploadId });
  } catch (error) {
    console.error('Error initiating multipart upload:', error);
    res.status(500).send(error.message);
  }
};

const completeS3Upload = async (req, res) => {
    try {
      const { uploadId, fileName, parts } = req.body;
  
      if (!uploadId || !fileName || !parts || !Array.isArray(parts)) {
        return res.status(400).send('Missing required fields');
      }
  
      const params = {
        Bucket: bucketName,
        Key: fileName,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts
        }
      };
  
      // Complete the multipart upload
      const result = await s3.completeMultipartUpload(params).promise();
  
      console.log(result);
      // Sanitize the result to remove circular references
      const safeResult = JSON.parse(JSON.stringify(result));
  
      res.json(safeResult); // Send the sanitized result of completeMultipartUpload to the client
    } catch (error) {
      console.error('Error completing S3 upload:', error);
      res.status(500).send(error.message);
    }
  }

module.exports = {
  handleS3Upload,
  initiateS3Upload,
  completeS3Upload
};