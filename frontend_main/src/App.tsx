import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { DarkModeProvider } from "./DarkModeContext";
import { Container } from "./container";
import LoginPage from "./LoginPage";
import SignUpPage from "./SignUpPage";
import ForgotPassword from "./ForgotPassword";
import ProfileCreationPage from "./ProfileCreationPage";
import UserProfilePage from "./UserProfilePage";
import HomePage from "./HomePage";
import VideoPage from "./VideoPage";
import VideoUploadPage from "./VideoUploadPage";
import AdminDashboard from "./AdminDashboard";
import About from "./AboutPage";
import Press from "./PressPage";
import Contact from "./ContactPage";
import VideoReviewPage from "./VideoReviewPage";
import VideoUnavailablePage from "./VideoUnavailable";
import WatchTogether from "./WatchTogether";
import WatchRoom from "./WatchRoom";
import { SearchProvider } from "./SearchContext";
import ProtectedRoute from "./ProtectedRoute";

export default function App() {
	return (
		<DarkModeProvider>
			<Router>
				<SearchProvider>
					<Container>
						<Routes>
							<Route path="/" element={<HomePage />} />
							<Route path="/login" element={<LoginPage />} />
							<Route path="/register" element={<SignUpPage />} />
							<Route
								path="/forgot-password"
								element={<ForgotPassword />}
							/>
							<Route
								path="/create-profile/:userId"
								element={<ProfileCreationPage />}
							/>
							<Route
								path="/:username"
								element={<UserProfilePage />}
							/>
							<Route
								path="/video/:videoId"
								element={<VideoPage />}
							/>
							<Route
								path="/:username/upload"
								element={<VideoUploadPage />}
							/>
							<Route
								path="/admin"
								element={
									<ProtectedRoute>
										<AdminDashboard />
									</ProtectedRoute>
								}
							/>
							<Route path="/about" element={<About />} />
							<Route path="/press" element={<Press />} />
							<Route path="/contact" element={<Contact />} />
							<Route
								path="/admin/review/:videoId"
								element={<VideoReviewPage />}
							/>
							<Route
								path="/video/unavailable"
								element={<VideoUnavailablePage />}
							/>
							{/* Route for the Watch Together page */}
							<Route path="/room" element={<WatchTogether />} />

							{/* Route for the Watch Room page */}
							<Route
								path="/room/:roomId"
								element={<WatchRoom />}
							/>
						</Routes>
					</Container>
				</SearchProvider>
			</Router>
		</DarkModeProvider>
	);
}
