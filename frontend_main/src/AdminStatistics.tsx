"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import axios from "axios";

interface VideoStats {
	total_videos: number;
	total_views: number;
	video_uploads_per_month: number[];
}

export default function AdminStatistics() {
	const [stats, setStats] = useState<VideoStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const response = await axios.get<VideoStats>(
					"https://api.nexstream.live/api/admin/video-stats"
				);
				setStats(response.data);
			} catch (err) {
				setError("Failed to fetch video statistics");
			} finally {
				setIsLoading(false);
			}
		};

		fetchStats();
	}, []);

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error}</div>;
	if (!stats) return <div>No data available</div>;

	const chartData = stats.video_uploads_per_month.map((value, index) => ({
		month: index + 1,
		uploads: value,
	}));

	return (
		<div className="space-y-8">
			<h2 className="text-3xl font-bold">Admin Statistics</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card>
					<CardHeader>
						<CardTitle>Total Videos</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-4xl font-bold">
							{stats.total_videos.toLocaleString()}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Total Views</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-4xl font-bold">
							{stats.total_views.toLocaleString()}
						</p>
					</CardContent>
				</Card>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Video Uploads Trend</CardTitle>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width="100%" height={300}>
						<LineChart data={chartData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis
								dataKey="month"
								label={{
									value: "Month",
									position: "insideBottom",
									offset: -5,
								}}
							/>
							<YAxis
								label={{
									value: "Uploads",
									angle: -90,
									position: "insideLeft",
								}}
							/>
							<Tooltip
								formatter={(value: number) => [
									value,
									"Uploads",
								]}
								labelFormatter={(label: number) =>
									`Month ${label}`
								}
							/>
							<Line
								type="monotone"
								dataKey="uploads"
								stroke="#8884d8"
								strokeWidth={2}
								dot={false}
							/>
						</LineChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>
		</div>
	);
}
