import React, { useState } from 'react';
import { uploadFileInChunks } from './FileUploadLogic';

function FileUploadForm() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (file) {
      // Start uploading file with progress callback
      await uploadFileInChunks(file, (percentage) => setProgress(percentage * 100));
    } else {
      console.log('No file selected');
    }
  };

  return (
    <div>
      <h1>Upload a File</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Upload</button>
      </form>
      
      {progress > 0 && <div>Progress: {progress.toFixed(2)}%</div>}
    </div>
  );
}

export default FileUploadForm;