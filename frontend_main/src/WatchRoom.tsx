"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocket } from "./SocketProvider";
import SyncS3VideoPlayer from "./SyncS3VideoPlayer";

interface Message {
	username: string;
	message: string;
}

export default function WatchRoom() {
	const socket = useSocket();
	const { roomId } = useParams<{ roomId: string }>();

	const [username, setUsername] = useState<string | null>(null);
	const [tempUsername, setTempUsername] = useState("");
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState<Message[]>([]);

	useEffect(() => {
		if (username) {
			socket?.emit("join-room", { roomId, username });

			socket?.on("receive-message", ({ username, message }) => {
				setMessages((prevMessages) => [
					...prevMessages,
					{ username: username || "Anonymous", message },
				]);
			});

			socket?.on("user-joined", (username) => {
				setMessages((prevMessages) => [
					...prevMessages,
					{
						username: "System",
						message: `${username} has joined the room`,
					},
				]);
			});

			return () => {
				socket?.emit("leave-room", { roomId });
				socket?.off("receive-message");
				socket?.off("user-joined");
			};
		}
	}, [roomId, username, socket]);

	const handleSetUsername = (e: React.FormEvent) => {
		e.preventDefault();
		if (tempUsername.trim() !== "") {
			setUsername(tempUsername);
		}
	};

	const handleSendMessage = () => {
		if (message.trim() !== "") {
			socket?.emit("send-message", { roomId, message, username });
			setMessages((prevMessages) => [
				...prevMessages,
				{ username: username || "Anonymous", message },
			]);
			setMessage("");
		}
	};

	if (!username) {
		return (
			<div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle>Enter Your Username</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSetUsername}>
							<div className="flex flex-col space-y-4">
								<Input
									type="text"
									value={tempUsername}
									onChange={(e) =>
										setTempUsername(e.target.value)
									}
									placeholder="Your username"
									required
								/>
								<Button type="submit">Join Room</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Room {roomId}</h1>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				<Card>
					<CardHeader>
						<CardTitle>Chat</CardTitle>
					</CardHeader>
					<CardContent>
						<ScrollArea className="h-[300px] w-full rounded-md border p-4">
							{messages.map((msg, index) => (
								<div key={index} className="mb-2">
									<span className="font-semibold">
										{msg.username}:
									</span>{" "}
									{msg.message}
								</div>
							))}
						</ScrollArea>
					</CardContent>
					<CardFooter>
						<div className="flex w-full items-center space-x-2">
							<Input
								type="text"
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder="Type a message"
							/>
							<Button onClick={handleSendMessage}>Send</Button>
						</div>
					</CardFooter>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Watch Video Together</CardTitle>
					</CardHeader>
					<CardContent>
						<SyncS3VideoPlayer />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
