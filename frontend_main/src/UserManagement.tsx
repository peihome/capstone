"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface User {
	user_id: string;
	status_id: number;
	email: string;
	name: string;
}

interface ApiResponse {
	message: string;
	data: User[];
	pagination: {
		totalRecords: number;
		totalPages: number;
		currentPage: number;
		pageSize: number;
		hasNext: boolean;
	};
}

const statusMap: { [key: number]: string } = {
	1: "active",
	0: "suspended",
	"-1": "inactive",
};

export default function UserManagement() {
	const [users, setUsers] = useState<User[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchUsers = async (page: number) => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await axios.get<ApiResponse>(
				`https://api.nexstream.live/api/admin/users?page=${page}`
			);
			setUsers(response.data.data);
			setTotalPages(response.data.pagination.totalPages);
			setCurrentPage(response.data.pagination.currentPage);
		} catch (err) {
			setError("Failed to fetch users. Please try again later.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers(1);
	}, []);

	const handleStatusChange = async (userId: string, newStatusId: number) => {
		try {
			await axios.put(
				`https://api.nexstream.live/api/admin/users/${userId}`,
				{
					status_id: newStatusId,
				}
			);
			setUsers(
				users.map((user) =>
					user.user_id === userId
						? { ...user, status_id: newStatusId }
						: user
				)
			);
		} catch (err) {
			setError("Failed to update user status. Please try again.");
		}
	};

	const filteredUsers = users.filter(
		(user) =>
			user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<div className="space-y-4">
			<h2 className="text-2xl font-bold">User Management</h2>
			<Input
				type="text"
				placeholder="Search users..."
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
			/>
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
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredUsers.map((user) => (
								<TableRow key={user.user_id}>
									<TableCell>{user.name}</TableCell>
									<TableCell>{user.email}</TableCell>
									<TableCell>
										{statusMap[user.status_id]}
									</TableCell>
									<TableCell>
										<Button
											onClick={() =>
												handleStatusChange(
													user.user_id,
													1
												)
											}
											variant="outline"
											size="sm"
											className="mr-2"
											disabled={user.status_id === 1}
										>
											Activate
										</Button>
										<Button
											onClick={() =>
												handleStatusChange(
													user.user_id,
													0
												)
											}
											variant="outline"
											size="sm"
											className="mr-2"
											disabled={user.status_id === 0}
										>
											Suspend
										</Button>
										<Button
											onClick={() =>
												handleStatusChange(
													user.user_id,
													-1
												)
											}
											variant="destructive"
											size="sm"
											disabled={user.status_id === -1}
										>
											Deactivate
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={(page) => fetchUsers(page)}
					/>
				</>
			)}
		</div>
	);
}
