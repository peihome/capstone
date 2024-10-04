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
          autoplay: true,
          sources: [{ src: videoUrl, type: 'application/x-mpegURL' }],
          fluid: true,
          techOrder: ['html5'],
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
    <div className="video-container">
      <form onSubmit={handleSubmit} className="video-form">
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
        <div className="video-player-container">
          <video
            ref={videoRef}
            className="video-js vjs-default-skin"
          ></video>
        </div>
      )}
    </div>
  );
};

export default S3VideoPlayer;