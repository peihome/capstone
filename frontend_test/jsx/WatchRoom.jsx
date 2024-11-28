import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import S3VideoPlayer from "./S3VideoPlayer.jsx";

const socket = io("http://localhost:7186", { withCredentials: true });

function WatchRoom() {
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
        
        {/* Embed the S3VideoPlayer component */}
        <S3VideoPlayer />

      </div>
    </div>
  );
}

export default WatchRoom;