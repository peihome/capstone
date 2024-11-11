const { Sequelize, DataTypes } = require('sequelize');

// Connect to PostgreSQL database
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: false
});

// ROLE table
const Role = sequelize.define('Role', {
  role_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  role_name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT }
}, { tableName: 'ROLE', timestamps: false });

// USER_STATUS table
const UserStatus = sequelize.define('UserStatus', {
  status_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  status_name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT }
}, { tableName: 'USER_STATUS', timestamps: false });

// USER table
const User = sequelize.define('User', {
  user_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  status_id: { type: DataTypes.INTEGER, allowNull: false },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'USER', timestamps: false });

UserStatus.hasMany(User, { foreignKey: 'status_id' });
User.belongsTo(UserStatus, { foreignKey: 'status_id' });

// USER_ROLE table
const UserRole = sequelize.define('UserRole', {
  user_role_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  assigned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'USER_ROLE', timestamps: false });

UserRole.belongsTo(User, { foreignKey: 'user_id' });
UserRole.belongsTo(Role, { foreignKey: 'role_id' });

// CHANNEL_STATUS table
const ChannelStatus = sequelize.define('ChannelStatus', {
  status_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  status_name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT }
}, { tableName: 'CHANNEL_STATUS', timestamps: false });

// CHANNEL table
const Channel = sequelize.define('Channel', {
  channel_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'CHANNEL', timestamps: false });

User.hasMany(Channel, { foreignKey: 'user_id' });
Channel.belongsTo(User, { foreignKey: 'user_id' });

ChannelStatus.hasMany(Channel, { foreignKey: 'status_id' });
Channel.belongsTo(ChannelStatus, { foreignKey: 'status_id' });

// USER_VS_CHANNEL table
const UserVsChannel = sequelize.define('UserVsChannel', {
  user_vs_channel_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER },
  channel_id: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'USER_VS_CHANNEL', timestamps: false });

UserVsChannel.belongsTo(User, { foreignKey: 'user_id' });
UserVsChannel.belongsTo(Channel, { foreignKey: 'channel_id' });

// VIDEO table
const Video = sequelize.define('Video', {
  video_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  etag: { type: DataTypes.STRING, allowNull: false },
  bucket_name: { type: DataTypes.STRING, allowNull: false },
  transcoding_status: { type: DataTypes.STRING },
  video_url: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'VIDEO', timestamps: false });

User.hasMany(Video, { foreignKey: 'user_id' });
Video.belongsTo(User, { foreignKey: 'user_id' });

Channel.hasMany(Video, { foreignKey: 'channel_id' });
Video.belongsTo(Channel, { foreignKey: 'channel_id' });

// COMMENT table
const Comment = sequelize.define('Comment', {
  comment_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  content: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'COMMENT', timestamps: false });

User.hasMany(Comment, { foreignKey: 'user_id' });
Comment.belongsTo(User, { foreignKey: 'user_id' });

Video.hasMany(Comment, { foreignKey: 'video_id' });
Comment.belongsTo(Video, { foreignKey: 'video_id' });

// NOTIFICATION_TYPE table
const NotificationType = sequelize.define('NotificationType', {
  notification_type_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type_name: { type: DataTypes.STRING, allowNull: false, unique: true }
}, { tableName: 'NOTIFICATION_TYPE', timestamps: false });

// USERS_VS_NOTIFICATION table
const UsersVsNotification = sequelize.define('UsersVsNotification', {
  user_vs_notification_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER },
  notification_type_id: { type: DataTypes.INTEGER },
  is_enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'USERS_VS_NOTIFICATION', timestamps: false });

UsersVsNotification.belongsTo(User, { foreignKey: 'user_id' });
UsersVsNotification.belongsTo(NotificationType, { foreignKey: 'notification_type_id' });

// NOTIFICATION table
const Notification = sequelize.define('Notification', {
  notification_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  message: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'NOTIFICATION', timestamps: false });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

Video.hasMany(Notification, { foreignKey: 'video_id' });
Notification.belongsTo(Video, { foreignKey: 'video_id' });

// SUBSCRIPTION table
const Subscription = sequelize.define('Subscription', {
  sub_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  subscriber_id: {type: DataTypes.INTEGER},
  subscribed_to_channel_id: {type: DataTypes.INTEGER},
  subscribed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'SUBSCRIPTION', timestamps: false });

User.hasMany(Subscription, { foreignKey: 'subscriber_id' });
Subscription.belongsTo(User, { foreignKey: 'subscriber_id' });

Channel.hasMany(Subscription, { foreignKey: 'subscribed_to_channel_id' });
Subscription.belongsTo(Channel, { foreignKey: 'subscribed_to_channel_id' });

// PLAYLIST table
const Playlist = sequelize.define('Playlist', {
  playlist_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'PLAYLIST', timestamps: false });

User.hasMany(Playlist, { foreignKey: 'user_id' });
Playlist.belongsTo(User, { foreignKey: 'user_id' });

// VIDEO_PLAYLIST table
const VideoPlaylist = sequelize.define('VideoPlaylist', {}, { tableName: 'VIDEO_PLAYLIST', timestamps: false });

VideoPlaylist.belongsTo(Video, { foreignKey: 'video_id' });
VideoPlaylist.belongsTo(Playlist, { foreignKey: 'playlist_id' });

