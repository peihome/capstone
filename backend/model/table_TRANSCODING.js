const { Transcoding } = require('../ORM/sequelizeInit.js');

// Insert operation to add a new transcoding row
const insertTranscoding = async (video_id, status_id) => {
    try {
        const newTranscoding = await Transcoding.create({ video_id, status_id });
        console.log('Transcoding entry created successfully');
        return { message: 'Transcoding entry created successfully', transcoding: newTranscoding };
    } catch (error) {
        console.error('Error creating transcoding entry:', error);
        throw new Error('Could not create transcoding entry');
    }
};

// Update operation to update the status of an existing transcoding entry
const updateTranscodingStatus = async (trans_id, new_status_id, completed = false) => {
    try {
        const transcoding = await Transcoding.findByPk(trans_id);

        if (!transcoding) {
            console.log('Transcoding entry not found');
            return { message: 'Transcoding entry not found' };
        }

        // Update the status_id and completed_at fields
        transcoding.status_id = new_status_id;
        if (completed) {
            transcoding.completed_at = new Date(); // Set to the current timestamp
        }

        await transcoding.save();

        console.log('Transcoding status updated successfully');
        return { message: 'Transcoding status updated successfully', transcoding };
    } catch (error) {
        console.error('Error updating transcoding status:', error);
        throw new Error('Could not update transcoding status');
    }
};

module.exports = { insertTranscoding, updateTranscodingStatus };