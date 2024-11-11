const { UsersVsNotification } = require('../ORM/sequelizeInit.js');
const { getCurrentUserId } = require('./table_USER.js');

const handleUserNotification = async (req, res) => {
    const { notification_type_id, is_enabled } = req.body;

    try {
        if (is_enabled) {
            // Call the function to enable the user notification
            await enableUserNotification(notification_type_id, is_enabled);
        } else {
            // Call the function to disable the user notification
            await disableUserNotification(notification_type_id, is_enabled);
        }

        // Send the response with the updated user notification preference
        res.status(200).json({
            message: 'Notification preference updated successfully',
        });

    } catch (error) {
        console.error('Error in setting notification preference:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const disableUserNotification = async (notification_type_id, is_enabled) => {
    const user_id = getCurrentUserId(); // Get the current user ID

    try {
        // Validate if the required fields are provided
        if (notification_type_id === undefined || is_enabled === undefined) {
            throw new Error('notification_type_id and is_enabled are required.');
        }

        // Find the existing user notification by its ID
        const userNotification = await UsersVsNotification.findOne({
            where: { notification_type_id, user_id },
        });

        // If the notification doesn't exist, return an error
        if (!userNotification) {
            throw new Error('User notification not found or not authorized.');
        }

        // Disable the notification
        userNotification.is_enabled = false;

        // Save the updated user notification
        await userNotification.save();

    } catch (error) {
        console.error('Error in disabling user notification:', error);
        throw error; // Rethrow the error so it can be handled by the caller
    }
};

const enableUserNotification = async (notification_type_id, is_enabled) => {
    const user_id = getCurrentUserId(); // Get the current user ID

    try {
        // Validate if the required fields are provided
        if (notification_type_id === undefined || is_enabled === undefined) {
            throw new Error('notification_type_id and is_enabled are required.');
        }

        // Find the existing user notification by its ID
        const userNotification = await UsersVsNotification.findOne({
            where: { notification_type_id, user_id },
        });

        // If the notification doesn't exist, return an error
        if (!userNotification) {
            throw new Error('User notification not found or not authorized.');
        }

        // Enable the notification
        userNotification.is_enabled = true;

        // Save the updated user notification
        await userNotification.save();

    } catch (error) {
        console.error('Error in enabling user notification:', error);
        throw error; // Rethrow the error so it can be handled by the caller
    }
};

module.exports = { handleUserNotification };