// src/router/index.js (или AppRouter.js)
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './protectedRoute';
import PublicRoute from './publicRoute';

// --- Импорт компонентов страниц ---
import LoginPage from '../pages/login/login'; // <--- ИМПОРТИРУЕМ СТРАНИЦУ ЛОГИНА
import RegisterPage from '../pages/join/join'; // <--- ИМПОРТИРУЕМ СТРАНИЦУ ЛОГИНА

// Placeholder компоненты для других страниц (замените на ваши реальные компоненты)
const HomePage = () => <div>Главная страница</div>;
const ProfilePage = () => <div>Страница профиля пользователя</div>;
const DashboardPage = () => <div>Панель пользователя (защищено)</div>;
const AdminPanelPage = () => <div>Панель администратора (защищено, только админ)</div>;
const UnauthorizedPage = () => <div>Доступ запрещен (403)</div>;
const NotFoundPage = () => <div>Страница не найдена (404)</div>;


const AppRouter = () => {
    return (
        <Routes>
            {/* --- Полностью публичные маршруты --- */}
            <Route path="/" element={<HomePage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            {/* <Route path="/game/:id" element={<GameDetailsPage />} /> */}


            {/* --- "Публичные-ограниченные" маршруты (логин, регистрация) --- */}
            <Route element={<PublicRoute restricted redirectTo="/dashboard" />}> {/* или redirectTo="/profile" */}
                <Route path="/login" element={<LoginPage />} /> {/* <--- ИСПОЛЬЗУЕМ LoginPage ЗДЕСЬ */}
                <Route path="/join" element={<RegisterPage />} />
            </Route>

            {/* --- Защищенные маршруты (требуют аутентификации) --- */}
            <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
            </Route>

            {/* --- Защищенные маршруты для администраторов --- */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminPanelPage />} />
            </Route>

            {/* --- Маршрут "Не найдено" (404) --- */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default AppRouter;