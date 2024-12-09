import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
import { Pagination } from "@/components/ui/pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

export default function ContentModeration() {
	const [reportedVideos, setReportedVideos] = useState<ReportedVideo[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	const fetchReportedVideos = async (page: number) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await axios.get<ApiResponse>(
				`https://api.nexstream.live/api/admin/disputes?page=${page}`
			);
			setReportedVideos(response.data.data);
			setTotalPages(response.data.pagination.totalPages);
			setCurrentPage(response.data.pagination.currentPage);
		} catch (err) {
			setError(
				"Failed to fetch reported videos. Please try again later."
			);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchReportedVideos(1);
	}, []);

	const handleStatusChange = async (
		disputeId: string,
		newStatusId: number
	) => {
		try {
			await axios.put(
				`https://api.nexstream.live/api/admin/disputes/${disputeId}`,
				{
					status_id: newStatusId,
				}
			);
			setReportedVideos(
				reportedVideos.map((video) =>
					video.dispute_id === disputeId
						? { ...video, status_id: newStatusId }
						: video
				)
			);
		} catch (err) {
			setError("Failed to update video status. Please try again.");
		}
	};

	const handleReview = (videoId: string) => {
		//navigate(`/admin/review/${videoId}`);
		window.location.href = `/admin/review/${videoId}`;
	};

	return (
		<div className="space-y-4">
			<h2 className="text-2xl font-bold">Content Moderation</h2>
			{error && (
				<Alert variant="destructive">
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			{isLoading ? (
				<div>Loading...</div>
			) : (
				<>
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
								<TableRow key={video.dispute_id}>
									<TableCell>{video.title}</TableCell>
									<TableCell>{video.report_count}</TableCell>
									<TableCell>
										<Badge
											variant={
												video.status_id === 0
													? "destructive"
													: video.status_id === 1
													? "default"
													: "secondary"
											}
										>
											{statusMap[video.status_id]}
										</Badge>
									</TableCell>
									<TableCell>
										<Button
											onClick={() =>
												handleReview(video.video_id)
											}
											variant="outline"
											size="sm"
											className="mr-2"
										>
											Review
										</Button>
										<Button
											onClick={() =>
												handleStatusChange(
													video.dispute_id,
													1
												)
											}
											variant="outline"
											size="sm"
											className="mr-2"
											disabled={video.status_id === 1}
										>
											Approve
										</Button>
										<Button
											onClick={() =>
												handleStatusChange(
													video.dispute_id,
													-1
												)
											}
											variant="destructive"
											size="sm"
											disabled={video.status_id === -1}
										>
											Reject
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={(page) => fetchReportedVideos(page)}
					/>
				</>
			)}
		</div>
	);
}
