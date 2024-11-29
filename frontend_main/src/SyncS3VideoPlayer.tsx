import React, { useState, useRef, useEffect } from "react";
import videojs from "video.js";
import { useSocket } from "./SocketProvider.jsx";
import Player from "video.js/dist/types/player.js";

const roomId = window.location.hash.split("/")[2];

const SyncS3VideoPlayer = () => {
	const socket = useSocket();

	const [videoUrl, setVideoUrl] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const videoRef = useRef(null);
	const playerRef = useRef<Player | null>(null);

	useEffect(() => {
		let player: Player | null;
		if (videoUrl) {
			// Initialize Video.js player
			if (videoRef.current) {
				player = videojs(videoRef.current, {
					controls: true,
					autoplay: false,
					sources: [{ src: videoUrl, type: "application/x-mpegURL" }],
					fluid: true,
					muted: true,
					techOrder: ["html5"],
				});
			}

			if (videoRef.current) {
				player = videojs(videoRef.current, {
					controls: true,
					autoplay: false,
					sources: [{ src: videoUrl, type: "application/x-mpegURL" }],
					fluid: true,
					muted: true,
					techOrder: ["html5"],
				});

				if (player) {
					playerRef.current = player;

					// Handle Video.js errors
					player.on("error", () => {
						setErrorMessage("Error attempting to play the video.");
					});
				}
			}

			// Handle play/pause commands from server
			socket?.on("sync-video", ({ command }) => {
				console.log("sync-video command received : " + command);
				if (command === "play") {
					if (player) {
						player.play();
					}
				} else if (command === "pause") {
					if (player) {
						player.pause();
					}
				}
			});

			socket?.on("set-time", ({ currentTime }) => {
				if (playerRef.current) {
					console.log(`Setting time to: ${currentTime}`);
					playerRef.current.currentTime(currentTime);
				}
			});

			// Emit current video time to sync periodically (every second)
			const syncInterval = setInterval(() => {
				if (player && !player.paused()) {
					socket?.emit("video-sync", {
						roomId,
						currentTime: player.currentTime(),
					});
				}
			}, 1000);

			return () => {
				clearInterval(syncInterval);
				if (playerRef.current) {
					playerRef.current.dispose();
				}

				// Remove socket listeners
				socket?.off("sync-video");
				socket?.off("set-time");
				socket?.off("set-video-url");
			};
		}

		socket?.on("set-video-url", ({ videoUrl }) => {
			console.log("Got It " + videoUrl);
			setVideoUrl(videoUrl);
		});
	}, [videoUrl, roomId]);

	// Handle Submit to set video URL
	const handleSubmit = (e: { preventDefault: () => void }) => {
		e.preventDefault();
		if (!videoUrl.trim()) {
			setErrorMessage("Please enter a valid video URL");
			return;
		}
		setErrorMessage("");
		socket?.emit("set-video-url", { roomId, videoUrl });
	};

	// Play video and emit play command
	const handlePlay = () => {
		if (playerRef.current) {
			playerRef.current.play();
			// Emit play command with roomId and command
			console.log(roomId);
			socket?.emit("video-command", { roomId, command: "play" });
		}
	};

	// Pause video and emit pause command
	const handlePause = () => {
		if (playerRef.current) {
			playerRef.current.pause();
			console.log(roomId);
			socket?.emit("video-command", { roomId, command: "pause" });
		}
	};

	// Handle sync command
	const handleSync = () => {
		if (playerRef.current) {
			const currentTime = playerRef.current.currentTime(); // Get current playback time
			console.log(`Syncing time: ${currentTime} in Room: ${roomId}`);
			socket?.emit("sync-time", { roomId, currentTime }); // Emit sync event
		}
	};

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setVideoUrl(e.target.value);
		console.log(e.target.value + " : " + roomId);
		socket?.emit("update-video-url", {
			roomId: roomId,
			videoUrl: e.target.value,
		});
	};

	return (
		<div className="video-container">
			<form onSubmit={handleSubmit} className="video-form">
				<input
					type="text"
					placeholder="Enter S3 Video or M3U8 URL"
					value={videoUrl}
					onChange={(e) => handleUrlChange(e)}
				/>
				<button type="submit">Play Video</button>
			</form>

			{errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

			{videoUrl && (
				<div className="video-player-container">
					<video
						ref={videoRef}
						className="video-js vjs-default-skin"
					></video>
					<div className="controls">
						<button onClick={handlePlay}>Play</button>
						<button onClick={handlePause}>Pause</button>
						<button onClick={handleSync}>Sync</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default SyncS3VideoPlayer;
