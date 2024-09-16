import React, { useState } from 'react';
import ReactPlayer from 'react-player';

const S3VideoPlayer = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle form submission to set the custom video URL
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!videoUrl || videoUrl.trim() === '') {
      setErrorMessage('Please enter a valid video URL');
      return;
    }
    setErrorMessage('');
  };

  // Check if the file is HLS (m3u8 format)
  const isHLS = (url) => url.endsWith('.m3u8');

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter S3 Video or M3U8 URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        <button type="submit">Play Video</button>
      </form>

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      {videoUrl && (
        <ReactPlayer
          url={videoUrl}
          controls={true}  // Show player controls
          width="640px"
          height="360px"
          playing={false}  // Video won't autoplay
          config={{
            file: {
              forceHLS: isHLS(videoUrl),  // Force HLS if the file is m3u8
            },
          }}
        />
      )}
    </div>
  );
};

export default S3VideoPlayer;