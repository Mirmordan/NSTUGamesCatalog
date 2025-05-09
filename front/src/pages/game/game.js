import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext';
import './game.css';

const API_BASE_URL = process.env.REACT_APP_API_SERVER_URL;
const PLACEHOLDER_IMG_SRC = '/placeholder-game-cover.png';

// Вспомогательный компонент для отображения звезд
const StarRatingDisplay = ({ rating, totalStars = 10, showValue = true, valueSuffix = "/10" }) => {
    if (rating === null || rating === undefined || rating <= 0) {
        return <div className="star-rating-display"><span className="no-rating">Рейтинг отсутствует</span></div>;
    }

    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0; // Простая логика для полузвезды
    const emptyStars = totalStars - fullStars - halfStar;

    return (
        <div className="star-rating-display">
            <div className="stars-container">
                {[...Array(fullStars)].map((_, i) => (
                    <i key={`full-${i}`} className="fas fa-star star-icon filled"></i>
                ))}
                {halfStar > 0 && <i key="half" className="fas fa-star-half-alt star-icon filled"></i>}
                {/* Простая полузвезда. Для css-only полузвезды используется .half-filled с ::before */}
                {/* Если используем FontAwesome fas fa-star-half-alt, то CSS для .half-filled не нужен */}
                {[...Array(emptyStars < 0 ? 0 : emptyStars)].map((_, i) => (
                    <i key={`empty-${i}`} className="far fa-star star-icon"></i>
                ))}
            </div>
            {showValue && <span className="rating-value">{parseFloat(rating).toFixed(1)}{valueSuffix}</span>}
        </div>
    );
};


// Вспомогательный компонент для звезд в форме отзыва
const InteractiveStarRating = ({ currentRating, onRatingChange, totalStars = 10, disabled = false }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
        <div className={`review-form-stars ${disabled ? 'disabled' : ''}`}>
            {[...Array(totalStars)].map((_, index) => {
                const starValue = index + 1;
                let iconClass = "far fa-star star-icon"; // Пустая звезда
                if ((hoverRating || currentRating) >= starValue) {
                    iconClass = "fas fa-star star-icon selected"; // Заполненная (или под ховером)
                }
                // Для эффекта "заполнения при наведении на контейнер"
                if (hoverRating && starValue <= hoverRating) {
                     iconClass += " hover-selected";
                }


                return (
                    <i
                        key={starValue}
                        className={iconClass}
                        onClick={() => !disabled && onRatingChange(starValue)}
                        onMouseEnter={() => !disabled && setHoverRating(starValue)}
                        onMouseLeave={() => !disabled && setHoverRating(0)}
                    />
                );
            })}
        </div>
    );
};


