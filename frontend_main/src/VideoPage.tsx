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
import { Input } from "@/components/ui/input";

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
	user_name: string;
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
	const [newComment, setNewComment] = useState("");
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		const userId = localStorage.getItem("user_id");
		setIsLoggedIn(!!userId);
	}, []);

	useEffect(() => {
		const fetchVideoDetails = async () => {
			try {
				const response = await axios.get<VideoDetails>(
					`https://api.nexstream.live/video/${videoId}`
				);
				setVideoDetails(response.data);
			} catch (err) {
				if (axios.isAxiosError(err) && err.response?.status === 404) {
					navigate("/video/unavailable");
				} else {
					setError(
						"Failed to fetch video details. Please try again later."
					);
				}
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

		Promise.all([
			fetchVideoDetails(),
			fetchRecommendedVideos(),
			fetchComments(),
		])
			.then(() => setIsLoading(false))
			.catch(() => setIsLoading(false));
	}, [videoId, navigate]);

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

	const fetchComments = async (page = 0) => {
		setIsLoadingComments(true);
		try {
			const response = await axios.get<CommentsResponse>(
				`https://api.nexstream.live/comments/${videoId}?page=${page}`
			);
			if (page === 0) {
				setComments(response.data.comments);
			} else {
				setComments((prevComments) => [
					...prevComments,
					...response.data.comments,
				]);
			}
			setHasMoreComments(response.data.hasMore);
			setCommentsPage(page);
		} catch (err) {
			console.error("Failed to fetch comments:", err);
		} finally {
			setIsLoadingComments(false);
		}
	};

	const loadMoreComments = () => {
		if (!hasMoreComments || isLoadingComments) return;
		fetchComments(commentsPage + 1);
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

	const handleCommentSubmit = async () => {
		if (!isLoggedIn) {
			navigate("/login");
			return;
		}

		try {
			const userId = localStorage.getItem("user_id");
			await axios.post(
				`https://api.nexstream.live/api/comments/${videoId}`,
				{
					user_id: userId,
					content: newComment,
				}
			);

			setNewComment("");
			// Fetch the latest comments after successfully posting a new comment
			await fetchComments(0);
		} catch (err) {
			console.error("Failed to submit comment:", err);
			setError("Failed to submit comment. Please try again.");
		}
	};

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;
	if (!videoDetails) return <div>Video not found</div>;
	
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col lg:flex-row gap-8">
				<div className="lg:w-[70%]">
					<div
						className="relative w-full"
						style={{ paddingTop: "56.25%" }}
					>
						<div className="absolute top-0 left-0 w-full h-full">
							<video
								ref={videoRef}
								className="video-js vjs-default-skin vjs-big-play-centered w-full h-full"
							/>
						</div>
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
							className="ml-auto"
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
						<div className="flex space-x-2 mb-4">
							<Input
								placeholder={
									isLoggedIn
										? "Add a comment..."
										: "Login to comment"
								}
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
								onFocus={() =>
									!isLoggedIn && navigate("/login")
								}
								disabled={!isLoggedIn}
							/>
							<Button
								onClick={handleCommentSubmit}
								disabled={!isLoggedIn || !newComment.trim()}
							>
								Post
							</Button>
						</div>
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
												{comment.user_name}
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
	//const navigate = useNavigate();

	const handleClick = () => {
		//navigate(`/video/${video.video_id}`);
		window.location.href = `/video/${video.video_id}`;
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
