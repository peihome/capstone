import React, { useState, useRef, useEffect } from "react";
import videojs from "video.js";
import Player from "video.js/dist/types/player";
import { useSocket } from "./SocketProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useParams } from "react-router-dom";

export default function SyncS3VideoPlayer() {
	const socket = useSocket();
	const [videoUrl, setVideoUrl] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const videoRef = useRef<HTMLVideoElement>(null);
	const playerRef = useRef<Player | null>(null);

	const { roomId } = useParams<{ roomId: string }>();

	useEffect(() => {
		let player: Player | null = null;

		if (videoUrl && videoRef.current) {
			player = videojs(videoRef.current, {
				controls: true,
				autoplay: false,
				sources: [{ src: videoUrl, type: "application/x-mpegURL" }],
				fluid: true,
				muted: true,
				techOrder: ["html5"],
			});

			playerRef.current = player;

			player.on("error", () => {
				setErrorMessage("Error attempting to play the video.");
			});

			socket?.on("sync-video", ({ command }) => {
				if (command === "play" && player) {
					player.play();
				} else if (command === "pause" && player) {
					player.pause();
				}
			});

			socket?.on("set-time", ({ currentTime }) => {
				if (playerRef.current) {
					playerRef.current.currentTime(currentTime);
				}
			});

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
				socket?.off("sync-video");
				socket?.off("set-time");
				socket?.off("set-video-url");
			};
		}

		socket?.on("set-video-url", ({ videoUrl }) => {
			setVideoUrl(videoUrl);
		});
	}, [videoUrl, roomId, socket]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!videoUrl.trim()) {
			setErrorMessage("Please enter a valid video URL");
			return;
		}
		setErrorMessage("");
		socket?.emit("set-video-url", { roomId, videoUrl });
	};

	const handlePlay = () => {
		if (playerRef.current) {
			playerRef.current.play();
			socket?.emit("video-command", { roomId, command: "play" });
		}
	};

	const handlePause = () => {
		if (playerRef.current) {
			playerRef.current.pause();
			socket?.emit("video-command", { roomId, command: "pause" });
		}
	};

	const handleSync = () => {
		if (playerRef.current) {
			const currentTime = playerRef.current.currentTime();
			socket?.emit("sync-time", { roomId, currentTime });
		}
	};

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setVideoUrl(e.target.value);
		socket?.emit("update-video-url", { roomId, videoUrl: e.target.value });
	};

	return (
		<Card>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4 mb-4">
					<Input
						type="text"
						placeholder="Enter S3 Video or M3U8 URL"
						value={videoUrl}
						onChange={handleUrlChange}
					/>
					<Button type="submit" className="w-full">
						Play Video
					</Button>
				</form>

				{errorMessage && (
					<Alert variant="destructive" className="mb-4">
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>
				)}

				{videoUrl && (
					<div className="space-y-4">
						<div className="aspect-video">
							<video
								ref={videoRef}
								className="video-js vjs-default-skin w-full h-full"
							></video>
						</div>
						<div className="flex space-x-2">
							<Button onClick={handlePlay}>Play</Button>
							<Button onClick={handlePause}>Pause</Button>
							<Button onClick={handleSync}>Sync</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
