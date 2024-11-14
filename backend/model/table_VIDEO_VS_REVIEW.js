const { VideoVsReview } = require('../ORM/sequelizeInit.js');

// Function to create a new review row
const createReview = async (video_id, status_id) => {
    try {
        const newReview = await VideoVsReview.create({ video_id, status_id });
        console.log('Review entry created successfully');
        return { message: 'Review entry created successfully', review: newReview };
    } catch (error) {
        console.error('Error creating review entry:', error);
        throw new Error('Could not create review entry');
    }
};

// Function to update the status of an existing review
const updateReviewStatus = async (review_id, new_status_id) => {
    try {
        const review = await VideoVsReview.findByPk(review_id);
        
        if (!review) {
            console.log('Review entry not found');
            return { message: 'Review entry not found' };
        }

        // Update the status_id of the review entry
        review.status_id = new_status_id;
        await review.save();

        console.log('Review status updated successfully');
        return { message: 'Review status updated successfully', review };
    } catch (error) {
        console.error('Error updating review status:', error);
        throw new Error('Could not update review status');
    }
};

module.exports = { createReview, updateReviewStatus };