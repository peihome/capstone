import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import videojs from "video.js";
import "video.js/dist/video-js.css";

interface VideoDetails {
	video_id: number;
	title: string;
	video_description: string;
	user_id: number;
	created_at: string;
	video_url: string;
	channel_name: string;
	channel_description: string;
}

export default function VideoReviewPage() {
	const navigate = useNavigate();
	const { videoId } = useParams<{ videoId: string }>();
	const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const playerRef = useRef<any>(null);

	useEffect(() => {
		const fetchVideoDetails = async () => {
			try {
				const response = await axios.get<VideoDetails>(
					`https://api.nexstream.live/video/${videoId}`
				);
				setVideoDetails(response.data);
			} catch (err) {
				setError(
					"Failed to fetch video details. Please try again later."
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchVideoDetails();
	}, [videoId]);

	useEffect(() => {
		// Polling mechanism to wait until videoRef is ready
		const waitForRef = setInterval(() => {
			if (videoRef.current && videoDetails) {
				// Initialize Video.js player
				const player = videojs(videoRef.current, {
					controls: true,
					autoplay: false,
					preload: "auto",
					responsive: true,
					fluid: false,
					aspectRatio: "16:9",
					sources: [
						{
							src: videoDetails.video_url,
							type: "application/x-mpegURL",
						},
					],
					techOrder: ["html5"],
				});
	
				playerRef.current = player;
	
				player.on("error", (event: any) => {
					console.error("Video.js error:", event);
					setError("Error attempting to play the video.");
				});
	
				// Stop polling once reference is established
				clearInterval(waitForRef);
			}
		}, 100); // Check every 100ms
	
		// Cleanup on unmount or dependency change
		return () => {
			clearInterval(waitForRef);
			if (playerRef.current) {
				playerRef.current.dispose();
				playerRef.current = null; // Reset reference
			}
		};
	}, [videoDetails]);	

	const handleApprove = async () => {
		try {
			await axios.put(
				`https://api.nexstream.live/api/admin/disputes/${videoId}`,
				{
					status_id: 1,
				}
			);
			navigate("/admin");
		} catch (err) {
			setError("Failed to approve video. Please try again.");
		}
	};

	const handleReject = async () => {
		try {
			await axios.put(
				`https://api.nexstream.live/api/admin/disputes/${videoId}`,
				{
					status_id: -1,
				}
			);
			navigate("/admin");
		} catch (err) {
			setError("Failed to reject video. Please try again.");
		}
	};

	if (isLoading)
		return (
			<div className="flex justify-center items-center h-screen">
				Loading...
			</div>
		);
	if (error)
		return (
			<Alert variant="destructive" className="max-w-md mx-auto mt-8">
				<AlertTitle>Error</AlertTitle>
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		);
	if (!videoDetails)
		return <div className="text-center mt-8">Video not found</div>;

	return (
		<div className="container mx-auto px-4 py-8">
			<Button onClick={() => navigate("/admin")} className="mb-4">
				Back to Content Moderation
			</Button>
			<Card className="max-w-4xl mx-auto">
				<CardContent className="p-6">
					<video
						ref={videoRef}
						className="video-js vjs-default-skin vjs-big-play-centered"
					/>
					<h1 className="text-2xl font-bold mb-2">
						{videoDetails.title}
					</h1>
					<p className="text-gray-600 mb-4">
						{videoDetails.video_description}
					</p>
					<div className="flex justify-center space-x-4 mt-6">
						<Button onClick={handleApprove} variant="outline">
							Approve
						</Button>
						<Button onClick={handleReject} variant="destructive">
							Reject
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
