import React from 'react';
import ReactDOM from 'react-dom/client';
import FileUploadForm from './FileUploadForm.jsx';
import S3VideoPlayer from './S3VideoPlayer.jsx';
import KafkaProducer from './KafkaProducer.jsx';

ReactDOM.createRoot(document.getElementById('contents')).render(<S3VideoPlayer />);