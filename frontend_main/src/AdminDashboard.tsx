import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContentModeration from "./ContentModeration";
import UserManagement from "./UserManagement";
import AdminStatistics from "./AdminStatistics";
import AppealsDisputes from "./AppealsDisputes";

export default function AdminDashboard() {
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
			<Tabs defaultValue="content-moderation" className="w-full">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="content-moderation">
						Content Moderation
					</TabsTrigger>
					<TabsTrigger value="user-management">
						User Management
					</TabsTrigger>
					<TabsTrigger value="admin-statistics">
						Admin Statistics
					</TabsTrigger>
					<TabsTrigger value="appeals-disputes">
						Appeals & Disputes
					</TabsTrigger>
				</TabsList>
				<TabsContent value="content-moderation">
					<ContentModeration />
				</TabsContent>
				<TabsContent value="user-management">
					<UserManagement />
				</TabsContent>
				<TabsContent value="admin-statistics">
					<AdminStatistics />
				</TabsContent>
				<TabsContent value="appeals-disputes">
					<AppealsDisputes />
				</TabsContent>
			</Tabs>
		</div>
	);
}