// TRANSCODING table
const Transcoding = sequelize.define('Transcoding', {
  trans_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  status: { type: DataTypes.STRING },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  completed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'TRANSCODING', timestamps: false });

Video.hasMany(Transcoding, { foreignKey: 'video_id' });
Transcoding.belongsTo(Video, { foreignKey: 'video_id' });

// DISPUTE_STATUS table
const DisputeStatus = sequelize.define('DisputeStatus', {
  status_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  status_name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: 'DISPUTE_STATUS', timestamps: false });

// DISPUTE_TYPE table
const DisputeType = sequelize.define('DisputeType', {
  dispute_type_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type_name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: 'DISPUTE_TYPE', timestamps: false });

// DISPUTE table
const Dispute = sequelize.define('Dispute', {
  dispute_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  video_id: {type: DataTypes.INTEGER},
  reporter_id: {type: DataTypes.INTEGER},
  dispute_type_id: {type: DataTypes.INTEGER},
  status_id: { type: DataTypes.STRING },
  reported_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'DISPUTE', timestamps: false });

Video.hasMany(Dispute, { foreignKey: 'video_id' });
Dispute.belongsTo(Video, { foreignKey: 'video_id' });

DisputeStatus.hasMany(Dispute, { foreignKey: 'status_id' });
Dispute.belongsTo(DisputeStatus, { foreignKey: 'status_id' });

DisputeType.hasMany(Dispute, { foreignKey: 'dispute_type_id' });
Dispute.belongsTo(DisputeType, { foreignKey: 'dispute_type_id' });

// Define APPEAL_TYPE Model
const AppealType = sequelize.define('AppealType', {
  appeal_type_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  type_name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT }
}, { tableName: 'APPEAL_TYPE', timestamps: false });

// Define APPEAL_REQUEST Model
const AppealRequest = sequelize.define('AppealRequest', {
  appeal_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  appeal_type_id: { type: DataTypes.INTEGER, allowNull: false },
  video_id: { type: DataTypes.INTEGER, allowNull: true },
  channel_id: { type: DataTypes.INTEGER, allowNull: true },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status_id: { type: DataTypes.INTEGER, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  last_updated: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'APPEAL_REQUEST', timestamps: false });

// Define APPEAL_STATUS Model
const AppealStatus = sequelize.define('AppealStatus', {
  status_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  status_name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT }
}, { tableName: 'APPEAL_STATUS', timestamps: false });

// Define the relationship for APPEAL_REQUEST
AppealRequest.belongsTo(User, { foreignKey: 'user_id' }); // Assuming User model is already defined
AppealRequest.belongsTo(Video, { foreignKey: 'video_id', allowNull: true }); // Assuming Video model is already defined
AppealRequest.belongsTo(Channel, { foreignKey: 'channel_id', allowNull: true }); // Assuming Channel model is already defined
AppealRequest.belongsTo(AppealType, { foreignKey: 'appeal_type_id' });
AppealRequest.belongsTo(AppealStatus, { foreignKey: 'status_id' });

// Define the relationship for APPEAL_STATUS
AppealStatus.hasMany(AppealRequest, { foreignKey: 'status_id' });
AppealRequest.belongsTo(AppealStatus, { foreignKey: 'status_id' });

// Define the relationship for APPEAL_TYPE
AppealType.hasMany(AppealRequest, { foreignKey: 'appeal_type_id' });
AppealRequest.belongsTo(AppealType, { foreignKey: 'appeal_type_id' });


// Define VIDEO_REVIEW_STATUS Model
const VideoReviewStatus = sequelize.define('VideoReviewStatus', {
  status_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  status_name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT }
}, { tableName: 'VIDEO_REVIEW_STATUS', timestamps: false });

// Define VIDEO_VS_REVIEW Model
const VideoVsReview = sequelize.define('VideoVsReview', {
  review_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  video_id: { type: DataTypes.INTEGER, allowNull: false },
  status_id: { type: DataTypes.INTEGER, allowNull: false },
  reviewed_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'VIDEO_VS_REVIEW', timestamps: false });

// Define the relationship for VIDEO_REVIEW_STATUS
VideoReviewStatus.hasMany(VideoVsReview, { foreignKey: 'status_id' });
VideoVsReview.belongsTo(VideoReviewStatus, { foreignKey: 'status_id' });

// Define the relationship for VIDEO_VS_REVIEW
VideoVsReview.belongsTo(Video, { foreignKey: 'video_id' }); // Assuming Video model is already defined
VideoVsReview.belongsTo(VideoReviewStatus, { foreignKey: 'status_id' });
Video.hasMany(VideoVsReview, { foreignKey: 'video_id' });

module.exports = {
    Role,
    UserStatus,
    User,
    UserRole,
    ChannelStatus,
    Channel,
    UserVsChannel,
    Video,
    Comment,
    NotificationType,
    UsersVsNotification,
    Notification,
    Subscription,
    Playlist,
    VideoPlaylist,
    Transcoding,
    DisputeStatus,
    DisputeType,
    Dispute,
    AppealType,
    AppealRequest,
    AppealStatus,
    VideoReviewStatus,
    VideoVsReview
}