import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/authContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCheck, FaTimes, FaBan } from 'react-icons/fa';
import './admin.css';

const API_BASE_URL = process.env.REACT_APP_API_SERVER_URL;

if (!API_BASE_URL && process.env.NODE_ENV !== 'test') {
    console.error("CRITICAL ERROR: REACT_APP_API_SERVER_URL is not defined in the environment. API calls will fail.");
}

const apiHelper = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders = {
        'Accept': 'application/json',
    };

    if (options.body && typeof options.body === 'string' && !options.headers?.['Content-Type']) {
       defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            let errorData = { message: `HTTP error! Status: ${response.status}` };
            try {
                const body = await response.json();
                errorData = body || errorData;
            } catch (e) {
                //
            }
            const error = new Error(errorData.message || `Request failed with status ${response.status}`);
            error.status = response.status;
            error.data = errorData;
            throw error;
        }

        if (response.status === 204) {
            return null;
        }

        const data = await response.json();
        return data;

    } catch (error) {
        if (!error.status) {
             const networkError = new Error(error.message || 'Network error or failed to fetch');
             networkError.isNetworkError = true;
             throw networkError;
        } else {
             throw error;
        }
    }
};




const AdminPage = () => {
    const [pendingReviews, setPendingReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { isAdmin, authHeader, token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isLoading) return;

        if (!token) {
            navigate('/login', { state: { from: location }, replace: true });
        } else if (token && !isAdmin) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAdmin, token, navigate, location, isLoading]);

    const fetchPendingReviews = useCallback(async () => {
        if (!isAdmin || !token) return;
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const data = await apiHelper('/api/reviews?status=pending', { headers: authHeader() });
            setPendingReviews(data || []);
        } catch (err) {
            setError(err.message || 'Не удалось загрузить ожидающие отзывы.');
            setPendingReviews([]);
        } finally {
            setIsLoading(false);
        }
    }, [authHeader, isAdmin, token]);

    useEffect(() => {
        if (token && isAdmin) {
            fetchPendingReviews();
        }
    }, [fetchPendingReviews, token, isAdmin]);


    const handleUpdateReviewStatus = async (reviewId, newStatus) => {
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            await apiHelper(`/api/reviews/${reviewId}/status`, {
                method: 'PUT',
                headers: { ...authHeader(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            setSuccessMessage(`Статус отзыва ${reviewId} обновлен на '${newStatus}'.`);
            setPendingReviews(prev => prev.filter(review => review.id !== reviewId));
        } catch (err) {
            setError(err.message || `Не удалось обновить статус отзыва ${reviewId}.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateUserStatus = async (reviewId, userId, login, newStatus) => {
       if (newStatus !== 'blocked') return;

       setIsLoading(true);
       setError('');
       setSuccessMessage('');

       try {
           await apiHelper(`/api/users/${userId}`, {
               method: 'PUT',
               headers: { ...authHeader(), 'Content-Type': 'application/json' },
               body: JSON.stringify({ status: newStatus }),
           });
           setSuccessMessage(`Пользователь ${login} (ID: ${userId}) заблокирован.`);
           setPendingReviews(prev => prev.filter(review => review.id !== reviewId));
       } catch (err) {
           setError(err.message || `Не удалось заблокировать пользователя ${userId}.`);
       } finally {
           setIsLoading(false);
       }
    };

    if (isLoading && !token) {
        return <div className="admin-page-container content-container"><p>Проверка авторизации...</p></div>;
    }
    if (token && !isAdmin) {
        return <div className="admin-page-container content-container"><p>Доступ запрещен. Перенаправление...</p></div>;
    }
     if (!token) {
         return <div className="admin-page-container content-container"><p>Требуется вход. Перенаправление...</p></div>;
    }
     if (isLoading && pendingReviews.length === 0 && !error) {
         return <div className="admin-page-container content-container"><p>Загрузка отзывов...</p></div>;
     }


    return (
        <div className="admin-page-container content-container">
            <h1 className="page-main-title">Панель Администратора - Ожидающие Отзывы</h1>

            {error && <p className="admin-message admin-error-message">{error}</p>}
            {successMessage && <p className="admin-message admin-success-message">{successMessage}</p>}

            {isLoading && pendingReviews.length > 0 && <p>Обновление...</p>}

            {!isLoading && pendingReviews.length === 0 && !error && (
                <p>Нет отзывов, ожидающих одобрения.</p>
            )}

            {!isLoading && pendingReviews.length > 0 && (
                <ul className="admin-review-list">
                    {pendingReviews.map(review => (
                        <li key={review.id} className="admin-review-item">
                            <div className="admin-review-details">
                                <p><strong>ID Отзыва:</strong> {review.id}</p>
                                <p><strong>Игра:</strong> {review.gameTitle} (ID: {review.game_id})</p>
                                <p><strong>Пользователь:</strong> {review.userLogin} (ID: {review.user_id})</p>
                                <p><strong>Оценка:</strong> {review.rank}/5</p>
                                <p><strong>Дата:</strong> {new Date(review.created_at).toLocaleString('ru-RU')}</p>
                                <p><strong>Текст:</strong></p>
                                <blockquote className="admin-review-text">{review.review_text || <i>(Текст отсутствует)</i>}</blockquote>
                            </div>

                            <div className="admin-actions-group">
                                <button
                                    className="admin-button admin-button-approve"
                                    onClick={() => handleUpdateReviewStatus(review.id, 'approved')}
                                    disabled={isLoading}
                                    title="Одобрить отзыв"
                                    aria-label={`Одобрить отзыв ${review.id}`}
                                >
                                    <FaCheck />
                                </button>
                                <button
                                    className="admin-button admin-button-reject"
                                    onClick={() => handleUpdateReviewStatus(review.id, 'rejected')}
                                    disabled={isLoading}
                                    title="Отклонить отзыв"
                                    aria-label={`Отклонить отзыв ${review.id}`}
                                >
                                    <FaTimes />
                                </button>
                                <button
                                    className="admin-button admin-button-block"
                                    onClick={() => handleUpdateUserStatus(review.id, review.user_id, review.userLogin, 'blocked')}
                                    disabled={isLoading}
                                    title="Заблокировать пользователя"
                                    aria-label={`Заблокировать пользователя ${review.userLogin}`}
                                >
                                    <FaBan />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AdminPage;