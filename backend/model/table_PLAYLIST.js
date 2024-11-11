const { Playlist } = require('../ORM/sequelizeInit.js');

// Insert operation to add a new playlist
const insertPlaylist = async (name, user_id) => {
    try {
        // Insert a new entry in the PLAYLIST table
        const newPlaylist = await Playlist.create({ name, user_id });
        console.log('Playlist successfully created');
        return { message: 'Playlist successfully created', playlist: newPlaylist };
    } catch (error) {
        console.error('Error creating playlist:', error);
        throw new Error('Could not create playlist');
    }
};

// Delete operation to remove a playlist
const deletePlaylist = async (playlist_id) => {
    try {
        // Delete the entry from the PLAYLIST table
        const deleteResult = await Playlist.destroy({
            where: { playlist_id }
        });

        if (deleteResult) {
            console.log('Playlist successfully deleted');
            return { message: 'Playlist successfully deleted' };
        } else {
            return { message: 'Playlist not found' };
        }
    } catch (error) {
        console.error('Error deleting playlist:', error);
        throw new Error('Could not delete playlist');
    }
};

module.exports = { insertPlaylist, deletePlaylist };