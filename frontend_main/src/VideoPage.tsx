"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

interface Comment {
	comment_id: number;
	user_id: number;
	content: string;
	created_at: string;
}

interface CommentsResponse {
	comments: Comment[];
	nextPage: number | null;
	hasMore: boolean;
}

interface ApiResponse {
	videos: Video[];
	nextPage: number;
	hasMore: boolean;
}

export default function VideoPage() {
	const { videoId } = useParams<{ videoId: string }>();
	const navigate = useNavigate();
	const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
	const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
	const [comments, setComments] = useState<Comment[]>([]);
	const [commentsPage, setCommentsPage] = useState<number>(0);
	const [hasMoreComments, setHasMoreComments] = useState<boolean>(true);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [reportSuccess, setReportSuccess] = useState<boolean>(false);
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

		const fetchComments = async () => {
			try {
				const response = await axios.get<CommentsResponse>(
					`https://api.nexstream.live/comments/${videoId}?page=0`
				);
				setComments(response.data.comments);
				setHasMoreComments(response.data.hasMore);
				setCommentsPage(0);
			} catch (err) {
				console.error("Failed to fetch comments:", err);
			}
		};

		Promise.all([
			fetchVideoDetails(),
			fetchRecommendedVideos(),
			fetchComments(),
		])
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

	const loadMoreComments = async () => {
		if (!hasMoreComments || isLoadingComments) return;

		setIsLoadingComments(true);
		try {
			const response = await axios.get<CommentsResponse>(
				`https://api.nexstream.live/comments/${videoId}?page=${
					commentsPage + 1
				}`
			);
			setComments((prevComments) => [
				...prevComments,
				...response.data.comments,
			]);
			setHasMoreComments(response.data.hasMore);
			setCommentsPage((prevPage) => prevPage + 1);
		} catch (err) {
			console.error("Failed to fetch more comments:", err);
		} finally {
			setIsLoadingComments(false);
		}
	};
	const handleReportVideo = async () => {
		try {
			await axios.post(
				`https://api.nexstream.live/api/video/report/${videoId}`,
				{
					dispute_type_id: 1,
				}
			);
			setReportSuccess(true);
		} catch (err) {
			console.error("Failed to report video:", err);
			setError("Failed to report video. Please try again later.");
		}
	};

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
						<Avatar className="w-10 h-10 mr-4">
							<AvatarImage
								src={`https://api.dicebear.com/6.x/initials/svg?seed=${videoDetails.channel_name}`}
							/>
							<AvatarFallback>
								{videoDetails.channel_name.charAt(0)}
							</AvatarFallback>
						</Avatar>
						<div>
							<h2 className="font-semibold">
								{videoDetails.channel_name}
							</h2>
							<p className="text-sm text-gray-500">
								{videoDetails.channel_description}
							</p>
						</div>
						<Button
							onClick={handleReportVideo}
							variant="outline"
							className="ml-40"
						>
							Report Video
						</Button>
					</div>
					{reportSuccess && (
						<Alert className="mb-4">
							<AlertCircle className="h-4 w-4" />
							<AlertTitle>Success</AlertTitle>
							<AlertDescription>
								The video has been reported successfully.
							</AlertDescription>
						</Alert>
					)}
					<p className="text-gray-700 mb-8">
						{videoDetails.video_description}
					</p>

					<div className="mt-8">
						<h3 className="text-xl font-bold mb-4">Comments</h3>
						<div className="space-y-4">
							{comments.map((comment) => (
								<div
									key={comment.comment_id}
									className="flex space-x-4"
								>
									<Avatar className="w-10 h-10">
										<AvatarImage
											src={`https://api.dicebear.com/6.x/initials/svg?seed=${comment.user_id}`}
										/>
										<AvatarFallback>
											U{comment.user_id}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1">
										<div className="flex items-center space-x-2">
											<p className="font-semibold">
												User {comment.user_id}
											</p>
											<p className="text-sm text-gray-500">
												{new Date(
													comment.created_at
												).toLocaleDateString()}
											</p>
										</div>
										<p className="mt-1">
											{comment.content}
										</p>
									</div>
								</div>
							))}
						</div>
						{hasMoreComments && (
							<Button
								onClick={loadMoreComments}
								disabled={isLoadingComments}
								className="mt-4"
							>
								{isLoadingComments
									? "Loading..."
									: "Load More Comments"}
							</Button>
						)}
						{isLoadingComments && (
							<div className="space-y-4 mt-4">
								{[...Array(3)].map((_, index) => (
									<div key={index} className="flex space-x-4">
										<Skeleton className="w-10 h-10 rounded-full" />
										<div className="flex-1 space-y-2">
											<Skeleton className="h-4 w-[250px]" />
											<Skeleton className="h-4 w-[400px]" />
										</div>
									</div>
								))}
							</div>
						)}
					</div>
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
	const navigate = useNavigate();

	const handleClick = () => {
		navigate(`/video/${video.video_id}`);
	};

	return (
		<Card className="overflow-hidden cursor-pointer" onClick={handleClick}>
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
