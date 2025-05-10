import React from 'react';
import { StarRating } from '../gameCard/gameCard'; // Путь может отличаться
import './reviewItem.css';

const ReviewItem = ({ review }) => {
    // Используем review.rank напрямую, предполагая, что он уже 0-5
    const displayRating = review.rank;
    const numericRatingText = `${parseFloat(review.rank).toFixed(1)}/5`;

    return (
        <li className="review-item">
            <div className="review-item-header">
                <span className="review-item-user">{review.userLogin || 'Аноним'}</span>
                <div className="review-item-header-right">
                    <div className="review-item-rating-display">
                        <StarRating rating={displayRating} maxStars={5} />
                        <span className="rating-value-text">{numericRatingText}</span>
                    </div>
                    <span className="review-item-date">
                        {new Date(review.created_at).toLocaleDateString()}
                    </span>
                </div>
            </div>
            {review.review_text && <p className="review-item-text">{review.review_text}</p>}
        </li>
    );
};

export default ReviewItem;