const { Dispute } = require('../ORM/sequelizeInit.js');

const createDispute = async (req, res) => {
    const { video_id, dispute_type_id } = req.body;
    const reporter_id = getCurrentUserId(); // Assuming you have a method to get the current user's ID

    // Validate input data
    if (!video_id || !dispute_type_id) {
        return res.status(400).json({ error: 'video_id and dispute_type_id are required.' });
    }

    try {
        // Create a new dispute
        const newDispute = await Dispute.create({
            video_id,
            reporter_id,
            dispute_type_id,
            status_id: 0,
        });

        return res.status(201).json({
            message: 'Dispute created successfully.',
            data: newDispute,
        });
    } catch (error) {
        console.error('Error creating dispute:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const updateDisputeStatus = async (req, res) => {
    const { dispute_id, status_id } = req.body;

    // Validate status input
    if (!status_id) {
        return res.status(400).json({ error: 'status_id is required.' });
    }

    try {
        // Find the dispute by ID
        const dispute = await Dispute.findByPk(dispute_id);

        if (!dispute) {
            return res.status(404).json({ error: 'Dispute not found.' });
        }

        // Update the dispute status
        dispute.status_id = status_id;
        await dispute.save();

        return res.status(200).json({
            message: 'Dispute status updated successfully.',
            data: dispute,
        });
    } catch (error) {
        console.error('Error updating dispute status:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { createDispute, updateDisputeStatus };
