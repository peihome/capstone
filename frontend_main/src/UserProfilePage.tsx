import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { db, auth } from "@/firebase/firebase";
import {
	collection,
	query,
	where,
	getDocs,
	doc,
	updateDoc,
} from "firebase/firestore";

export default function UserProfilePage() {
	const { username } = useParams<{ username: string }>();
	const navigate = useNavigate();
	const [userData, setUserData] = useState<any>(null);
	const [isEditing, setIsEditing] = useState<{ [key: string]: boolean }>({});
	const [editedData, setEditedData] = useState<any>({});
	const [isCurrentUser, setIsCurrentUser] = useState(false);

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

				// Check if the current user is viewing their own profile
				const currentUser = auth.currentUser;
				setIsCurrentUser(
					!!currentUser && currentUser.uid === data.userId
				);
			} else {
				console.error("User not found");
				navigate("/");
			}
		};
		fetchUserData();
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

	if (!userData) return <div>Loading...</div>;

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
			<div key={key} className="flex items-center space-x-4">
				<div className="flex-1">
					<Label htmlFor={key}>
						{key.charAt(0).toUpperCase() + key.slice(1)}
					</Label>
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
					/>
				</div>
				{key.startsWith("display") && isCurrentUser ? (
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
				) : null}
				{isCurrentUser &&
					(isEditing[key] ? (
						<Button onClick={() => handleSave(key)}>Save</Button>
					) : (
						<Button onClick={() => handleEdit(key)}>Edit</Button>
					))}
			</div>
		);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold text-center mb-8">
				User Profile
			</h1>
			<div className="max-w-2xl mx-auto space-y-6">
				<div className="flex justify-center mb-6">
					<img
						src={userData.profilePicture}
						alt="Profile"
						className="w-32 h-32 rounded-full object-cover"
					/>
				</div>
				{Object.entries(userData).map(([key, value]) => {
					if (
						key === "profilePicture" ||
						key === "id" ||
						key === "userId"
					)
						return null;
					return renderField(key, value);
				})}
			</div>
		</div>
	);
}
