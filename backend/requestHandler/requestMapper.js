const {handleS3Upload, initiateS3Upload, completeS3Upload} = require('../controller/s3UploadHandler.js');
const {getDashboard, authenticate} = require('../controller/apiHandler.js');
const {createVideo, getVideoDetails, updateVideoVsReview, createVideoVsReview} = require('../model/table_VIDEO.js');
const {confirmUser, createUser} = require('../model/table_USER.js');
const {createChannel} = require('../model/table_CHANNEL.js');
const {getVideoComments} = require('../model/table_COMMENT.js');

module.exports = (app, upload) => {

  app.post('/upload', upload.single('chunk'), handleS3Upload);

  app.post('/initiate', initiateS3Upload);

  app.post('/complete', completeS3Upload);

  //app.post('/api/createVideoVsReview', createVideoVsReview);
  //app.post('/api/updateVideoVsReview/:review_id', updateVideoVsReview);

  app.post('/api/authenticate', authenticate);
  app.post('/api/user', createUser);
  app.post('/api/video', createVideo);
  app.post('/api/user/confirm', confirmUser);
  app.post('/api/channel', createChannel);

  app.get('/api/dashboard', getDashboard);
  app.get('/video/:uuid', getVideoDetails);
  app.get('/comments/:video_id', getVideoComments);
  
};