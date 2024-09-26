calculateVideoRating = (views, subscriberCount, likes, dislikes) => {
    // Calculate Likes vs Dislikes Ratio
    const totalLikes = likes + dislikes;
    const likesVsDislikesRatio = totalLikes > 0 ? (likes / totalLikes) : 0.5; // Neutral if no likes or dislikes

    const w1 = 0.5; // Weight for Views
    const w2 = 0.3; // Weight for Subscriber Count
    const w3 = 0.2; // Weight for Likes vs Dislikes Ratio

    // Calculate Video Rating
    const rating = (w1 * views) + (w2 * subscriberCount) + (w3 * likesVsDislikesRatio);
    
    return Math.round(rating);;
}

module.exports = {
    calculateVideoRating
}