const { UserVsChannel } = require('../ORM/sequelizeInit.js');
const { getCurrentUserId } = require('../controller/session.js');

// Method to add the user to a channel
const addUserToChannel = async (req, channel_id) => {
    const user_id = getCurrentUserId(req);

    try {
        // Validate if the required fields are provided
        if (channel_id === undefined) {
            throw new Error('channel_id is required.');
        }

        // Create a new user-channel relationship
        const newUserChannel = await UserVsChannel.create({
            user_id,
            channel_id,
        });

        // Return the created user-channel relationship
        return {
            message: 'User successfully added to the channel.',
            data: newUserChannel,
        };

    } catch (error) {
        console.error('Error in adding user to channel:', error);
        throw new Error('Internal server error');
    }
};

module.exports = { addUserToChannel };