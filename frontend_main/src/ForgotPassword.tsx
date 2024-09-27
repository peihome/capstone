"use client";

import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPassword() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const navigate = useNavigate();

	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await sendPasswordResetEmail(auth, email);
			setIsSubmitted(true);
		} catch (error: any) {
			setError(error.message);
		}
	};

	return (
		<Card className="w-full max-w-[400px] bg-white dark:bg-gray-800 shadow-lg">
			<CardHeader className="pb-6">
				<CardTitle className="text-xl sm:text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
					Forgot Password
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{error && (
					<div className="text-red-600 text-sm text-center">
						{error}
					</div>
				)}
				{!isSubmitted ? (
					<form onSubmit={handleResetPassword}>
						<div className="space-y-2">
							<Label
								htmlFor="email"
								className="text-gray-700 dark:text-gray-300"
							>
								Email
							</Label>
							<Input
								id="email"
								type="email"
								placeholder="Enter your email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
							/>
						</div>
						<Button
							type="submit"
							className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
						>
							Confirm Email
						</Button>
					</form>
				) : (
					<div className="text-center">
						<p className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
							Email Sent Successfully
						</p>
						<p className="text-gray-700 dark:text-gray-300">
							Follow the instructions sent to you on your provided
							email to reset your password.
						</p>
					</div>
				)}
			</CardContent>
			<CardFooter className="flex flex-col space-y-4">
				<Button
					variant="outline"
					className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
					onClick={() => navigate(-1)}
				>
					<ArrowLeft className="mr-2 h-4 w-4" /> Back
				</Button>
			</CardFooter>
		</Card>
	);
}
