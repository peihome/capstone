import React, { useState, useRef, useEffect } from 'react';
import videojs from 'video.js';

const S3VideoPlayer = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (videoUrl) {
      if (videoRef.current) {
        const player = videojs(videoRef.current, {
          controls: true,
          autoplay: true, // Auto start video
          sources: [{ src: videoUrl, type: 'application/x-mpegURL' }],
          fluid: true, // Make the player fluid
          techOrder: ['html5'], // Ensure HTML5 tech order
        });

        playerRef.current = player;

        player.on('error', (event) => {
          console.error('Video.js error:', event);
          setErrorMessage('Error attempting to play the video.');
        });

        return () => {
          if (playerRef.current) {
            playerRef.current.dispose();
          }
        };
      }
    }
  }, [videoUrl]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!videoUrl || videoUrl.trim() === '') {
      setErrorMessage('Please enter a valid video URL');
      return;
    }
    setErrorMessage('');
  };

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
        <div>
          <video
            ref={videoRef}
            className="video-js vjs-default-skin"
            width="640"
            height="360"
            controls
          >
          </video>
        </div>
      )}
    </div>
  );
};

export default S3VideoPlayer;