import React, { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ReportedVideo {
	id: string;
	title: string;
	reportCount: number;
	status: "reported" | "under_review";
}

const dummyReportedVideos: ReportedVideo[] = [
	{
		id: "1",
		title: "Controversial Video 1",
		reportCount: 15,
		status: "reported",
	},
	{
		id: "2",
		title: "Questionable Content",
		reportCount: 12,
		status: "reported",
	},
	{
		id: "3",
		title: "Under Review Video",
		reportCount: 20,
		status: "under_review",
	},
	// Add more dummy data as needed
];

export default function ContentModeration() {
	const [reportedVideos, setReportedVideos] =
		useState<ReportedVideo[]>(dummyReportedVideos);

	const handleReview = (id: string) => {
		setReportedVideos(
			reportedVideos.map((video) =>
				video.id === id ? { ...video, status: "under_review" } : video
			)
		);
	};

	const handleApprove = (id: string) => {
		setReportedVideos(reportedVideos.filter((video) => video.id !== id));
	};

	const handleRemove = (id: string) => {
		setReportedVideos(reportedVideos.filter((video) => video.id !== id));
	};

	return (
		<div>
			<h2 className="text-2xl font-bold mb-4">Content Moderation</h2>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Video Title</TableHead>
						<TableHead>Report Count</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{reportedVideos.map((video) => (
						<TableRow key={video.id}>
							<TableCell>{video.title}</TableCell>
							<TableCell>{video.reportCount}</TableCell>
							<TableCell>
								<Badge
									variant={
										video.status === "reported"
											? "destructive"
											: "secondary"
									}
								>
									{video.status === "reported"
										? "Reported"
										: "Under Review"}
								</Badge>
							</TableCell>
							<TableCell>
								{video.status === "reported" && (
									<Button
										onClick={() => handleReview(video.id)}
										variant="outline"
										size="sm"
										className="mr-2"
									>
										Review
									</Button>
								)}
								<Button
									onClick={() => handleApprove(video.id)}
									variant="outline"
									size="sm"
									className="mr-2"
								>
									Approve
								</Button>
								<Button
									onClick={() => handleRemove(video.id)}
									variant="destructive"
									size="sm"
								>
									Remove
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
