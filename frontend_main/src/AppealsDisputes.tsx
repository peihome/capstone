"use client";

import React, { useState, useEffect } from "react";
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

interface Appeal {
	appeal_id: string;
	user_id: string;
	video_id: string | null;
	reason: string;
	status_id: number;
}

interface PaginationInfo {
	totalRecords: number;
	totalPages: number;
	currentPage: number;
	pageSize: number;
	hasNext: boolean;
}

export default function AppealsDisputes() {
	const [appeals, setAppeals] = useState<Appeal[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
		totalRecords: 0,
		totalPages: 1,
		currentPage: 1,
		pageSize: 10,
		hasNext: false,
	});

	useEffect(() => {
		fetchAppeals(paginationInfo.currentPage);
	}, [paginationInfo.currentPage]);

	const fetchAppeals = async (page: number) => {
		setIsLoading(true);
		try {
			const response = await fetch(
				`https://api.nexstream.live/api/admin/appeals?page=${page}`
			);
			if (!response.ok) {
				throw new Error("Failed to fetch appeals");
			}
			const data = await response.json();
			setAppeals(data.data);
			setPaginationInfo(data.pagination);
		} catch (err) {
			setError("Failed to load appeals. Please try again later.");
		} finally {
			setIsLoading(false);
		}
	};

	const updateAppealStatus = async (appealId: string, statusId: number) => {
		try {
			const response = await fetch(
				`https://api.nexstream.live/api/admin/appeals/${appealId}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ status_id: statusId }),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to update appeal status");
			}

			setAppeals(
				appeals.map((appeal) =>
					appeal.appeal_id === appealId
						? { ...appeal, status_id: statusId }
						: appeal
				)
			);
		} catch (err) {
			setError("Failed to update appeal status. Please try again.");
		}
	};

	const handleApprove = (id: string) => updateAppealStatus(id, 1);
	const handleReject = (id: string) => updateAppealStatus(id, -1);

	const handlePageChange = (page: number) => {
		setPaginationInfo((prev) => ({ ...prev, currentPage: page }));
	};

	const getStatusString = (statusId: number): string => {
		switch (statusId) {
			case 0:
				return "pending";
			case 1:
				return "approved";
			case -1:
				return "rejected";
			default:
				return "unknown";
		}
	};

	const getStatusBadgeVariant = (
		statusId: number
	): "outline" | "default" | "destructive" => {
		switch (statusId) {
			case 0:
				return "outline";
			case 1:
				return "default";
			case -1:
				return "destructive";
			default:
				return "outline";
		}
	};

	if (isLoading) return <div>Loading appeals...</div>;
	if (error) return <div className="text-red-500">{error}</div>;

	return (
		<div className="space-y-4">
			<h2 className="text-2xl font-bold mb-4">Appeals & Disputes</h2>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>User ID</TableHead>
						<TableHead>Video ID</TableHead>
						<TableHead>Reason</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{appeals.map((appeal) => (
						<TableRow key={appeal.appeal_id}>
							<TableCell>{appeal.user_id}</TableCell>
							<TableCell>{appeal.video_id || "N/A"}</TableCell>
							<TableCell>{appeal.reason}</TableCell>
							<TableCell>
								<Badge
									variant={getStatusBadgeVariant(
										appeal.status_id
									)}
								>
									{getStatusString(appeal.status_id)}
								</Badge>
							</TableCell>
							<TableCell>
								<Button
									onClick={() =>
										handleApprove(appeal.appeal_id)
									}
									variant="outline"
									size="sm"
									className="mr-2"
									disabled={appeal.status_id === 1}
								>
									Approve
								</Button>
								<Button
									onClick={() =>
										handleReject(appeal.appeal_id)
									}
									variant="destructive"
									size="sm"
									disabled={appeal.status_id === -1}
								>
									Reject
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<Pagination
				currentPage={paginationInfo.currentPage}
				totalPages={paginationInfo.totalPages}
				onPageChange={handlePageChange}
			/>
		</div>
	);
}
