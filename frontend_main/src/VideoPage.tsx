import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { Card, CardContent } from "@/components/ui/card";

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

interface Video {
	video_id: string;
	title: string;
	channel_name: string;
	views: string;
	published_at: string;
	thumbnail: string;
}

interface ApiResponse {
	videos: Video[];
	nextPage: number;
	hasMore: boolean;
}

export default function VideoPage() {
	const { videoId } = useParams<{ videoId: string }>();
	const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
	const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
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
			}
		};

		const fetchRecommendedVideos = async () => {
			try {
				const response = await axios.get<ApiResponse>(
					`https://api.nexstream.live/api/dashboard?page=0`
				);
				setRecommendedVideos(response.data.videos);
			} catch (err) {
				console.error("Failed to fetch recommended videos:", err);
			}
		};

		Promise.all([fetchVideoDetails(), fetchRecommendedVideos()])
			.then(() => setIsLoading(false))
			.catch(() => setIsLoading(false));
	}, [videoId]);

	useEffect(() => {
		if (videoDetails && videoRef.current) {
			const player = videojs(videoRef.current, {
				controls: true,
				autoplay: false,
				preload: "auto",
				fluid: true,
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

			return () => {
				if (playerRef.current) {
					playerRef.current.dispose();
				}
			};
		}
	}, [videoDetails]);

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!videoDetails) return <div>Video not found</div>;

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col lg:flex-row gap-8">
				<div className="lg:w-[70%]">
					<div className="lg:w-[100%] aspect-w-16 aspect-h-9 mb-4">
						<video
							ref={videoRef}
							className="video-js vjs-default-skin vjs-big-play-centered"
						/>
					</div>
					<h1 className="text-2xl font-bold mb-2">
						{videoDetails.title}
					</h1>
					<div className="flex items-center mb-4">
						<div className="w-10 h-10 rounded-full bg-gray-300 mr-4"></div>
						<div>
							<h2 className="font-semibold">
								{videoDetails.channel_name}
							</h2>
							<p className="text-sm text-gray-500">
								{videoDetails.channel_description}
							</p>
						</div>
					</div>
					<p className="text-gray-700">
						{videoDetails.video_description}
					</p>
				</div>
				<div className="lg:w-[30%]">
					<h3 className="text-xl font-bold mb-4">
						Recommended Videos
					</h3>
					<div className="space-y-4">
						{recommendedVideos.map((video) => (
							<RecommendedVideoCard
								key={video.video_id}
								video={video}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

function RecommendedVideoCard({ video }: { video: Video }) {
	return (
		<Card className="overflow-hidden">
			<CardContent className="p-2 flex">
				<div className="w-2/5">
					<img
						src={video.thumbnail}
						alt={video.title}
						className="object-cover w-full h-full"
					/>
				</div>
				<div className="w-3/5 pl-2">
					<h4 className="text-sm font-semibold line-clamp-2">
						{video.title}
					</h4>
					<p className="text-xs text-gray-500">
						{video.channel_name}
					</p>
					<div className="text-xs text-gray-500">
						<span>{video.views} views</span>
						<span className="mx-1">•</span>
						<span>{video.published_at}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
