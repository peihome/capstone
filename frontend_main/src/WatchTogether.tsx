import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "@/components/ui/card";

export default function WatchTogether() {
	const [roomId, setRoomId] = useState<string | null>(null);

	const createRoom = () => {
		const newRoomId = uuidv4();
		setRoomId(newRoomId);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<Card className="max-w-md mx-auto">
				<CardHeader>
					<CardTitle>Watch Together</CardTitle>
					<CardDescription>
						Create a room to watch videos with friends
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button onClick={createRoom} className="w-full">
						Create Room
					</Button>
				</CardContent>
				{roomId && (
					<CardFooter className="flex flex-col items-start">
						<p className="text-sm text-muted-foreground mb-2">
							Your room ID is:
						</p>
						<code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
							{roomId}
						</code>
						<Link to={`/room/${roomId}`}>
							<Button variant="outline" className="mt-4">
								Join the room
							</Button>
						</Link>
					</CardFooter>
				)}
			</Card>
		</div>
	);
}
