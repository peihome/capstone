import React from 'react';
import ReactDOM from 'react-dom/client';
import FileUploadForm from './FileUploadForm.jsx';
import S3VideoPlayer from './S3VideoPlayer.jsx';
import KafkaProducer from './KafkaProducer.jsx';
import WatchTogether from './WatchTogether.jsx';
import WatchRoom from './WatchRoom.jsx';
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { SocketProvider } from "./SocketProvider.jsx";

function App() {
    return (
      <Router>
        <Routes>
          {/* Route for the Watch Together page */}
          <Route path="/" element={<WatchTogether />} />
  
          {/* Route for the Watch Room page */}
          <Route path="/room/:roomId" element={<WatchRoom />} />
        </Routes>
      </Router>
    );
  }

ReactDOM.createRoot(document.getElementById("contents")).render(
  <SocketProvider>
    <App />
  </SocketProvider>
);