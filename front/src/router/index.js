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
import AdminPage from '../pages/admin/admin';
// Placeholder компоненты для других страниц (замените на ваши реальные компоненты)

const UnauthorizedPage = () => <div>Доступ запрещен (403)</div>;


const AppRouter = () => {
    return (
        <Routes>
            {/* --- Полностью публичные маршруты --- */}
            <Route path="/" element={<HomePage />} /> 
            <Route path="/games/:gameId" element={<GamePage />} /> 
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="/games" element={<SearchPage/>}/>

            {/* --- Публично доступные маршруты --- */}
            <Route element={<PublicRoute restricted redirectTo="/" />}> 
                <Route path="/login" element={<LoginPage />} />
                <Route path="/join" element={<RegisterPage />} />
            </Route>

            {/* --- Админ маршрут --- */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};

export default AppRouter;