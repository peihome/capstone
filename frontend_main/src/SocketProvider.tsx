import React, { createContext, useContext } from "react";
import { io } from "socket.io-client";

import { Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

const socket = io("https://watch.nexstream.live", { withCredentials: true });

import { ReactNode } from "react";

export const SocketProvider = ({ children }: { children: ReactNode }) => (
	<SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
);

export const useSocket = () => useContext(SocketContext);
