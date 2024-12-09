import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearch } from "./SearchContext";

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

export default function HomePage() {
	const [videos, setVideos] = useState<Video[]>([]);
	const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
	const [nextPage, setNextPage] = useState<number>(0);
	const [hasMore, setHasMore] = useState<boolean>(true);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const { searchQuery } = useSearch();
	const navigate = useNavigate();

	const fetchVideos = async (page: number) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await axios.get<ApiResponse>(
				`https://api.nexstream.live/api/dashboard?page=${page}`
			);
			if (page === 0) {
				setVideos(response.data.videos);
				setFilteredVideos(response.data.videos);
			} else {
				setVideos((prevVideos) => [
					...prevVideos,
					...response.data.videos,
				]);
				setFilteredVideos((prevVideos) => [
					...prevVideos,
					...response.data.videos,
				]);
			}
			setNextPage(response.data.nextPage);
			setHasMore(response.data.hasMore);
		} catch (err) {
			setError("Failed to fetch videos. Please try again later.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchVideos(0);
	}, []);

	useEffect(() => {
		const filtered = videos.filter((video) =>
			video.title.toLowerCase().includes(searchQuery.toLowerCase())
		);
		setFilteredVideos(filtered);
	}, [searchQuery, videos]);

	const loadMore = () => {
		if (hasMore && !isLoading) {
			fetchVideos(nextPage);
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Recommended Videos</h1>
			{error && <p className="text-red-500 mb-4">{error}</p>}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredVideos.map((video) => (
					<VideoCard
						key={video.video_id}
						video={video}
						onClick={() => navigate(`/video/${video.video_id}`)
						//onClick={() => window.location.href = `/video/${video.video_id}`
						}
					/>
				))}
			</div>
			{hasMore && (
				<div className="mt-8 text-center">
					<Button onClick={loadMore} disabled={isLoading}>
						{isLoading ? "Loading..." : "Load More"}
					</Button>
				</div>
			)}
		</div>
	);
}

function VideoCard({ video, onClick }: { video: Video; onClick: () => void }) {
	return (
		<Card className="overflow-hidden cursor-pointer" onClick={onClick}>
			<CardContent className="p-0">
				<img
					src={video.thumbnail}
					alt={video.title}
					className="object-cover w-full"
				/>
				<div className="p-4">
					<h2 className="text-lg font-semibold line-clamp-2 mb-1">
						{video.title}
					</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
						{video.channel_name}
					</p>
					<div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
						<span>{video.views} views</span>
						<span>{video.published_at}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
