const {handleS3Upload, initiateS3Upload, completeS3Upload} = require('../controller/s3UploadHandler.js');
const {getDashboard, authenticate} = require('../controller/apiHandler.js');
const {createVideo, getVideoDetails, updateVideoVsReview, createVideoVsReview, transcodingComplete} = require('../model/table_VIDEO.js');
const {confirmUser, createUser, getAllUsers, updateUserStatus} = require('../model/table_USER.js');
const {createChannel} = require('../model/table_CHANNEL.js');
const {getVideoComments, postComment} = require('../model/table_COMMENT.js');
const {handleUserNotification} = require('../model/table_USERS_VS_NOTIFICATION.js');
const {subscribeToChannel, unsubscribeFromChannel} = require('../model/table_SUBSCRIPTION.js');
const { createDispute, updateDisputeStatus } = require('../model/table_DISPUTE.js');
const { createAppealRequest, updateAppealStatus, getAllAppeals } = require('../model/table_APPEAL_REQUEST.js');
const { getVideoStatistics } = require('../model/cass_VIDEO_STATISTICS.js');
const { getVideoDisputes , updateReportCount} = require('../model/cass_VIDEO_DISPUTE_COUNT.js');
const { getVideoCounters, incrementVideoDislikes, incrementVideoLikes, incrementVideoViews } = require('../model/cass_VIDEO_COUNTERS.js');
const { setUserSession, getUser, logout } = require('../controller/session.js');

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
  
  app.put('/api/notification', handleUserNotification);

  app.post('/api/subscribe/:channel_id', subscribeToChannel);
  app.delete('/api/subscribe/:channel_id', unsubscribeFromChannel);

  app.post('/api/dispute', createDispute);
  //app.put('/api/dispute', updateDisputeStatus);

  app.post('/api/appeal', createAppealRequest);
  app.put('/api/appeal', updateAppealStatus);

  app.get('/api/dashboard', getDashboard);
  app.get('/video/:uuid', getVideoDetails);
  app.get('/comments/:video_id', getVideoComments);


  app.post('/api/video/report/:video_id', updateReportCount);

  //Vides, Likes, Dislikes APIs
  app.get('/video/metrics/:video_id', getVideoCounters);

  app.put('/video/views/:video_id', incrementVideoViews);
  app.put('/video/likes/:video_id', incrementVideoLikes);
  app.put('/video/dislikes/:video_id', incrementVideoDislikes);

  //Sessions
  app.post('/api/user/session', setUserSession);
  app.get('/api/user', getUser);
  app.post('/logout', logout);

  
  //Admin Console
  app.get('/api/admin/video-stats', getVideoStatistics);
  app.get('/api/admin/users', getAllUsers);
  app.get('/api/admin/disputes', getVideoDisputes);
  app.get('/api/admin/appeals', getAllAppeals);

  app.put('/api/admin/disputes/:dispute_id', updateDisputeStatus);
  app.put('/api/admin/appeals/:appeal_id', updateAppealStatus);
  app.put('/api/admin/users/:user_id', updateUserStatus);


  //Comment
  app.post('/api/comments/:video_id', postComment);


  //Video
  app.post('/api/videos/:video_id/transcoding/complete', transcodingComplete);
  
};  