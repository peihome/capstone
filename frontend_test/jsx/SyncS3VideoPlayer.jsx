

import { io } from 'socket.io-client';

const socket = io('http://localhost:7186', { withCredentials: true });

const SyncS3VideoPlayer = () => {
  

  const roomId = window.location.hash.split('/')[2]; 

  useEffect(() => {
    
  }, [videoUrl, roomId]);

  

  return (
    
  );
};

export default SyncS3VideoPlayer;