import React, { useState, useEffect } from 'react';
import './reviewForm.css'; // Импортируем CSS для компонента

// Обновляем InteractiveStarRating для использования Unicode символов
const InteractiveStarRating = ({ currentRating, onRatingChange, totalStars = 5, disabled = false }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
        <div className={`review-form-stars interactive-unicode-stars ${disabled ? 'disabled' : ''}`}>
            {[...Array(totalStars)].map((_, index) => {
                const starValue = index + 1;
                let starCharacter = '☆'; // Пустая звезда по умолчанию (Unicode)

                if ((hoverRating || currentRating) >= starValue) {
                    starCharacter = '★'; // Заполненная звезда (Unicode)
                }
                // Класс selected для стилизации заполненной звезды
                const starClasses = ['unicode-star'];
                if (starCharacter === '★') {
                    starClasses.push('selected');
                }
                if (hoverRating && starValue <= hoverRating && starCharacter === '★') {
                    starClasses.push('hover-selected'); // Для дополнительной стилизации ховера, если нужно
                }


                return (
                    <span // Меняем <i> на <span> для текстовых символов
                        key={starValue}
                        className={starClasses.join(' ')}
                        onClick={() => !disabled && onRatingChange(starValue)}
                        onMouseEnter={() => !disabled && setHoverRating(starValue)}
                        onMouseLeave={() => !disabled && setHoverRating(0)}
                        role="button" // Для доступности
                        tabIndex={disabled ? -1 : 0} // Для доступности
                        onKeyDown={(e) => { // Для доступности (выбор по Enter/Space)
                            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                onRatingChange(starValue);
                            }
                        }}
                        aria-label={`Оценить ${starValue} из ${totalStars} звезд`}
                    >
                        {starCharacter}
                    </span>
                );
            })}
        </div>
    );
};


const ReviewForm = ({
    initialRank = 3,
    initialText = '',
    onSubmit,
    onCancel,
    isSubmitting,
    submitMessage,
    isEditing,
}) => {
    const [rank, setRank] = useState(initialRank);
    const [text, setText] = useState(initialText);

    useEffect(() => {
        setRank(initialRank);
        setText(initialText);
    }, [initialRank, initialText]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rank < 1 || rank > 5) {
            console.error("Оценка должна быть от 1 до 5.");
            return;
        }
        onSubmit(rank, text);
    };

    return (
        <div className="review-form-container auth-form-wrapper">
            <h3>{isEditing ? 'Редактировать ваш отзыв' : 'Оставить отзыв'}</h3>
            <form onSubmit={handleSubmit}>
                <div className="auth-input-group">
                    <label htmlFor="reviewRank">Оценка (1-5):</label>
                    <InteractiveStarRating
                        currentRating={rank}
                        onRatingChange={setRank}
                        totalStars={5}
                        disabled={isSubmitting}
                    />
                </div>
                <div className="auth-input-group">
                    <label htmlFor="reviewText">Текст отзыва:</label>
                    <textarea
                        id="reviewText" className="auth-input" rows="5"
                        value={text} onChange={(e) => setText(e.target.value)}
                        disabled={isSubmitting}
                    ></textarea>
                </div>
                {submitMessage && submitMessage.text && (
                    <div className={`auth-message ${submitMessage.type === 'error' ? 'auth-error-message' : 'auth-success-message'} visible`}>
                        {submitMessage.text}
                    </div>
                )}
                <div className="form-actions">
                    <button type="submit" className="auth-button" disabled={isSubmitting}>
                        {isSubmitting ? 'Отправка...' : (isEditing ? 'Обновить отзыв' : 'Отправить отзыв')}
                    </button>
                    <button type="button" onClick={onCancel} className="auth-button" style={{background: 'var(--color-bg-element)', border: '1px solid var(--color-border-primary)'}} disabled={isSubmitting}>
                        Отмена
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReviewForm;