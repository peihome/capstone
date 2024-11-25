import axios from 'axios';

const backend_PORT = process.env.backend_PORT;
const initiateUrl = `http://localhost:${backend_PORT}/initiate`;
const uploadUrl = `http://localhost:${backend_PORT}/upload`;
const completeUrl = `http://localhost:${backend_PORT}/complete`;
const kafkaSendUrl = `http://${process.env.transcoder_HOST}:${process.env.transcoder_PORT}/send`;

export async function uploadFileInChunks(file, onProgress) {
  const chunkSize = 100 * 1024 * 1024; // 100 MB
  const totalChunks = Math.ceil(file.size / chunkSize);
  const uploadPromises = [];
  let uploadId;

  // Step 1: Initiate Multipart Upload
  try {
    const response = await axios.post(initiateUrl, { fileName: file.name });
    uploadId = response.data.uploadId;
    
    console.log(uploadId);
  } catch (error) {
    console.error('Failed to initiate multipart upload:', error);
    return;
  }

  // Step 2: Iterate over each chunk and prepare promises
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex);
    formData.append('totalChunks', totalChunks);
    formData.append('fileName', file.name);
    formData.append('uploadId', uploadId);

    // Create a promise for each chunk upload
    const uploadPromise = uploadChunk(formData, onProgress, chunkIndex, totalChunks);
    uploadPromises.push(uploadPromise);
  }

  // Wait for all chunk uploads to complete
  try {
    const responses = await Promise.all(uploadPromises);
    console.log('All chunks uploaded successfully!');

    // Step 3: Complete Multipart Upload
    const parts = [];
    responses.forEach((response, index) => {
      parts.push({
        PartNumber: index + 1,
        ETag: response.ETag
      });
    });

    console.log("parts" + parts);

    const completeResponse = await axios.post(completeUrl, {
      uploadId,
      fileName: file.name,
      parts: parts,
    });

    //Produce Message to Kafka for ABS transcoding
    const finalETag = completeResponse.data.ETag.replace(/^"|"$/g, '');

    const title = "Sample Title";
    const description = "Sample";
    const user_id = localStorage.getItem('user_id');

    const messageData = {
      finalETag,
      title,
      description,
      user_id
    };

    await axios.post(kafkaSendUrl, { message: messageData });
    console.log('Final ETag sent to Kafka!');

  } catch (error) {
    console.error('Failed to upload one or more chunks or complete the upload:', error);
  }
}

async function uploadChunk(formData, onProgress, chunkIndex, totalChunks) {
  try {
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = ((chunkIndex + 1) / totalChunks) * (progressEvent.loaded / progressEvent.total);
          onProgress(progress);
        }
      }
    });

    // Return ETag from the response
    return response.data; // Ensure your server returns the ETag in the response
  } catch (error) {
    throw error;
  }
}