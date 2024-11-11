const { VideoPlaylist } = require('../ORM/sequelizeInit.js');


// Insert operation to add a video to a playlist
const insertVideoToPlaylist = async (video_id, playlist_id) => {
    try {
        // Insert a new entry in the VIDEO_PLAYLIST table
        await VideoPlaylist.create({ video_id, playlist_id });
        console.log('Video successfully added to the playlist');
        return { message: 'Video successfully added to the playlist' };
    } catch (error) {
        console.error('Error adding video to playlist:', error);
        throw new Error('Could not add video to playlist');
    }
};

// Delete operation to remove a video from a playlist
const deleteVideoFromPlaylist = async (video_id, playlist_id) => {
    try {
        // Delete the entry from VIDEO_PLAYLIST table
        await VideoPlaylist.destroy({
            where: { video_id, playlist_id }
        });
        console.log('Video successfully removed from the playlist');
        return { message: 'Video successfully removed from the playlist' };
    } catch (error) {
        console.error('Error removing video from playlist:', error);
        throw new Error('Could not remove video from playlist');
    }
};

module.exports = { insertVideoToPlaylist, deleteVideoFromPlaylist };