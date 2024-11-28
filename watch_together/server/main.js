// main.js - watchtogether backend
require('dotenv').config({ path: './variables.env' });

const port = process.env.watch_together_PORT;
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
});

app.get("/", (req, res) => {
  res.send("Watch Together server is running");
});

// Listen for user joining a room and handle message sending
io.on("connection", (socket) => {
  console.log("A user connected");

  // When a user joins a room
  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId); // Join a room based on the roomId
    console.log(`${username} joined room: ${roomId}`);

    if(username != null){
      // Notify other users in the room that a new user has joined
      socket.to(roomId).emit("user-joined", username);
    }
  });

  // Handle receiving messages from users
  socket.on("send-message", ({ roomId, message, username }) => {
    console.log(`Message from ${username} in room ${roomId}: ${message}`);
  
    // Emit the message to all users in the room
    socket.to(roomId).emit("receive-message", { username, message });
  
    // Acknowledge the sender that the message was successfully sent
    socket.emit("message-sent", { message, username });
  });

  // Handle video sync commands (play, pause, seek)
  socket.on("video-command", ({ roomId, command, time }) => {
    console.log('Video Activity');
    socket.to(roomId).emit("sync-video", { command, time });
  });

  // Handle disconnecting users
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

server.listen(port, () => {
    console.log(`Watch Together Service is running on port ${port}`);
});