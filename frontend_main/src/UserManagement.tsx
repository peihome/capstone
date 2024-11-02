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
import { Input } from "@/components/ui/input";

interface User {
	id: string;
	username: string;
	email: string;
	status: "active" | "suspended" | "banned";
}

const dummyUsers: User[] = [
	{
		id: "1",
		username: "user1",
		email: "user1@example.com",
		status: "active",
	},
	{
		id: "2",
		username: "user2",
		email: "user2@example.com",
		status: "suspended",
	},
	{
		id: "3",
		username: "user3",
		email: "user3@example.com",
		status: "active",
	},
	// Add more dummy data as needed
];

export default function UserManagement() {
	const [users, setUsers] = useState<User[]>(dummyUsers);
	const [searchTerm, setSearchTerm] = useState("");

	const handleStatusChange = (
		id: string,
		newStatus: "active" | "suspended" | "banned"
	) => {
		setUsers(
			users.map((user) =>
				user.id === id ? { ...user, status: newStatus } : user
			)
		);
	};

	const filteredUsers = users.filter(
		(user) =>
			user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<div>
			<h2 className="text-2xl font-bold mb-4">User Management</h2>
			<Input
				type="text"
				placeholder="Search users..."
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				className="mb-4"
			/>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Username</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredUsers.map((user) => (
						<TableRow key={user.id}>
							<TableCell>{user.username}</TableCell>
							<TableCell>{user.email}</TableCell>
							<TableCell>{user.status}</TableCell>
							<TableCell>
								<Button
									onClick={() =>
										handleStatusChange(user.id, "active")
									}
									variant="outline"
									size="sm"
									className="mr-2"
									disabled={user.status === "active"}
								>
									Activate
								</Button>
								<Button
									onClick={() =>
										handleStatusChange(user.id, "suspended")
									}
									variant="outline"
									size="sm"
									className="mr-2"
									disabled={user.status === "suspended"}
								>
									Suspend
								</Button>
								<Button
									onClick={() =>
										handleStatusChange(user.id, "banned")
									}
									variant="destructive"
									size="sm"
									disabled={user.status === "banned"}
								>
									Ban
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
