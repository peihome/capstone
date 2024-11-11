const { Subscription } = require('../ORM/sequelizeInit.js');

const subscribeToChannel = async (req, res) => {
    const { channel_id } = req.params;
    const user_id = getCurrentUserId(); // Get the current user ID

    try {
        // Validate if the channel_id is provided
        if (!channel_id) {
            return res.status(400).json({ error: 'channel_id is required.' });
        }

        // Check if the user is already subscribed to the channel
        const existingSubscription = await Subscription.findOne({
            where: { subscriber_id: user_id, subscribed_to_channel_id: channel_id },
        });

        if (existingSubscription) {
            return res.status(400).json({ error: 'User is already subscribed to this channel.' });
        }

        // Create the subscription
        const newSubscription = await Subscription.create({
            subscriber_id: user_id,
            subscribed_to_channel_id: channel_id,
        });

        return res.status(201).json({
            message: 'User successfully subscribed to the channel.',
            data: newSubscription,
        });
    } catch (error) {
        console.error('Error subscribing to channel:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const unsubscribeFromChannel = async (req, res) => {
    const { channel_id } = req.params;
    const user_id = getCurrentUserId(); // Get the current user ID

    try {
        // Validate if the channel_id is provided
        if (!channel_id) {
            return res.status(400).json({ error: 'channel_id is required.' });
        }

        // Find the existing subscription
        const existingSubscription = await Subscription.findOne({
            where: { subscriber_id: user_id, subscribed_to_channel_id: channel_id },
        });

        if (!existingSubscription) {
            return res.status(400).json({ error: 'User is not subscribed to this channel.' });
        }

        // Delete the subscription
        await existingSubscription.destroy();

        return res.status(200).json({
            message: 'User successfully unsubscribed from the channel.',
        });
    } catch (error) {
        console.error('Error unsubscribing from channel:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { subscribeToChannel, unsubscribeFromChannel }