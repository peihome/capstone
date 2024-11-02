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

interface Appeal {
	id: string;
	userId: string;
	videoId: string;
	reason: string;
	status: "pending" | "approved" | "rejected";
}

const dummyAppeals: Appeal[] = [
	{
		id: "1",
		userId: "user1",
		videoId: "video1",
		reason: "False copyright claim",
		status: "pending",
	},
	{
		id: "2",
		userId: "user2",
		videoId: "video2",
		reason: "Incorrect age restriction",
		status: "pending",
	},
	{
		id: "3",
		userId: "user3",
		videoId: "video3",
		reason: "Wrongful suspension",
		status: "approved",
	},
	// Add more dummy data as needed
];

export default function AppealsDisputes() {
	const [appeals, setAppeals] = useState<Appeal[]>(dummyAppeals);

	const handleApprove = (id: string) => {
		setAppeals(
			appeals.map((appeal) =>
				appeal.id === id ? { ...appeal, status: "approved" } : appeal
			)
		);
	};

	const handleReject = (id: string) => {
		setAppeals(
			appeals.map((appeal) =>
				appeal.id === id ? { ...appeal, status: "rejected" } : appeal
			)
		);
	};

	return (
		<div>
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
						<TableRow key={appeal.id}>
							<TableCell>{appeal.userId}</TableCell>
							<TableCell>{appeal.videoId}</TableCell>
							<TableCell>{appeal.reason}</TableCell>
							<TableCell>
								<Badge
									variant={
										appeal.status === "pending"
											? "outline"
											: appeal.status === "approved"
											? "default"
											: "destructive"
									}
								>
									{appeal.status}
								</Badge>
							</TableCell>
							<TableCell>
								{appeal.status === "pending" && (
									<>
										<Button
											onClick={() =>
												handleApprove(appeal.id)
											}
											variant="outline"
											size="sm"
											className="mr-2"
										>
											Approve
										</Button>
										<Button
											onClick={() =>
												handleReject(appeal.id)
											}
											variant="destructive"
											size="sm"
										>
											Reject
										</Button>
									</>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
