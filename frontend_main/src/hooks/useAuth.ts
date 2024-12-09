import { useState, useEffect } from "react";

export const useAuth = () => {
	const [isAdmin, setIsAdmin] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const checkAuth = () => {
			const userId = localStorage.getItem("user_id");
			setIsAdmin(userId === "a4087a77-991f-40d2-8240-1dcee88f52b2");
			setIsLoading(false);
		};

		checkAuth();
	}, []);

	return { isAdmin, isLoading };
};
