"use client";

import React, { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
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
import { auth, googleProvider, facebookProvider } from "@/firebase/firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";

export default function SignUpPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}
		try {
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				email,
				password
			);
			navigate(`/create-profile/${userCredential.user.uid}`);
		} catch (error: any) {
			setError(error.message);
		}
	};

	const handleGoogleSignUp = async () => {
		try {
			const result = await signInWithPopup(auth, googleProvider);
			navigate(`/create-profile/${result.user.uid}`);
		} catch (error: any) {
			setError(error.message);
		}
	};

	const handleFacebookSignUp = async () => {
		try {
			const result = await signInWithPopup(auth, facebookProvider);
			navigate(`/create-profile/${result.user.uid}`);
		} catch (error: any) {
			setError(error.message);
		}
	};

	return (
		<div className="flex flex-col h-screen justify-center items-center">
			<Card className="w-full max-w-[400px] bg-white dark:bg-gray-800 shadow-lg">
				<CardHeader className="pb-6">
					<CardTitle className="text-xl sm:text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
						Sign Up for Nexstream
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{error && (
						<div className="text-red-600 text-sm text-center">
							{error}
						</div>
					)}
					<form onSubmit={handleSignUp}>
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
						<div className="space-y-2">
							<Label
								htmlFor="password"
								className="text-gray-700 dark:text-gray-300"
							>
								Password
							</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="Enter your password"
									required
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-600"
									onClick={() =>
										setShowPassword(!showPassword)
									}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
									<span className="sr-only">
										{showPassword
											? "Hide password"
											: "Show password"}
									</span>
								</Button>
							</div>
						</div>
						<div className="space-y-2">
							<Label
								htmlFor="confirmPassword"
								className="text-gray-700 dark:text-gray-300"
							>
								Confirm Password
							</Label>
							<div className="relative">
								<Input
									id="confirmPassword"
									type={
										showConfirmPassword
											? "text"
											: "password"
									}
									placeholder="Confirm your password"
									required
									value={confirmPassword}
									onChange={(e) =>
										setConfirmPassword(e.target.value)
									}
									className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-600"
									onClick={() =>
										setShowConfirmPassword(
											!showConfirmPassword
										)
									}
								>
									{showConfirmPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
									<span className="sr-only">
										{showConfirmPassword
											? "Hide password"
											: "Show password"}
									</span>
								</Button>
							</div>
						</div>
					</form>
					<Button
						onClick={handleGoogleSignUp}
						className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-gray-100 text-gray-900 border border-gray-300"
					>
						<svg
							className="w-5 h-5"
							viewBox="0 0 24 24"
							fill="currentColor"
						>
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="#34A853"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								fill="#EA4335"
							/>
						</svg>
						<span>Sign up with Google</span>
					</Button>
					<Button
						onClick={handleFacebookSignUp}
						className="w-full flex items-center justify-center space-x-2 bg-[#1877f2] hover:bg-[#166fe5] text-white"
					>
						<svg
							className="w-5 h-5"
							fill="currentColor"
							viewBox="0 0 24 24"
						>
							<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
						</svg>
						<span>Sign up with Facebook</span>
					</Button>
				</CardContent>
				<CardFooter className="flex flex-col space-y-4">
					<div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
						<Button
							variant="outline"
							className="w-full sm:w-1/2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
							onClick={() => navigate(-1)}
						>
							<ArrowLeft className="mr-2 h-4 w-4" /> Back
						</Button>
						<Button
							type="submit"
							className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700 text-white"
							onClick={handleSignUp}
						>
							Sign Up
						</Button>
					</div>
					<div className="text-sm text-center text-gray-600 dark:text-gray-400 space-y-2">
						<a
							href="/login"
							className="text-blue-600 dark:text-blue-400 hover:underline block"
						>
							Already have an account? Log In
						</a>
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
