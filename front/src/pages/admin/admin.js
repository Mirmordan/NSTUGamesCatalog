import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/authContext';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
// Импортируем иконки из react-icons (примеры, можно выбрать другие)
import { FaCheck, FaTimes, FaBan } from 'react-icons/fa';
import apiHelper from '../../utils/apiHelper';
import './admin.css';

// Компонент ProtectedRoute (оставляем или импортируем, если он не в отдельном файле)
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

    // Effect to redirect if not admin or not logged in
    useEffect(() => {
        if (isLoading) return; // Wait for auth check to complete

        if (!token) {
            navigate('/login', { state: { from: location }, replace: true });
        } else if (token && !isAdmin) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAdmin, token, navigate, location, isLoading]); // Added isLoading dependency

    const fetchPendingReviews = useCallback(async () => {
        if (!isAdmin || !token) return;
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        try {
            // Assuming the API endpoint returns only 'pending' reviews or all reviews
            // If it returns all, filtering might be needed here or preferably on the backend
            const data = await apiHelper('/api/reviews?status=pending', { headers: authHeader() });
            setPendingReviews(data || []);
        } catch (err) {
            setError(err.message || 'Не удалось загрузить ожидающие отзывы.');
            setPendingReviews([]);
        } finally {
            setIsLoading(false);
        }
    }, [authHeader, isAdmin, token]); // Dependencies for fetchPendingReviews

    // Effect to fetch reviews when component mounts or dependencies change
    useEffect(() => {
        if (token && isAdmin) {
            fetchPendingReviews();
        }
    }, [fetchPendingReviews, token, isAdmin]); // Dependencies for initial fetch


    const handleUpdateReviewStatus = async (reviewId, newStatus) => {
        // No changes needed here, logic remains the same
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
            // Remove the review from the list after successful update
            setPendingReviews(prev => prev.filter(review => review.id !== reviewId));
        } catch (err) {
            setError(err.message || `Не удалось обновить статус отзыва ${reviewId}.`);
        } finally {
            setIsLoading(false);
        }
    };

    // MODIFIED: Added reviewId parameter and removed window.confirm
    const handleUpdateUserStatus = async (reviewId, userId, login, newStatus) => {
       if (newStatus !== 'blocked') return; // Only handle 'blocked' status here

       setIsLoading(true);
       setError('');
       setSuccessMessage('');

       // REMOVED: Confirmation dialog
       // if (!window.confirm(`Вы уверены, что хотите заблокировать пользователя ${login} (ID: ${userId})?`)) {
       //     setIsLoading(false);
       //     return;
       // }

       try {
           await apiHelper(`/api/users/${userId}`, {
               method: 'PUT',
               headers: { ...authHeader(), 'Content-Type': 'application/json' },
               body: JSON.stringify({ status: newStatus }), // Send 'blocked' status
           });
           setSuccessMessage(`Пользователь ${login} (ID: ${userId}) заблокирован.`);
           // ADDED: Remove the associated review from the list after successful user block
           setPendingReviews(prev => prev.filter(review => review.id !== reviewId));
       } catch (err) {
           setError(err.message || `Не удалось заблокировать пользователя ${userId}.`);
           // Keep the review in the list if blocking fails
       } finally {
           setIsLoading(false);
       }
    };

    // --- Render Logic ---
    // Handle loading and auth states before rendering main content
    if (isLoading && !token) {
        // Still checking auth or redirecting
        return <div className="admin-page-container content-container"><p>Проверка авторизации...</p></div>;
    }
    if (token && !isAdmin) {
        // Redirect handled by useEffect, show message briefly
        return <div className="admin-page-container content-container"><p>Доступ запрещен. Перенаправление...</p></div>;
    }
     if (!token) {
         // Redirect handled by useEffect, show message briefly
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

            {/* Message when list is loading but already has items (e.g., during update) */}
            {isLoading && pendingReviews.length > 0 && <p>Обновление...</p>}

            {!isLoading && pendingReviews.length === 0 && !error && (
                <p>Нет отзывов, ожидающих одобрения.</p>
            )}

            {/* Render list only if not loading and reviews exist */}
            {!isLoading && pendingReviews.length > 0 && (
                <ul className="admin-review-list">
                    {pendingReviews.map(review => (
                        <li key={review.id} className="admin-review-item">
                            {/* Review details (no changes) */}
                            <div className="admin-review-details">
                                <p><strong>ID Отзыва:</strong> {review.id}</p>
                                <p><strong>Игра:</strong> {review.gameTitle} (ID: {review.game_id})</p>
                                <p><strong>Пользователь:</strong> {review.userLogin} (ID: {review.user_id})</p>
                                <p><strong>Оценка:</strong> {review.rank}/10</p>
                                <p><strong>Дата:</strong> {new Date(review.created_at).toLocaleString('ru-RU')}</p>
                                <p><strong>Текст:</strong></p>
                                <blockquote className="admin-review-text">{review.review_text || <i>(Текст отсутствует)</i>}</blockquote>
                            </div>

                            {/* Action buttons group */}
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
                                    // MODIFIED: Pass review.id to the handler
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

// Export ProtectedRoute if it's defined here, otherwise just AdminPage
// export { ProtectedRoute }; // Uncomment if ProtectedRoute is defined here and used elsewhere
export default AdminPage;