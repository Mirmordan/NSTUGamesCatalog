// src/pages/ProfilePage.js
import React from 'react';
import { useAuth } from '../context/authContext'; // Путь к вашему контексту
import UserProfileCard from '../components/UserProfileCard'; // Путь к вашей карточке
import './ProfilePage.css'; // Подключаем стили

function ProfilePage() {
    const { user, isLoading, isAuthenticated } = useAuth(); // Получаем данные из контекста

    // Показываем заглушку во время загрузки
    if (isLoading) {
        return <div className="profile-loading">Загрузка профиля...</div>;
    }

    // Если после загрузки пользователь не аутентифицирован или нет данных
    // (ProtectedRoute должен был предотвратить это, но лучше перестраховаться)
    if (!isAuthenticated || !user) {
        return <div className="profile-error">Не удалось загрузить данные профиля. Попробуйте войти снова.</div>;
    }

    // --- Подготовка данных для UserProfileCard ---
    // Адаптируем данные из контекста (user: { id, login, status, role })
    // к тому, что ожидает ваша карточка (username, fullName и т.д.)
    // ЗАМЕТКА: В вашем контексте НЕТ fullName, avatarUrl, joinedDate, bio, stats.
    // Карточку нужно будет УПРОСТИТЬ или эти данные нужно получать ОТДЕЛЬНЫМ запросом.
    // Пока передадим то, что есть.

    const cardData = {
        username: user.login, // Это поле у нас есть!
        id: user.id,          // ID тоже есть
        status: user.status,  // Статус есть
        role: user.role,      // Роль есть

        // --- Поля, которых НЕТ в user из authContext (нужны заглушки или доп. запрос) ---
        avatarUrl: 'https://via.placeholder.com/100/777/fff?text=?', // Заглушка
        fullName: null, // Или user.login, если имя = логин
        joinedDate: 'Неизвестно',
        bio: 'Информация не загружена.',
        stats: { posts: '?', followers: '?', following: '?' },
    };

    return (
        <div className="profile-page-container">
            <h2>Ваш Профиль</h2>
            {/* Передаем подготовленные данные в карточку */}
            <UserProfileCard userData={cardData} />
        </div>
    );
}

export default ProfilePage;