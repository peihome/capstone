import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Generate UUID
import { Link } from 'react-router-dom';

function WatchTogether() {
  const [roomId, setRoomId] = useState(null);

  const createRoom = () => {
    const newRoomId = uuidv4();
    setRoomId(newRoomId);
  };

  return (
    <div>
      <h1>Watch Together</h1>
      <button onClick={createRoom}>Create Room</button>

      {roomId && (
        <div>
          <h2>Your room ID is: {roomId}</h2>
          <Link to={`/room/${roomId}`}>Join the room</Link>
        </div>
      )}
    </div>
  );
}

export default WatchTogether;