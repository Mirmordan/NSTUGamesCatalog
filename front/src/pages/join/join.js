// src/pages/join/join.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './join.css';

const MESSAGE_VISIBLE_DURATION_MS = 3000;
const ANIMATION_DURATION_MS = 300;

const API_BASE_URL = process.env.REACT_APP_API_SERVER_URL;

if (!API_BASE_URL && process.env.NODE_ENV !== 'test') {
    console.warn(
        "Переменная окружения REACT_APP_API_SERVER_URL не установлена. " +
        "API-запросы могут работать некорректно или использовать относительные пути."
    );
}

const RegisterPage = () => {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isMessageVisible, setIsMessageVisible] = useState(false);
    const messageTimerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (messageTimerRef.current) {
                clearTimeout(messageTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (message.text) {
            setIsMessageVisible(true);

            if (messageTimerRef.current) {
                clearTimeout(messageTimerRef.current);
            }

            messageTimerRef.current = setTimeout(() => {
                setIsMessageVisible(false);
                setTimeout(() => {
                    setMessage({ text: '', type: '' });
                }, ANIMATION_DURATION_MS);
            }, MESSAGE_VISIBLE_DURATION_MS);
        } else {
            setIsMessageVisible(false);
        }
    }, [message]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (messageTimerRef.current) {
            clearTimeout(messageTimerRef.current);
        }
        setMessage({ text: '', type: '' });
        setIsMessageVisible(false);

        setIsLoading(true);

        if (!loginInput || !password || !confirmPassword) {
            setMessage({ text: 'Все поля обязательны для заполнения.', type: 'error' });
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setMessage({ text: 'Пароли не совпадают.', type: 'error' });
            setIsLoading(false);
            return;
        }
        
        if (password.length < 6) {
            setMessage({ text: 'Пароль должен содержать не менее 6 символов.', type: 'error' });
            setIsLoading(false);
            return;
        }

        const registerUrl = API_BASE_URL ? `${API_BASE_URL}/api/auth/register` : '/api/auth/register';

        try {
            const response = await fetch(registerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ login: loginInput, password }),
            });

            const responseData = await response.json();

            if (response.status === 201) {
                setMessage({ text: responseData.message || 'Регистрация прошла успешно! Теперь вы можете войти.', type: 'success' });
                setLoginInput('');
                setPassword('');
                setConfirmPassword('');
            } else {
                let errorMessage = 'Ошибка регистрации.';
                if (responseData && responseData.message) {
                    errorMessage = responseData.message;
                } else if (response.status === 400) {
                    errorMessage = 'Неверные данные. Логин и пароль обязательны.';
                } else if (response.status === 409) {
                    errorMessage = 'Пользователь с таким логином уже существует.';
                } else if (response.status === 500) {
                    errorMessage = 'Внутренняя ошибка сервера при регистрации.';
                }
                setMessage({ text: errorMessage, type: 'error' });
            }
        } catch (err) {
            console.error("Registration page submit error:", err);
            let finalErrorMessage = 'Не удалось подключиться к серверу. Проверьте ваше интернет-соединение.';
            if (err.name !== 'TypeError' || !err.message.toLowerCase().includes('failed to fetch')) {
                finalErrorMessage = 'Произошла ошибка при регистрации.';
            }
            setMessage({ text: finalErrorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-form-wrapper">
                <h1>Регистрация</h1>

                <div className="auth-message-placeholder">
                    <p
                        className={`
                            auth-message
                            ${message.type === 'error' ? 'auth-error-message' : ''}
                            ${message.type === 'success' ? 'auth-success-message' : ''}
                            ${isMessageVisible ? 'visible' : ''}
                        `}
                    >
                        {message.text || ''}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="auth-input-group">
                        <label htmlFor="login">Логин</label>
                        <input
                            type="text"
                            id="login"
                            className="auth-input"
                            value={loginInput}
                            onChange={(e) => setLoginInput(e.target.value)}
                            placeholder="Придумайте логин"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="auth-input-group">
                        <label htmlFor="password">Пароль</label>
                        <input
                            type="password"
                            id="password"
                            className="auth-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Придумайте пароль (мин. 6 символов)"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="auth-input-group">
                        <label htmlFor="confirmPassword">Подтвердите пароль</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="auth-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Повторите пароль"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                </form>
                <p className="auth-prompt">
                    Уже есть аккаунт? <Link to="/login" className={isLoading ? 'disabled-link' : ''}>Войти</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;