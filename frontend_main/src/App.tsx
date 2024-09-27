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

export default function App() {
	return (
		<DarkModeProvider>
			<Router>
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
					</Routes>
				</Container>
			</Router>
		</DarkModeProvider>
	);
}
