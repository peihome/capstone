"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db, auth } from "@/firebase/firebase";
import {
	collection,
	query,
	where,
	getDocs,
	doc,
	updateDoc,
} from "firebase/firestore";
import { Upload, User, Settings } from "lucide-react";

export default function UserProfilePage() {
	const { username } = useParams<{ username: string }>();
	const navigate = useNavigate();
	const [userData, setUserData] = useState<any>(null);
	const [isEditing, setIsEditing] = useState<{ [key: string]: boolean }>({});
	const [editedData, setEditedData] = useState<any>({});
	const [isCurrentUser, setIsCurrentUser] = useState(false);
	const [avatars, setAvatars] = useState<string[]>([]);

	useEffect(() => {
		const fetchUserData = async () => {
			const usersRef = collection(db, "users");
			const q = query(usersRef, where("username", "==", username));
			const querySnapshot = await getDocs(q);
			if (!querySnapshot.empty) {
				const userDoc = querySnapshot.docs[0];
				const data = {
					id: userDoc.id,
					userId: userDoc.data().userId,
					...userDoc.data(),
				};
				setUserData(data);
				setEditedData(data);

				const currentUser = auth.currentUser;
				setIsCurrentUser(
					!!currentUser && currentUser.uid === data.userId
				);
			} else {
				console.error("User not found");
				navigate("/");
			}
		};

		const fetchAvatars = async () => {
			try {
				const response = await fetch(
					"https://randomuser.me/api/?results=6"
				);
				const data = await response.json();
				const avatarUrls = data.results.map(
					(user: any) => user.picture.large
				);
				setAvatars(avatarUrls);
			} catch (error) {
				console.error("Error fetching avatars:", error);
			}
		};

		fetchUserData();
		fetchAvatars();
	}, [username, navigate]);

	const handleEdit = (field: string) => {
		if (isCurrentUser) {
			setIsEditing({ ...isEditing, [field]: true });
		}
	};

	const handleSave = async (field: string) => {
		if (isCurrentUser) {
			try {
				const userRef = doc(db, "users", userData.id);
				await updateDoc(userRef, { [field]: editedData[field] });
				setUserData({ ...userData, [field]: editedData[field] });
				setIsEditing({ ...isEditing, [field]: false });
			} catch (error) {
				console.error("Error updating profile:", error);
			}
		}
	};

	const handleAvatarChange = async (avatarUrl: string) => {
		if (isCurrentUser) {
			try {
				const userRef = doc(db, "users", userData.id);
				await updateDoc(userRef, { profilePicture: avatarUrl });
				setUserData({ ...userData, profilePicture: avatarUrl });
				setEditedData({ ...editedData, profilePicture: avatarUrl });
			} catch (error) {
				console.error("Error updating avatar:", error);
			}
		}
	};

	const renderField = (key: string, value: any) => {
		const isPublic =
			key === "username" ||
			key === "channelName" ||
			(key.startsWith("display") && value) ||
			(key === "firstName" && userData.displayFirstName) ||
			(key === "lastName" && userData.displayLastName) ||
			(key === "mobileNumber" && userData.displayMobileNumber);

		if (!isCurrentUser && !isPublic) return null;

		return (
			<div key={key} className="space-y-2">
				<Label htmlFor={key}>
					{key.charAt(0).toUpperCase() + key.slice(1)}
				</Label>
				<div className="flex items-center space-x-2">
					<Input
						id={key}
						value={editedData[key]}
						onChange={(e) =>
							setEditedData({
								...editedData,
								[key]: e.target.value,
							})
						}
						disabled={!isCurrentUser || !isEditing[key]}
						className="flex-1"
					/>
					{key.startsWith("display") && isCurrentUser && (
						<Switch
							checked={editedData[key]}
							onCheckedChange={(checked) =>
								setEditedData({
									...editedData,
									[key]: checked,
								})
							}
							disabled={!isEditing[key]}
						/>
					)}
					{isCurrentUser &&
						(isEditing[key] ? (
							<Button onClick={() => handleSave(key)} size="sm">
								Save
							</Button>
						) : (
							<Button
								onClick={() => handleEdit(key)}
								variant="outline"
								size="sm"
							>
								Edit
							</Button>
						))}
				</div>
			</div>
		);
	};

	if (!userData) return <div>Loading...</div>;

	return (
		<div className="container mx-auto px-4 py-8">
			<Card className="max-w-4xl mx-auto">
				<CardHeader>
					<CardTitle className="text-3xl font-bold text-center">
						User Profile
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="profile" className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="profile">Profile</TabsTrigger>
							<TabsTrigger value="avatar">Avatar</TabsTrigger>
							<TabsTrigger value="settings">Settings</TabsTrigger>
						</TabsList>
						<TabsContent value="profile" className="space-y-6">
							<div className="flex justify-center mb-6">
								<Avatar className="w-32 h-32">
									<AvatarImage
										src={userData.profilePicture}
										alt="Profile"
									/>
									<AvatarFallback>
										{userData.username
											?.charAt(0)
											.toUpperCase()}
									</AvatarFallback>
								</Avatar>
							</div>
							<div className="grid gap-6 md:grid-cols-2">
								{Object.entries(userData).map(
									([key, value]) => {
										if (
											key === "profilePicture" ||
											key === "id" ||
											key === "userId"
										)
											return null;
										return renderField(key, value);
									}
								)}
							</div>
							{isCurrentUser && (
								<div className="flex justify-center mt-6">
									<Button
										onClick={() =>
											navigate(
												`/${userData.username}/upload`
											)
										}
										className="w-full md:w-auto"
									>
										<Upload className="mr-2 h-4 w-4" /> Go
										to Upload Page
									</Button>
								</div>
							)}
						</TabsContent>
						<TabsContent value="avatar" className="space-y-6">
							<h3 className="text-lg font-semibold">
								Choose a new avatar
							</h3>
							<div className="grid grid-cols-3 gap-4">
								{avatars.map((avatar, index) => (
									<Avatar
										key={index}
										className="w-24 h-24 cursor-pointer hover:ring-2 hover:ring-primary"
										onClick={() =>
											handleAvatarChange(avatar)
										}
									>
										<AvatarImage
											src={avatar}
											alt={`Avatar option ${index + 1}`}
										/>
										<AvatarFallback>Avatar</AvatarFallback>
									</Avatar>
								))}
							</div>
						</TabsContent>
						<TabsContent value="settings" className="space-y-6">
							<h3 className="text-lg font-semibold">
								Account Settings
							</h3>
							<p>
								Manage your account settings and preferences
								here.
							</p>
							{/* Add more settings options here */}
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
