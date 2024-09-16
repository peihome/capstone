import React, { useState, useEffect } from 'react';
import axios from 'axios';

const backendPort = process.env.transcoder_PORT;
const websocketPort = process.env.websocket_PORT;

const backendUrl = `http://localhost:${backendPort}`;
const websocketUrl = `ws://localhost:${websocketPort}`;

function KafkaProducer() {
  const [message, setMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState([]);

  // Connect to WebSocket to receive Kafka messages
  useEffect(() => {
    const socket = new WebSocket(websocketUrl);

    socket.onmessage = (event) => {
      setReceivedMessages((prev) => [...prev, event.data]);
    };

    return () => {
      socket.close();
    };
  }, []);

  // Function to send messages to the backend
  const sendMessage = async () => {
    try {
      await axios.post(`${backendUrl}/send`, { message });
      setMessage(''); // Clear input field after sending
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="App">
      <h1>Kafka Messaging with Docker</h1>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={sendMessage}>Send Message</button>

      <h2>Received Kafka Messages:</h2>
      <ul>
        {receivedMessages.map((msg, index) => (
          <li key={index}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}

export default KafkaProducer;