import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";

const dummyData = [
	{ category: "Entertainment", videos: 1200, views: 5000000 },
	{ category: "Education", videos: 800, views: 3000000 },
	{ category: "Sports", videos: 600, views: 2500000 },
	{ category: "Music", videos: 1000, views: 4500000 },
	{ category: "News", videos: 400, views: 1500000 },
];

export default function AdminStatistics() {
	return (
		<div>
			<h2 className="text-2xl font-bold mb-4">Admin Statistics</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
				<Card>
					<CardHeader>
						<CardTitle>Total Videos</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-4xl font-bold">
							{dummyData.reduce(
								(acc, curr) => acc + curr.videos,
								0
							)}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Total Views</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-4xl font-bold">
							{dummyData
								.reduce((acc, curr) => acc + curr.views, 0)
								.toLocaleString()}
						</p>
					</CardContent>
				</Card>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Videos by Category</CardTitle>
				</CardHeader>
				<CardContent>
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={dummyData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="category" />
							<YAxis
								yAxisId="left"
								orientation="left"
								stroke="#8884d8"
							/>
							<YAxis
								yAxisId="right"
								orientation="right"
								stroke="#82ca9d"
							/>
							<Tooltip />
							<Legend />
							<Bar
								yAxisId="left"
								dataKey="videos"
								fill="#8884d8"
								name="Videos"
							/>
							<Bar
								yAxisId="right"
								dataKey="views"
								fill="#82ca9d"
								name="Views"
							/>
						</BarChart>
					</ResponsiveContainer>
				</CardContent>
			</Card>
		</div>
	);
}
