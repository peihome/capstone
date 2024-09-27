"use client";

import React, { createContext, useState, useContext, useEffect } from "react";

type DarkModeContextType = {
	isDarkMode: boolean;
	toggleDarkMode: () => void;
};

const DarkModeContext = createContext<DarkModeContextType | undefined>(
	undefined
);

// Helper function to get the initial dark mode state from localStorage
const getInitialDarkMode = () => {
	if (typeof window !== "undefined") {
		const storedDarkMode = localStorage.getItem("darkMode");
		return storedDarkMode !== null ? JSON.parse(storedDarkMode) : false;
	}
	return false;
};

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [isDarkMode, setIsDarkMode] = useState(getInitialDarkMode);

	useEffect(() => {
		localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
	}, [isDarkMode]);

	useEffect(() => {
		if (isDarkMode) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [isDarkMode]);

	const toggleDarkMode = () => {
		setIsDarkMode((prevMode: any) => !prevMode);
	};

	return (
		<DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
			{children}
		</DarkModeContext.Provider>
	);
};

export const useDarkMode = () => {
	const context = useContext(DarkModeContext);
	if (context === undefined) {
		throw new Error("useDarkMode must be used within a DarkModeProvider");
	}
	return context;
};
