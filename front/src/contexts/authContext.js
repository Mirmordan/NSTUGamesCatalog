// contexts/authContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';


const API_BASE_URL_FROM_ENV = process.env.REACT_APP_API_SERVER_URL; // Используем имя, которое вы указали

// Для разработчика: Логируем "сырое" значение переменной окружения
console.log('[AuthContext] Raw REACT_APP_API_SERVER_URL from env:', API_BASE_URL_FROM_ENV);

if (!API_BASE_URL_FROM_ENV && process.env.NODE_ENV !== 'test') {
    console.warn(
        "[AuthContext] КРИТИЧЕСКАЯ ОШИБКА: Переменная окружения REACT_APP_API_SERVER_URL не установлена или не доступна для фронтенда. " +
        "API-запросы НЕ СМОГУТ быть выполнены правильно. " +
        "Проверьте ваш .env файл и префикс переменной (например, REACT_APP_ для CRA, VITE_ для Vite)."
    );
}

const decodeToken = (token) => {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
        );
        const parsed = JSON.parse(jsonPayload);
        return { id: parsed.id, role: parsed.role, exp: parsed.exp };
    } catch (error) {
        console.error("[AuthContext] Failed to decode token:", error);
        return null;
    }
};

const authContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUserFromToken = useCallback((currentToken) => {
        if (currentToken) {
            const decodedUser = decodeToken(currentToken);
            if (decodedUser) {
                if (decodedUser.exp && decodedUser.exp * 1000 < Date.now()) {
                    console.log("[AuthContext] Token expired, logging out.");
                    localStorage.removeItem('authToken');
                    setToken(null);
                    setUser(null);
                    return false;
                }
                setUser({ id: decodedUser.id, role: decodedUser.role });
                setToken(currentToken);
                return true;
            }
        }
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        return false;
    }, []);

    useEffect(() => {
        setLoading(true);
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) { // Загружаем пользователя, только если токен есть
            loadUserFromToken(storedToken);
        }
        setLoading(false);
    }, [loadUserFromToken]);

    const login = async (loginCredentials) => {
        if (!API_BASE_URL_FROM_ENV) {
            const errorMsg = "[AuthContext] REACT_APP_API_SERVER_URL не определена. API-запросы не могут быть выполнены. Проверьте конфигурацию .env и префиксы (REACT_APP_ или VITE_).";
            console.error(errorMsg);
            return { success: false, error: "Ошибка конфигурации клиента: не удалось определить адрес сервера." };
        }

        // API_BASE_URL_FROM_ENV должен быть вида "http://localhost:5000" (БЕЗ слеша в конце, БЕЗ /api)
        const loginUrl = `${API_BASE_URL_FROM_ENV}/api/auth/login`;

        console.log('[AuthContext] Попытка входа по URL:', loginUrl);
        console.log('[AuthContext] Данные для входа:', loginCredentials);

        try {
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginCredentials),
            });

            console.log('[AuthContext] Статус ответа при входе:', response.status);

            if (!response.ok) {
                let errorMsgContent = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    console.log('[AuthContext] Данные ошибки от сервера (login):', errorData);
                    errorMsgContent = errorData.message || (response.status === 401 ? 'Неверный логин или пароль, или пользователь заблокирован.' : `Ошибка сервера: ${response.status}`);
                } catch (jsonError) {
                    console.warn("[AuthContext] Не удалось распарсить JSON ответа ошибки (login):", jsonError);
                    let responseText = "";
                    try {
                        responseText = await response.text(); // Попытка получить "сырой" текст ответа
                        console.warn("[AuthContext] \"Сырой\" текст ответа ошибки (login):", responseText);
                    } catch (textError) {
                        console.warn("[AuthContext] Не удалось получить \"сырой\" текст ответа ошибки (login):", textError);
                    }
                    errorMsgContent = response.status === 401 ? 'Неверный логин или пароль, или пользователь заблокирован.' : `Ошибка ответа сервера: ${response.status}. Ответ: ${responseText.substring(0,100)}`;
                }
                const err = new Error(errorMsgContent);
                err.isApiError = true;
                err.status = response.status;
                throw err;
            }

            const data = await response.json();
            console.log('[AuthContext] Успешные данные от сервера (login):', data);

            if (data.token) {
                localStorage.setItem('authToken', data.token);
                const decoded = decodeToken(data.token);
                loadUserFromToken(data.token); // Это установит token и user внутри
                return { success: true, user: decoded };
            } else {
                throw new Error('Не удалось войти: токен не получен от сервера.');
            }
        } catch (error) {
            console.error("[AuthContext] Ошибка входа в блоке try-catch:", error);
            let errorMessage;

            if (error.isApiError) {
                errorMessage = error.message;
            } else if (error.name === 'TypeError' && error.message.toLowerCase().includes('failed to fetch')) {
                errorMessage = `Не удалось подключиться к серверу по адресу ${loginUrl}. Проверьте, что сервер запущен и доступен, и нет проблем с CORS или сетевым подключением.`;
            } else {
                errorMessage = error.message || 'Произошла непредвиденная ошибка при попытке входа.';
            }

            localStorage.removeItem('authToken');
            setToken(null);
            setUser(null);
            return { success: false, error: errorMessage };
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        console.log("[AuthContext] Пользователь вышел из системы.");
    };

    const authHeader = () => {
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    const value = {
        token,
        user,
        login,
        logout,
        isAuthenticated: !!user && !!token,
        isLoading: loading,
        authHeader,
        isAdmin: user?.role === 'admin',
    };

    return (
        <authContext.Provider value={value}>
            {!loading && children}
        </authContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(authContext);
    if (context === undefined || context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};