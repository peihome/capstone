import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Video {
	id: string;
	thumbnail: string;
	title: string;
	channelName: string;
	viewCount: number;
	subscriberCount: number;
}

export default function HomePage() {
	const [videos, setVideos] = useState<Video[]>([]);

	useEffect(() => {
		// This is where we'll fetch the videos from the API
		// For now, we'll use a demo video
		const demoVideo: Video = {
			id: "1",
			thumbnail: "https://via.placeholder.com/1280x720",
			title: "Amazing Video Title",
			channelName: "Awesome Channel",
			viewCount: 1000000,
			subscriberCount: 500000,
		};

		setVideos(Array(9).fill(demoVideo));
	}, []);

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Recommended Videos</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{videos.map((video) => (
					<VideoCard key={video.id} video={video} />
				))}
			</div>
		</div>
	);
}

function VideoCard({ video }: { video: Video }) {
	return (
		<Card className="overflow-hidden">
			<CardContent className="p-0">
				<div className="aspect-w-16 aspect-h-9">
					<img
						src={video.thumbnail}
						alt={video.title}
						className="object-cover w-full h-full"
					/>
				</div>
				<div className="p-4">
					<h2 className="text-lg font-semibold line-clamp-2 mb-1">
						{video.title}
					</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
						{video.channelName}
					</p>
					<div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
						<span>{formatViewCount(video.viewCount)} views</span>
						<span>
							{formatSubscriberCount(video.subscriberCount)}{" "}
							subscribers
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function formatViewCount(count: number): string {
	if (count >= 1000000) {
		return `${(count / 1000000).toFixed(1)}M`;
	} else if (count >= 1000) {
		return `${(count / 1000).toFixed(1)}K`;
	}
	return count.toString();
}

function formatSubscriberCount(count: number): string {
	if (count >= 1000000) {
		return `${(count / 1000000).toFixed(1)}M`;
	} else if (count >= 1000) {
		return `${(count / 1000).toFixed(1)}K`;
	}
	return count.toString();
}
