import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './gameCard.css'; // Import its own CSS

const API_BASE_URL = process.env.REACT_APP_API_SERVER_URL;
const PLACEHOLDER_IMG_SRC = '/placeholder.png';

// Экспортируем StarRating как именованный экспорт
export const StarRating = ({ rating, maxStars = 5 }) => {
    if (rating === null || rating === undefined || rating <= 0) {
        return <span className="no-rating">Нет рейтинга</span>;
    }

    // Предполагаем, что 'rating' находится в шкале от 0 до 'maxStars'.
    // Если ваш 'game.rating' приходит, например, по 10-балльной шкале,
    // а вы хотите отобразить 5 звезд, раскомментируйте и настройте следующую строку:
    // const numFullStars = Math.round(parseFloat(rating) / (10 / maxStars));
    // Например, для рейтинга из 10 и 5 звезд: Math.round(parseFloat(rating) / 2);

    // Если 'rating' уже в нужной шкале (например, 0-5 для 5 звезд):
    const numFullStars = Math.round(parseFloat(rating));

    const stars = [];
    for (let i = 0; i < maxStars; i++) {
        if (i < numFullStars) {
            stars.push(<span key={`star-full-${i}`} className="rating-star rating-star-full">★</span>);
        } else {
            stars.push(<span key={`star-empty-${i}`} className="rating-star rating-star-empty">☆</span>);
        }
    }
    return <div className="star-display">{stars}</div>;
};

const GameCard = React.memo(({ game }) => {
    const [imgSrc, setImgSrc] = useState(`${API_BASE_URL}/api/img/${game.id}.png`);

    useEffect(() => {
        setImgSrc(`${API_BASE_URL}/api/img/${game.id}.png`);
    }, [game.id]);

    const handleImageError = () => setImgSrc(PLACEHOLDER_IMG_SRC);

    return (
        <Link to={`/games/${game.id}`} className="game-card">
            <div className="game-card-image-container">
                <img src={imgSrc} alt={game.name} className="game-card-image" onError={handleImageError} />
            </div>
            <div className="game-card-info">
                <h3 className="game-card-title">{game.name}</h3>
                {game.year && <p className="game-card-year">{game.year}</p>}
                <div className="game-card-rating">
                    <StarRating rating={game.rating} />
                </div>
            </div>
        </Link>
    );
});

// GameCard остается экспортом по умолчанию
export default GameCard;