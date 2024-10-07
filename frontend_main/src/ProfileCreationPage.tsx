"use client";

import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { db, auth } from "@/firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";

const profilePictures = [
	"/profile1.jpg",
	"/profile2.jpg",
	"/profile3.jpg",
	// Add more profile picture URLs here
];

export default function ProfileCreationPage() {
	const { userId } = useParams<{ userId: string }>();
	const navigate = useNavigate();
	const [profilePicture, setProfilePicture] = useState(profilePictures[0]);
	const [username, setUsername] = useState("");
	const [channelName, setChannelName] = useState("");
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [mobileNumber, setMobileNumber] = useState("");
	const [displayFirstName, setDisplayFirstName] = useState(false);
	const [displayLastName, setDisplayLastName] = useState(false);
	const [displayMobileNumber, setDisplayMobileNumber] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			if (!userId) {
				throw new Error("User ID is undefined");
			}
			await setDoc(doc(db, "users", userId), {
				userId,
				username,
				profilePicture,
				channelName,
				firstName,
				lastName,
				mobileNumber,
				displayFirstName,
				displayLastName,
				displayMobileNumber,
			});

			// Update the user's profile in Firebase Auth
			const user = auth.currentUser;
			if (user) {
				await updateProfile(user, {
					displayName: username,
					photoURL: profilePicture,
				});
			}

			navigate(`/${username}`);
		} catch (error) {
			console.error("Error creating profile:", error);
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold text-center mb-8">
				Create Your Profile
			</h1>
			<div className="max-w-2xl mx-auto">
				<div className="mb-6 flex justify-center">
					<div className="relative">
						<img
							src={profilePicture}
							alt="Profile"
							className="w-32 h-32 rounded-full object-cover cursor-pointer"
							onClick={() => {
								// Open a modal or dropdown to select profile picture
							}}
						/>
						<Button
							className="absolute bottom-0 right-0"
							onClick={() => {
								// Open a modal or dropdown to select profile picture
							}}
						>
							Change
						</Button>
					</div>
				</div>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<Label htmlFor="username">Username</Label>
						<Input
							id="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
						/>
					</div>
					<div>
						<Label htmlFor="channelName">
							Channel Name (Optional)
						</Label>
						<Input
							id="channelName"
							value={channelName}
							onChange={(e) => setChannelName(e.target.value)}
						/>
					</div>
					<div className="flex items-center space-x-4">
						<div className="flex-1">
							<Label htmlFor="firstName">First Name</Label>
							<Input
								id="firstName"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								required
							/>
						</div>
						<div className="flex items-center space-x-2">
							<Switch
								checked={displayFirstName}
								onCheckedChange={setDisplayFirstName}
							/>
							<Label htmlFor="displayFirstName">Display</Label>
						</div>
					</div>
					<div className="flex items-center space-x-4">
						<div className="flex-1">
							<Label htmlFor="lastName">Last Name</Label>
							<Input
								id="lastName"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								required
							/>
						</div>
						<div className="flex items-center space-x-2">
							<Switch
								checked={displayLastName}
								onCheckedChange={setDisplayLastName}
							/>
							<Label htmlFor="displayLastName">Display</Label>
						</div>
					</div>
					<div className="flex items-center space-x-4">
						<div className="flex-1">
							<Label htmlFor="mobileNumber">Mobile Number</Label>
							<Input
								id="mobileNumber"
								value={mobileNumber}
								onChange={(e) =>
									setMobileNumber(e.target.value)
								}
								required
							/>
						</div>
						<div className="flex items-center space-x-2">
							<Switch
								checked={displayMobileNumber}
								onCheckedChange={setDisplayMobileNumber}
							/>
							<Label htmlFor="displayMobileNumber">Display</Label>
						</div>
					</div>
					<Button type="submit" className="w-full">
						Create Profile
					</Button>
				</form>
			</div>
		</div>
	);
}
