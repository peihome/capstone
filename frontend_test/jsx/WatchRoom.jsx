import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import SyncS3VideoPlayer from "./SyncS3VideoPlayer.jsx";

import { useSocket } from "./SocketProvider.jsx";

function WatchRoom() {
  const socket = useSocket();

  const { roomId } = useParams();
  const [username, setUsername] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Get username if not set
    if (!username) {
      const user = prompt("Enter your username:");
      setUsername(user);
    }

    // Join the room
    socket.emit("join-room", { roomId, username });

    // Listen for messages
    socket.on("receive-message", ({ username, message }) => {
      console.log('MEssage received');
      setMessages((prevMessages) => [...prevMessages, { username, message }]);
    });

    // Listen for user joining
    socket.on("user-joined", (username) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { username: "System", message: `${username} has joined the room`},
      ]);
    });

    // Cleanup when the component unmounts
    return () => {

      socket.emit("leave-room", { roomId });
      
      socket.off("receive-message");
      socket.off("user-joined");
    };
  }, [roomId, username]);

  // Handle sending a message
  const handleSendMessage = () => {
    if (message.trim() !== "") {
      socket.emit("send-message", { roomId, message, username });
      setMessages((prevMessages) => [...prevMessages, { username, message }]);
      setMessage(""); // Clear input after sending
    }
  };

  return (
    <div>
      <h1>Room {roomId}</h1>

      <div>
        <h2>Chat:</h2>
        <div style={{ maxHeight: '300px', overflowY: 'scroll', border: '1px solid #ccc' }}>
          {messages.map((msg, index) => (
            <div key={index}>
              <strong>{msg.username}:</strong> {msg.message}
            </div>
          ))}
        </div>

        <div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message"
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>

      <div>
        <h2>Watch Video Together</h2>
        <h3>https://ssuurryyaa-video.s3.ca-central-1.amazonaws.com/About_Eating_Meat..._-_Nas_Daily_(1080p%2C_h264).mp4/master.m3u8</h3>
        
        <SyncS3VideoPlayer />

      </div>
    </div>
  );
}

export default WatchRoom;