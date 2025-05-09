// src/router/PublicRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';

const PublicRoute = ({ restricted = false, redirectTo = "/" }) => { // redirectTo по умолчанию на главную
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div>Проверка авторизации...</div>;
    }

    if (restricted && isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    return <Outlet />;
};

export default PublicRoute;