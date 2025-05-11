// src/router/index.js (или AppRouter.js)
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './protectedRoute';
import PublicRoute from './publicRoute';

// --- Импорт компонентов страниц ---
import LoginPage from '../pages/login/login';
import RegisterPage from '../pages/join/join';
import GamePage from '../pages/game/game'; // <-- Путь к вашей GamePage, убедитесь, что он верный
import SearchPage from '../pages/search/search';
import HomePage from '../pages/home/home';
import NotFoundPage from '../pages/error/404';
// Placeholder компоненты для других страниц (замените на ваши реальные компоненты)
const ProfilePage = () => <div>Страница профиля пользователя</div>;
const DashboardPage = () => <div>Панель пользователя (защищено)</div>;
const AdminPanelPage = () => <div>Панель администратора (защищено, только админ)</div>;
const UnauthorizedPage = () => <div>Доступ запрещен (403)</div>;


const AppRouter = () => {
    return (
        <Routes>
            {/* --- Полностью публичные маршруты --- */}
            <Route path="/" element={<HomePage />} /> {/* Или <GamesListPage /> если это ваша главная */}
            <Route path="/games/:gameId" element={<GamePage />} /> {/* <--- ДОБАВЛЕН МАРШРУТ ДЛЯ СТРАНИЦЫ ИГРЫ */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/games" element={<SearchPage/>}/>


            {/* --- "Публичные-ограниченные" маршруты (логин, регистрация) --- */}
            {/* Эти маршруты доступны только неаутентифицированным пользователям. */}
            {/* Если пользователь аутентифицирован, его перенаправит на redirectTo. */}
            <Route element={<PublicRoute restricted redirectTo="/profile" />}> {/* или redirectTo="/dashboard" */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/join" element={<RegisterPage />} />
            </Route>

            {/* --- Защищенные маршруты (требуют аутентификации) --- */}
            {/* Доступны только аутентифицированным пользователям. */}
            <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                {/* Другие маршруты, требующие только аутентификации, можно добавить сюда */}
            </Route>

            {/* --- Защищенные маршруты для администраторов --- */}
            {/* Доступны только аутентифицированным пользователям с ролью 'admin'. */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminPanelPage />} />
                {/* Другие маршруты только для админа */}
            </Route>

            {/* --- Маршрут "Не найдено" (404) --- */}
            {/* Этот маршрут должен быть последним */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default AppRouter;