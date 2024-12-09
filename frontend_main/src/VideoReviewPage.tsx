"use client";

import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface ReportedVideo {
	video_id: string;
	dispute_id: string;
	title: string;
	report_count: number;
	status_id: number;
}

interface ApiResponse {
	message: string;
	data: ReportedVideo[];
	pagination: {
		totalRecords: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
		hasNext: boolean;
	};
}

const statusMap: { [key: number]: string } = {
	0: "reported",
	1: "approved",
	"-1": "rejected",
};

export default function VideoReviewPage() {
	const navigate = useNavigate();
	const { videoId } = useParams<{ videoId: string }>();
	const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
	const [disputeDetails, setDisputeDetails] = useState<ReportedVideo | null>(
		null
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const playerRef = useRef<any>(null);

	useEffect(() => {
		const fetchVideoAndDisputeDetails = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const [videoResponse, disputeResponse] = await Promise.all([
					axios.get<VideoDetails>(
						`https://api.nexstream.live/video/${videoId}`
					),
					axios.get<ApiResponse>(
						`https://api.nexstream.live/api/admin/disputes?video_id=${videoId}`
					),
				]);
				setVideoDetails(videoResponse.data);
				const reportedVideo = disputeResponse.data.data.find(
					(video) => video.video_id === videoId
				);
				if (reportedVideo) {
					setDisputeDetails(reportedVideo);
				} else {
					throw new Error(
						"Dispute details not found for this video."
					);
				}
			} catch (err) {
				setError(
					"Failed to fetch video and dispute details. Please try again later."
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchVideoAndDisputeDetails();
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

	const handleStatusChange = async (newStatusId: number) => {
		if (!disputeDetails) {
			setError("Dispute details not available. Cannot update status.");
			return;
		}

		try {
			await axios.put(
				`https://api.nexstream.live/api/admin/disputes/${disputeDetails.dispute_id}`,
				{
					status_id: newStatusId,
				}
			);
			setDisputeDetails({ ...disputeDetails, status_id: newStatusId });
		} catch (err) {
			setError(
				`Failed to ${
					newStatusId === 1 ? "approve" : "reject"
				} video. Please try again.`
			);
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
	if (!videoDetails || !disputeDetails)
		return (
			<div className="text-center mt-8">
				Video or dispute details not found
			</div>
		);

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
					<div className="mb-4">
						<Badge
							variant={
								disputeDetails.status_id === 0
									? "destructive"
									: disputeDetails.status_id === 1
									? "default"
									: "secondary"
							}
						>
							{statusMap[disputeDetails.status_id]}
						</Badge>
					</div>
					<div className="flex justify-center space-x-4 mt-6">
						<Button
							onClick={() => handleStatusChange(1)}
							variant="outline"
							disabled={disputeDetails.status_id === 1}
						>
							Approve
						</Button>
						<Button
							onClick={() => handleStatusChange(-1)}
							variant="destructive"
							disabled={disputeDetails.status_id === -1}
						>
							Reject
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
