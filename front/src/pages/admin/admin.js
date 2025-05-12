import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/authContext';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
// Импортируем иконки из react-icons (примеры, можно выбрать другие)
import { FaCheck, FaTimes, FaBan } from 'react-icons/fa';
import apiHelper from '../../utils/apiHelper';
import './admin.css';

// Компонент ProtectedRoute (оставляем или импортируем)
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, isLoading, token } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Загрузка аутентификации...</div>;
  }
  if (!token || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};


const AdminPage = () => {
    const [pendingReviews, setPendingReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { user, isAdmin, authHeader, token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Эффекты и обработчики остаются такими же
    useEffect(() => {
        if (!token) {
            navigate('/login', { state: { from: location }, replace: true });
        } else if (token && !isAdmin) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAdmin, token, navigate, location]);

    const fetchPendingReviews = useCallback(async () => {
        if (!isAdmin || !token) return;
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            const data = await apiHelper('/api/reviews/', { headers: authHeader() });
            setPendingReviews(data || []);
        } catch (err) {
            setError(err.message || 'Не удалось загрузить ожидающие отзывы.');
            setPendingReviews([]);
        } finally {
            setIsLoading(false);
        }
    }, [authHeader, isAdmin, token]);

    useEffect(() => {
        if (token && isAdmin) fetchPendingReviews();
    }, [fetchPendingReviews, token, isAdmin]);

    const handleUpdateReviewStatus = async (reviewId, newStatus) => {
      // ... (логика без изменений)
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

    const handleUpdateUserStatus = async (userId, login, newStatus) => {
       // ... (логика без изменений, обрабатывает только 'blocked')
       if (newStatus !== 'blocked') return;
       setIsLoading(true);
       setError('');
       setSuccessMessage('');
       if (!window.confirm(`Вы уверены, что хотите заблокировать пользователя ${login} (ID: ${userId})?`)) {
           setIsLoading(false);
           return;
       }
       try {
           await apiHelper(`/api/users/${userId}`, {
               method: 'PUT',
               headers: { ...authHeader(), 'Content-Type': 'application/json' },
               body: JSON.stringify({ status: newStatus }),
           });
           setSuccessMessage(`Статус пользователя ${login} (ID: ${userId}) обновлен на '${newStatus}'.`);
       } catch (err) {
           setError(err.message || `Не удалось обновить статус пользователя ${userId}.`);
       } finally {
           setIsLoading(false);
       }
    };

    // --- Render Logic ---
    if (token && !isAdmin) {
        return <div className="admin-page-container content-container"><p>Доступ запрещен.</p></div>;
    }
    if (!token) {
         return <div className="admin-page-container content-container"><p>Перенаправление...</p></div>;
    }
    if (isLoading && pendingReviews.length === 0) {
         return <div className="admin-page-container content-container"><p>Загрузка отзывов...</p></div>;
    }

    return (
        <div className="admin-page-container content-container">
            <h1 className="page-main-title">Панель Администратора - Ожидающие Отзывы</h1>

            {error && <p className="admin-message admin-error-message">{error}</p>}
            {successMessage && <p className="admin-message admin-success-message">{successMessage}</p>}

            {!isLoading && pendingReviews.length === 0 && !error && (
                <p>Нет отзывов, ожидающих одобрения.</p>
            )}

            {!isLoading && pendingReviews.length > 0 && (
                <ul className="admin-review-list">
                    {pendingReviews.map(review => (
                        <li key={review.id} className="admin-review-item">
                            {/* Детали отзыва остаются без изменений */}
                            <div className="admin-review-details">
                                <p><strong>ID Отзыва:</strong> {review.id}</p>
                                <p><strong>Игра:</strong> {review.gameTitle} (ID: {review.game_id})</p>
                                <p><strong>Пользователь:</strong> {review.userLogin} (ID: {review.user_id})</p>
                                <p><strong>Оценка:</strong> {review.rank}/10</p>
                                <p><strong>Дата:</strong> {new Date(review.created_at).toLocaleString('ru-RU')}</p>
                                <p><strong>Текст:</strong></p>
                                <blockquote className="admin-review-text">{review.review_text || <i>(Текст отсутствует)</i>}</blockquote>
                            </div>

                            {/* --- ОБНОВЛЕННЫЙ БЛОК ДЕЙСТВИЙ --- */}
                            <div className="admin-actions-group">
                                <button
                                    className="admin-button admin-button-approve"
                                    onClick={() => handleUpdateReviewStatus(review.id, 'approved')}
                                    disabled={isLoading}
                                    title="Одобрить отзыв"
                                    aria-label={`Одобрить отзыв ${review.id}`}
                                >
                                    <FaCheck /> {/* Иконка одобрения */}
                                </button>
                                <button
                                    className="admin-button admin-button-reject"
                                    onClick={() => handleUpdateReviewStatus(review.id, 'rejected')}
                                    disabled={isLoading}
                                    title="Отклонить отзыв"
                                    aria-label={`Отклонить отзыв ${review.id}`}
                                >
                                    <FaTimes /> {/* Иконка отклонения */}
                                </button>
                                <button
                                    className="admin-button admin-button-block"
                                    onClick={() => handleUpdateUserStatus(review.user_id, review.userLogin, 'blocked')}
                                    disabled={isLoading}
                                    title="Заблокировать пользователя"
                                    aria-label={`Заблокировать пользователя ${review.userLogin}`}
                                >
                                    <FaBan /> {/* Иконка блокировки */}
                                </button>
                            </div>
                            {/* --- КОНЕЦ ОБНОВЛЕННОГО БЛОКА ДЕЙСТВИЙ --- */}
                        </li>
                    ))}
                </ul>
            )}

             {isLoading && pendingReviews.length > 0 && <p>Обновление...</p>}
        </div>
    );
};

export default AdminPage;