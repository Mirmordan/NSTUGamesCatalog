// src/pages/LoginPage.js (или где у вас форма входа)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Убедитесь, что путь верный
import { useNavigate, useLocation } from 'react-router-dom';

function LoginPage() {
    // --- Состояние для полей формы ---
    // !!! ВАЖНО: Используйте 'loginInput' (или как у вас называется поле)
    // вместо 'email', так как бэкенд ожидает 'login'
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');

    // --- Получаем данные из контекста и хуки навигации ---
    const { login, authError, isLoading, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // --- Определяем, куда перенаправить после успешного входа ---
    // Пытаемся взять путь из state.from (куда перенаправил ProtectedRoute)
    // Если его нет (зашли напрямую на /login), то по умолчанию идем в /profile
    const fromPath = location.state?.from?.pathname || "/profile";

    // --- Если пользователь уже авторизован, не показываем страницу входа ---
    useEffect(() => {
        if (isAuthenticated) {
            console.log('Пользователь уже авторизован, перенаправление с /login на', fromPath);
            navigate(fromPath, { replace: true });
        }
    }, [isAuthenticated, navigate, fromPath]);

    // --- Обработчик отправки формы ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!loginInput || !password) {
            // Можно добавить локальную валидацию здесь, но контекст тоже проверяет
            console.warn('Логин или пароль не введены');
            return;
        }

        // Вызываем функцию login из контекста, передавая объект { login, password }
        const result = await login({ login: loginInput, password: password });

        // Если вход успешен (функция login вернула { success: true })
        if (result.success) {
            console.log('Успешный вход! Перенаправление на:', fromPath);
            // Выполняем перенаправление
            navigate(fromPath, { replace: true }); // replace: true убирает /login из истории
        }
        // Если была ошибка, она будет в authError и отобразится ниже
    };

    // Не рендерим форму, если пользователь УЖЕ авторизован (пока идет редирект из useEffect)
    if (isAuthenticated) {
        return <div>Перенаправление...</div>;
    }

    return (
        <div>
            <h2>Вход</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    {/* !!! ИСПОЛЬЗУЙТЕ id="login" и name="login" если нужно */}
                    <label htmlFor="loginInput">Логин:</label>
                    <input
                        type="text" // Используйте text, email не подходит для поля 'login'
                        id="loginInput"
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        required
                        autoComplete="username" // Помогает браузеру
                    />
                </div>
                <div>
                    <label htmlFor="password">Пароль:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password" // Помогает браузеру
                    />
                </div>
                {/* Отображаем ошибку, если она есть */}
                {authError && <p style={{ color: 'red' }}>{authError}</p>}
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Вход...' : 'Войти'}
                </button>
            </form>
            {/* Можно добавить ссылку на регистрацию */}
            {/* <p>Нет аккаунта? <Link to="/join">Зарегистрироваться</Link></p> */}
        </div>
    );
}

export default LoginPage;