function GamePage() {
    const { gameId } = useParams();
    const { isAuthenticated, token } = useAuth();

    const [gameDetails, setGameDetails] = useState(null);
    const [isLoadingGame, setIsLoadingGame] = useState(true);
    const [error, setError] = useState('');

    const [reviews, setReviews] = useState([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [userReview, setUserReview] = useState(null);
    const [isLoadingUserReview, setIsLoadingUserReview] = useState(false);

    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRank, setReviewRank] = useState(5); // Используется для InteractiveStarRating
    const [reviewText, setReviewText] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [submitReviewMessage, setSubmitReviewMessage] = useState({ type: '', text: '' });

    const [coverImageSrc, setCoverImageSrc] = useState(`${API_BASE_URL}/api/img/${gameId}.png`);

    // Fetch Game Details
    useEffect(() => {
        const fetchGame = async () => {
            setIsLoadingGame(true);
            setError('');
            setCoverImageSrc(`${API_BASE_URL}/api/img/${gameId}.png`);
            try {
                const response = await fetch(`${API_BASE_URL}/api/games/${gameId}`);
                if (!response.ok) {
                    if (response.status === 404) throw new Error('Игра не найдена.');
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Не удалось загрузить детали игры (статус: ${response.status})`);
                }
                const data = await response.json();
                setGameDetails(data);
            } catch (err) {
                console.error("Error fetching game details:", err);
                setError(err.message);
                setGameDetails(null);
            } finally {
                setIsLoadingGame(false);
            }
        };

        if (gameId) {
            fetchGame();
        }
    }, [gameId]);

    const fetchGameReviews = useCallback(async () => {
        setIsLoadingReviews(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/reviews/game/${gameId}`);
            if (!response.ok) throw new Error('Не удалось загрузить отзывы.');
            const data = await response.json();
            setReviews(data || []);
        } catch (err) {
            console.error("Error fetching game reviews:", err);
        } finally {
            setIsLoadingReviews(false);
        }
    }, [gameId]);

    const fetchUserReview = useCallback(async () => {
        if (!isAuthenticated || !token) {
            setUserReview(null);
            return;
        }
        setIsLoadingUserReview(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/reviews/game/${gameId}/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setUserReview(data);
                setReviewRank(data.rank);
                setReviewText(data.review_text || '');
            } else if (response.status === 404) {
                setUserReview(null);
                if (!showReviewForm) {
                    setReviewRank(5); // Default for new review
                    setReviewText('');
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error("Failed to fetch user's review:", errorData.message || response.statusText);
            }
        } catch (err) {
            console.error("Error fetching user review:", err);
        } finally {
            setIsLoadingUserReview(false);
        }
    }, [gameId, isAuthenticated, token, showReviewForm]);

    useEffect(() => {
        if (gameId) {
            fetchGameReviews();
            fetchUserReview();
        }
    }, [gameId, isAuthenticated, fetchGameReviews, fetchUserReview]);

     useEffect(() => {
        if (userReview && !showReviewForm) {
            setReviewRank(userReview.rank);
            setReviewText(userReview.review_text || '');
        }
    }, [userReview, showReviewForm]);


    const handleToggleReviewForm = () => {
        setShowReviewForm(prev => !prev);
        if (!showReviewForm) {
            if (userReview) {
                setReviewRank(userReview.rank);
                setReviewText(userReview.review_text || '');
            } else {
                setReviewRank(5);
                setReviewText('');
            }
        }
        setSubmitReviewMessage({ type: '', text: '' });
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            setSubmitReviewMessage({ type: 'error', text: 'Для отправки отзыва необходимо авторизоваться.' });
            return;
        }
        if (reviewRank < 1 || reviewRank > 10) {
            setSubmitReviewMessage({ type: 'error', text: 'Оценка должна быть от 1 до 10.' });
            return;
        }

        setIsSubmittingReview(true);
        setSubmitReviewMessage({ type: '', text: '' });

        const payload = {
            rank: Number(reviewRank),
            review_text: reviewText
        };

        const method = userReview ? 'PUT' : 'POST';
        const endpoint = userReview
            ? `${API_BASE_URL}/api/reviews/game/${gameId}/my`
            : `${API_BASE_URL}/api/reviews/game/${gameId}`;

        try {
            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Не удалось ${method === 'POST' ? 'отправить' : 'обновить'} отзыв.`);
            }

            setSubmitReviewMessage({ type: 'success', text: data.message || 'Отзыв успешно обработан!' });
            setShowReviewForm(false);
            await fetchUserReview();
            await fetchGameReviews();
            if (gameDetails) {
                const gameResponse = await fetch(`${API_BASE_URL}/api/games/${gameId}`);
                if (gameResponse.ok) setGameDetails(await gameResponse.json());
            }

        } catch (err) {
            console.error("Error submitting review:", err);
            setSubmitReviewMessage({ type: 'error', text: err.message });
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleCoverImageError = () => {
        setCoverImageSrc(PLACEHOLDER_IMG_SRC);
    };


    if (isLoadingGame) {
        return <div className="game-page-loader">Загрузка информации об игре...</div>;
    }
    if (error) {
        return <div className="game-page-error-message">{error}</div>;
    }
    if (!gameDetails) {
        return <div className="game-page-error-message">Информация об игре не найдена.</div>;
    }

    return (
        <div className="game-page-container">
            <div className="game-details-layout">
                <div className="game-cover-container">
                    <img
                        src={coverImageSrc}
                        alt={gameDetails.name}
                        className="game-cover-image"
                        onError={handleCoverImageError}
                    />
                </div>
                <div className="game-info-container">
                    <h1>
                        {gameDetails.name}
                        {gameDetails.year && <span className="game-year">({gameDetails.year})</span>}
                    </h1>

                    {/* Используем StarRatingDisplay для общего рейтинга */}
                    <StarRatingDisplay rating={gameDetails.rating} />

                    {gameDetails.genre && <div className="game-info-item"><strong>Жанр:</strong> <span>{gameDetails.genre}</span></div>}
                    {gameDetails.platforms && <div className="game-info-item"><strong>Платформы:</strong> <span>{gameDetails.platforms}</span></div>}
                    {gameDetails.developer_name && <div className="game-info-item"><strong>Разработчик:</strong> <span>{gameDetails.developer_name}</span></div>}
                    {gameDetails.publisher_name && <div className="game-info-item"><strong>Издатель:</strong> <span>{gameDetails.publisher_name}</span></div>}

                    {gameDetails.description && (
                        <div className="game-description">
                            <h3>Описание:</h3>
                            <p>{gameDetails.description}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="reviews-section">
                <h2>Отзывы</h2>
                {isAuthenticated && (
                    <div className="review-action-buttons">
                        <button onClick={handleToggleReviewForm} className="auth-button">
                            {showReviewForm ? 'Отменить' : (userReview ? 'Редактировать мой отзыв' : 'Написать отзыв')}
                        </button>
                    </div>
                )}

                {showReviewForm && isAuthenticated && (
                    <div className="review-form-container auth-form-wrapper">
                        <h3>{userReview ? 'Редактировать ваш отзыв' : 'Оставить отзыв'}</h3>
                        <form onSubmit={handleReviewSubmit}>
                            <div className="auth-input-group">
                                <label htmlFor="reviewRank">Оценка:</label>
                                {/* Используем InteractiveStarRating для формы */}
                                <InteractiveStarRating
                                    currentRating={reviewRank}
                                    onRatingChange={setReviewRank}
                                    disabled={isSubmittingReview}
                                />
                                {/* Можно оставить и числовой ввод для доступности или как альтернативу */}
                                {/* <input
                                    type="number" id="reviewRank" className="auth-input rating-input"
                                    value={reviewRank} onChange={(e) => setReviewRank(parseInt(e.target.value, 10))}
                                    min="1" max="10" required disabled={isSubmittingReview}
                                /> */}
                            </div>
                            <div className="auth-input-group">
                                <label htmlFor="reviewText">Текст отзыва:</label>
                                <textarea
                                    id="reviewText" className="auth-input" rows="5"
                                    value={reviewText} onChange={(e) => setReviewText(e.target.value)}
                                    disabled={isSubmittingReview}
                                ></textarea>
                            </div>
                            {submitReviewMessage.text && (
                                <div className={`auth-message ${submitReviewMessage.type === 'error' ? 'auth-error-message' : 'auth-success-message'} visible`}>
                                    {submitReviewMessage.text}
                                </div>
                            )}
                            <div className="form-actions">
                                <button type="submit" className="auth-button" disabled={isSubmittingReview}>
                                    {isSubmittingReview ? 'Отправка...' : (userReview ? 'Обновить отзыв' : 'Отправить отзыв')}
                                </button>
                                {showReviewForm && (
                                     <button type="button" onClick={() => setShowReviewForm(false)} className="auth-button" style={{background: 'var(--color-bg-element)', border: '1px solid var(--color-border-primary)'}} disabled={isSubmittingReview}>
                                        Отмена
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                {isLoadingReviews || isLoadingUserReview ? (
                    <div className="game-page-loader">Загрузка отзывов...</div>
                ) : reviews.length > 0 ? (
                    <ul className="reviews-list">
                        {reviews.map(review => (
                            <li key={review.id} className="review-item">
                                <div className="review-item-header">
                                    <span className="review-item-user">{review.userLogin || 'Аноним'}</span>
                                    <div className="review-item-header-right">
                                        {/* Используем StarRatingDisplay для звезд в каждом отзыве */}
                                        <div className="review-item-rating-stars">
                                            <StarRatingDisplay rating={review.rank} totalStars={10} showValue={false} />
                                            <span className="rating-value-text">({review.rank}/10)</span>
                                        </div>
                                        <span className="review-item-date">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                {review.review_text && <p className="review-item-text">{review.review_text}</p>}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="no-reviews-message">Для этой игры пока нет одобренных отзывов.</p>
                )}
            </div>
        </div>
    );
}

export default GamePage;