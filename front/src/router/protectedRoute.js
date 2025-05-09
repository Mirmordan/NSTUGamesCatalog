// src/router/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';

const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div>Проверка авторизации...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        const hasRequiredRole = user && user.role && allowedRoles.includes(user.role);
        if (!hasRequiredRole) {
            console.warn(`User ${user?.id} (role: ${user?.role}) attempted to access a restricted route. Required roles: ${allowedRoles.join(', ')}.`);
            return <Navigate to="/unauthorized" state={{ from: location }} replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;