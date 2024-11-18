"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
	Search,
	Moon,
	Sun,
	Home,
	PlaySquare,
	Settings,
	HelpCircle,
	MessageSquare,
	Facebook,
	Twitter,
	Instagram,
	Menu,
	X,
	LogOut,
	User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDarkMode } from "./DarkModeContext";
import { auth } from "@/firebase/firebase";
import { signOut } from "firebase/auth";

interface ContainerProps {
	children: ReactNode;
}

export function Container({ children }: ContainerProps) {
	const { isDarkMode, toggleDarkMode } = useDarkMode();
	const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const navigate = useNavigate();

	useEffect(() => {
		setIsMounted(true);
		const unsubscribe = auth.onAuthStateChanged((user) => {
			setIsAuthenticated(!!user);
		});
		return () => unsubscribe();
	}, []);

	const toggleSideMenu = () => {
		setIsSideMenuOpen(!isSideMenuOpen);
	};

	const handleLogout = async () => {
		try {
			await signOut(auth);
			navigate("/");
		} catch (error) {
			console.error("Error signing out: ", error);
		}
	};

	const handleUserProfile = () => {
		const user = auth.currentUser;
		if (user && user.displayName) {
			navigate(`/${user.displayName}`);
		} else {
			console.error("Username not found");
			navigate("/create-profile");
		}
	};
	const handleUserUpload = () => {
		const user = auth.currentUser;
		if (user && user.displayName) {
			navigate(`/${user.displayName}/upload`);
		} else {
			console.error("Username not found");
			navigate("/create-profile");
		}
	};

	return (
		<div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
			<header className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md z-10">
				<div className="flex items-center space-x-4">
					<Button
						variant="ghost"
						size="icon"
						className="md:hidden"
						onClick={toggleSideMenu}
					>
						<Menu className="h-6 w-6" />
					</Button>
					<svg
						className="w-8 h-8 md:w-10 md:h-10 text-blue-600 dark:text-blue-400"
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<path d="M4 8H2v12c0 1.1.9 2 2 2h12v-2H4V8zm16-6H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" />
					</svg>
					<span className="text-lg md:text-xl font-bold">
						Nexstream
					</span>
				</div>
				<div className="hidden md:flex items-center space-x-4 flex-grow max-w-xl mx-4">
					<Input
						type="search"
						placeholder="Search..."
						className="w-full bg-gray-100 dark:bg-gray-700"
					/>
					<Button
						size="icon"
						variant="outline"
						className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
					>
						<Search className="h-4 w-4" />
					</Button>
				</div>
				{isMounted && (
					<div className="flex items-center space-x-4">
						<Switch
							checked={isDarkMode}
							onCheckedChange={toggleDarkMode}
							className="bg-gray-300 dark:bg-gray-600"
						/>
						{isDarkMode ? (
							<Moon className="h-4 w-4 text-yellow-400" />
						) : (
							<Sun className="h-4 w-4 text-yellow-500" />
						)}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="hover:bg-gray-200 dark:hover:bg-gray-700"
								>
									<Menu className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								{isAuthenticated ? (
									<>
										<DropdownMenuItem
											onClick={handleUserProfile}
										>
											<User className="mr-2 h-4 w-4" />
											<span>User Profile</span>
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={handleUserUpload}
										>
											<User className="mr-2 h-4 w-4" />
											<span>upload</span>
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={handleLogout}
										>
											<LogOut className="mr-2 h-4 w-4" />
											<span>Logout</span>
										</DropdownMenuItem>
									</>
								) : (
									<>
										<DropdownMenuItem
											onClick={() => navigate("/login")}
										>
											<User className="mr-2 h-4 w-4" />
											<span>Login</span>
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() =>
												navigate("/register")
											}
										>
											<User className="mr-2 h-4 w-4" />
											<span>Sign Up</span>
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				)}
			</header>

			<div className="flex flex-1 overflow-hidden">
				<aside
					className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 transform ${
						isSideMenuOpen ? "translate-x-0" : "-translate-x-full"
					} transition-transform duration-200 ease-in-out md:relative md:translate-x-0 overflow-y-auto`}
				>
					<Button
						variant="ghost"
						size="icon"
						className="absolute top-2 right-2 md:hidden"
						onClick={toggleSideMenu}
					>
						<X className="h-6 w-6" />
					</Button>
					<div className="flex flex-col h-full">
						<nav className="space-y-2 mb-8">
							<Button
								variant="ghost"
								className="w-full justify-start hover:bg-gray-200 dark:hover:bg-gray-700"
								onClick={() => navigate("/")}
							>
								<Home className="mr-2 h-4 w-4" /> Home
							</Button>
							<Button
								variant="ghost"
								className="w-full justify-start hover:bg-gray-200 dark:hover:bg-gray-700"
							>
								<PlaySquare className="mr-2 h-4 w-4" />{" "}
								Subscriptions
							</Button>
							<Button
								variant="ghost"
								className="w-full justify-start hover:bg-gray-200 dark:hover:bg-gray-700"
							>
								<Settings className="mr-2 h-4 w-4" /> Settings
							</Button>
							<Button
								variant="ghost"
								className="w-full justify-start hover:bg-gray-200 dark:hover:bg-gray-700"
							>
								<HelpCircle className="mr-2 h-4 w-4" /> Help
							</Button>
							<Button
								variant="ghost"
								className="w-full justify-start hover:bg-gray-200 dark:hover:bg-gray-700"
							>
								<MessageSquare className="mr-2 h-4 w-4" /> Send
								Feedback
							</Button>
						</nav>
						<div className="mt-auto space-y-4">
							<div className="grid grid-cols-2 gap-2 text-xs">
								<a
									href="/about"
									className="hover:underline text-gray-600 dark:text-gray-400"
								>
									About
								</a>
								<a
									href="/press"
									className="hover:underline text-gray-600 dark:text-gray-400"
								>
									Press
								</a>
								<a
									href="#"
									className="hover:underline text-gray-600 dark:text-gray-400"
								>
									Copyright
								</a>
								<a
									href="/contact"
									className="hover:underline text-gray-600 dark:text-gray-400"
								>
									Contact us
								</a>
								<a
									href="#"
									className="hover:underline text-gray-600 dark:text-gray-400"
								>
									Creators
								</a>
								<a
									href="#"
									className="hover:underline text-gray-600 dark:text-gray-400"
								>
									Advertise
								</a>
								<a
									href="#"
									className="hover:underline text-gray-600 dark:text-gray-400"
								>
									Developers
								</a>
							</div>
							<div className="grid grid-cols-2 gap-2 text-xs">
								<a
									href="#"
									className="hover:underline text-gray-600 dark:text-gray-400"
								>
									Terms
								</a>
								<a
									href="#"
									className="hover:underline text-gray-600 dark:text-gray-400"
								>
									Privacy
								</a>
								<a
									href="#"
									className="hover:underline text-gray-600 dark:text-gray-400"
								>
									Policy & Safety
								</a>
								<a
									href="#"
									className="hover:underline text-gray-600 dark:text-gray-400"
								>
									How Nexstream works
								</a>
								<a
									href="#"
									className="hover:underline text-gray-600 dark:text-gray-400"
								>
									Test new features
								</a>
								<a
									href="#"
									className="hover:underline text-gray-600 dark:text-gray-400"
								>
									Accessibility
								</a>
							</div>
							<div className="flex justify-center space-x-4">
								<Button
									variant="ghost"
									size="icon"
									className="hover:bg-gray-200 dark:hover:bg-gray-700"
								>
									<Facebook className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="hover:bg-gray-200 dark:hover:bg-gray-700"
								>
									<Twitter className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="hover:bg-gray-200 dark:hover:bg-gray-700"
								>
									<Instagram className="h-4 w-4" />
								</Button>
							</div>
							<div className="text-xs text-center text-gray-500 dark:text-gray-400">
								© 2024 Nexstream LLC
							</div>
						</div>
					</div>
				</aside>

				<main className="flex-grow overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
					{children}
				</main>
			</div>
		</div>
	);
}
