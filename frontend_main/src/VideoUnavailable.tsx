import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function VideoUnavailablePage() {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-center flex items-center justify-center space-x-2">
						<AlertTriangle className="h-6 w-6 text-yellow-500" />
						<span>Video Unavailable</span>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-gray-600 dark:text-gray-400">
						We're sorry, but the video you're trying to access has
						been removed by our moderation team due to a violation
						of our community guidelines.
					</p>
				</CardContent>
				<CardFooter className="flex justify-center">
					<Button
						onClick={() => navigate("/")}
						className="w-full sm:w-auto"
					>
						Return to Home
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
