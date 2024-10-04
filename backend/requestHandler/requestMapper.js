const {handleS3Upload, initiateS3Upload, completeS3Upload} = require('../controller/s3UploadHandler.js');
const {getDashboard, createUser, authenticate} = require('../controller/apiHandler.js');

module.exports = (app, upload) => {
  app.post('/upload', upload.single('chunk'), handleS3Upload);

  app.post('/initiate', initiateS3Upload);

  app.post('/complete', completeS3Upload);

  app.post('/api/authenticate', authenticate);
  app.get('/api/dashboard', getDashboard);
  app.post('/api/user', createUser);
};