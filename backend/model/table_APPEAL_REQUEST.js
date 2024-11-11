const { AppealRequest } = require('../ORM/sequelizeInit.js');
const { getCurrentUserId } = require('./table_USER.js');

const createAppealRequest = async (req, res) => {
    const { appeal_type_id, video_id, channel_id, reason, status_id } = req.body;
    const user_id = getCurrentUserId();

    try {
        // Validate if required fields are provided
        if (!appeal_type_id || !reason || !status_id) {
            return res.status(400).json({ message: 'appeal_type_id, reason, and status_id are required.' });
        }

        // Validate if appeal type exists
        const appealType = await AppealType.findByPk(appeal_type_id);
        if (!appealType) {
            return res.status(400).json({ message: 'Invalid appeal type.' });
        }

        // Validate if appeal status exists
        const appealStatus = await AppealStatus.findByPk(status_id);
        if (!appealStatus) {
            return res.status(400).json({ message: 'Invalid appeal status.' });
        }

        // Validate if either video_id or channel_id is provided, not both
        if ((video_id && channel_id) || (!video_id && !channel_id)) {
            return res.status(400).json({ message: 'You must provide either video_id or channel_id, but not both.' });
        }

        // Validate if video exists (if video_id is provided)
        if (video_id) {
            const video = await Video.findByPk(video_id);
            if (!video) {
                return res.status(400).json({ message: 'Invalid video.' });
            }
        }

        // Validate if channel exists (if channel_id is provided)
        if (channel_id) {
            const channel = await Channel.findByPk(channel_id);
            if (!channel) {
                return res.status(400).json({ message: 'Invalid channel.' });
            }
        }

        // Create the appeal request
        const newAppealRequest = await AppealRequest.create({
            user_id,
            appeal_type_id,
            video_id,
            channel_id,
            reason,
            status_id,
        });

        return res.status(201).json({
            message: 'Appeal request created successfully.',
            data: newAppealRequest
        });

    } catch (error) {
        console.error('Error creating appeal request:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const updateAppealStatus = async (req, res) => {
    const { appeal_id, status_id } = req.body;

    try {
        // Validate if status_id is provided
        if (!status_id) {
            return res.status(400).json({ message: 'status_id is required.' });
        }

        // Validate if the appeal request exists
        const appealRequest = await AppealRequest.findByPk(appeal_id);
        if (!appealRequest) {
            return res.status(404).json({ message: 'Appeal request not found.' });
        }

        // Validate if the provided status_id exists in the AppealStatus table
        const appealStatus = await AppealStatus.findByPk(status_id);
        if (!appealStatus) {
            return res.status(400).json({ message: 'Invalid status_id.' });
        }

        // Update the appeal request's status_id
        await appealRequest.update({ status_id });

        return res.status(200).json({
            message: 'Appeal status updated successfully.',
            data: appealRequest
        });

    } catch (error) {
        console.error('Error updating appeal status:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {createAppealRequest, updateAppealStatus};