import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom'; // Import Link
import { useAuth } from '../../contexts/authContext';
import { StarRating } from '../../components/gameCard/gameCard';
import ReviewItem from '../../components/review/reviewItem';
import ReviewForm from '../../components/review/reviewForm';
import './game.css';

const API_BASE_URL = process.env.REACT_APP_API_SERVER_URL;
const PLACEHOLDER_IMG_SRC = '/placeholder-game-cover.png';

function GamePage() {
    const { gameId } = useParams();
    const { isAuthenticated, token, user: currentUser } = useAuth();

    const [gameDetails, setGameDetails] = useState(null);
    const [isLoadingGame, setIsLoadingGame] = useState(true);
    const [error, setError] = useState('');

    const [reviews, setReviews] = useState([]);
    const [isLoadingReviews, setIsLoadingReviews] = useState(false);
    const [userReview, setUserReview] = useState(null);
    const [isLoadingUserReview, setIsLoadingUserReview] = useState(false);

    const [showReviewForm, setShowReviewForm] = useState(false);
    const [submitReviewMessage, setSubmitReviewMessage] = useState({ type: '', text: '' });
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const [coverImageSrc, setCoverImageSrc] = useState(`${API_BASE_URL}/api/img/${gameId}.png`);

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
        if (gameId) fetchGame();
    }, [gameId]);

    const fetchGameReviews = useCallback(async () => {
        setIsLoadingReviews(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/reviews/game/${gameId}`);
            if (!response.ok) throw new Error('Не удалось загрузить отзывы.');
            const data = await response.json();
            setReviews(data || []);
        } catch (err)
 {
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
            } else if (response.status === 404) {
                setUserReview(null);
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error("Failed to fetch user's review:", errorData.message || response.statusText);
            }
        } catch (err) {
            console.error("Error fetching user review:", err);
        } finally {
            setIsLoadingUserReview(false);
        }
    }, [gameId, isAuthenticated, token]);

    useEffect(() => {
        if (gameId) {
            fetchGameReviews();
            if (isAuthenticated) fetchUserReview(); else setUserReview(null);
        }
    }, [gameId, isAuthenticated, fetchGameReviews, fetchUserReview]);


    const handleToggleReviewForm = () => {
        setShowReviewForm(prev => !prev);
        setSubmitReviewMessage({ type: '', text: '' });
    };

    const handleReviewSubmit = async (rankFromForm, textFromForm) => {
        if (!isAuthenticated) {
            setSubmitReviewMessage({ type: 'error', text: 'Для отправки отзыва необходимо авторизоваться.' });
            return;
        }
        if (rankFromForm < 1 || rankFromForm > 5) {
             setSubmitReviewMessage({ type: 'error', text: 'Оценка должна быть от 1 до 5.' });
             return;
        }

        setIsSubmittingReview(true);
        setSubmitReviewMessage({ type: '', text: '' });

        const payload = {
            rank: Number(rankFromForm),
            review_text: textFromForm
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

    const handleCoverImageError = () => setCoverImageSrc(PLACEHOLDER_IMG_SRC);

    if (isLoadingGame) return <div className="game-page-loader">Загрузка информации об игре...</div>;
    if (error) return <div className="game-page-error-message">{error}</div>;
    if (!gameDetails) return <div className="game-page-error-message">Информация об игре не найдена.</div>;

    const gameDisplayRating = gameDetails.rating;
    const gameNumericRatingText = gameDisplayRating !== null && gameDisplayRating !== undefined
        ? `${parseFloat(gameDisplayRating).toFixed(1)}/5`
        : "";

    const otherReviews = reviews.filter(review => {
        if (userReview && review.id === userReview.id && !showReviewForm) {
            return false;
        }
        if (userReview && review.id === userReview.id && showReviewForm) {
            return false;
        }
        return true;
    });

    const enrichedUserReview = userReview && currentUser ? {
        ...userReview,
        userLogin: currentUser.login
    } : userReview;


    return (
        <div className="game-page-container">
            <div className="game-details-layout">
                <div className="game-cover-container">
                    <img src={coverImageSrc} alt={gameDetails.name} className="game-cover-image" onError={handleCoverImageError} />
                </div>
                <div className="game-info-container">
                    <h1>
                        {gameDetails.name}
                        {gameDetails.year && <span className="game-year">({gameDetails.year})</span>}
                    </h1>

                    <div className="game-main-rating-display">
                        {(gameDisplayRating !== null && gameDisplayRating !== undefined && gameDisplayRating > 0) ? (
                            <>
                                <StarRating rating={gameDisplayRating} maxStars={5} />
                                <span className="rating-value">{gameNumericRatingText}</span>
                            </>
                        ) : (
                            <span className="no-rating">Рейтинг отсутствует</span>
                        )}
                    </div>

                    {gameDetails.genre && (
                        <div className="game-info-item">
                            <strong>Жанр:</strong>{' '}
                            {gameDetails.genre.split(',').map(g => g.trim()).map((genreItem, index, array) => (
                                <React.Fragment key={genreItem}>
                                    <Link to={`/games?genre=${encodeURIComponent(genreItem)}`}>{genreItem}</Link>
                                    {index < array.length - 1 && ', '}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                    {gameDetails.platforms && (
                        <div className="game-info-item">
                            <strong>Платформы:</strong>{' '}
                            {gameDetails.platforms.split(',').map(p => p.trim()).map((platformItem, index, array) => (
                                <React.Fragment key={platformItem}>
                                    <Link to={`/games?platform=${encodeURIComponent(platformItem)}`}>{platformItem}</Link>
                                    {index < array.length - 1 && ', '}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                    {gameDetails.developer_name && (
                        <div className="game-info-item">
                            <strong>Разработчик:</strong>{' '}
                            <Link to={`/games?developer=${encodeURIComponent(gameDetails.developer_name)}`}>
                                {gameDetails.developer_name}
                            </Link>
                        </div>
                    )}
                    {gameDetails.publisher_name && (
                        <div className="game-info-item">
                            <strong>Издатель:</strong>{' '}
                            <Link to={`/games?publisher=${encodeURIComponent(gameDetails.publisher_name)}`}>
                                {gameDetails.publisher_name}
                            </Link>
                        </div>
                    )}

                    {gameDetails.description && (
                        <div className="game-description"><h3>Описание:</h3><p>{gameDetails.description}</p></div>
                    )}
                </div>
            </div>

            <div className="reviews-section">
                <h2>Отзывы</h2>

                {isAuthenticated && enrichedUserReview && !showReviewForm && (
                    <div className="my-review-display">
                        <h4>Ваш отзыв:</h4>
                        <ul className="reviews-list my-review-item-wrapper">
                           <ReviewItem review={enrichedUserReview} />
                        </ul>
                    </div>
                )}

                {isAuthenticated && !showReviewForm && (
                    <div className="review-action-buttons">
                        <button onClick={handleToggleReviewForm} className="auth-button">
                            {userReview ? 'Редактировать мой отзыв' : 'Написать отзыв'}
                        </button>
                    </div>
                )}

                {showReviewForm && isAuthenticated && (
                    <ReviewForm
                        initialRank={userReview ? userReview.rank : 3}
                        initialText={userReview ? userReview.review_text || '' : ''}
                        onSubmit={handleReviewSubmit}
                        onCancel={() => setShowReviewForm(false)}
                        isSubmitting={isSubmittingReview}
                        submitMessage={submitReviewMessage}
                        isEditing={!!userReview}
                    />
                )}

                {isLoadingReviews || isLoadingUserReview ? (
                    <div className="game-page-loader">Загрузка отзывов...</div>
                ) : otherReviews.length > 0 ? (
                    <ul className="reviews-list">
                        {otherReviews.map(review => (
                            <ReviewItem key={review.id} review={review} />
                        ))}
                    </ul>
                ) : (!userReview || showReviewForm) && otherReviews.length === 0 && !(isLoadingUserReview && isAuthenticated) ? (
                    <p className="no-reviews-message">Для этой игры пока нет одобренных отзывов.</p>
                ) : null }
            </div>
        </div>
    );
}

export default GamePage;