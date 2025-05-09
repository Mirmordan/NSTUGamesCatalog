import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext';
import '../../styles/forms.css';

const MESSAGE_VISIBLE_DURATION_MS = 2000; // 2 секунды на видимость сообщения
const ANIMATION_DURATION_MS = 300; // Длительность CSS анимации opacity

const LoginPage = () => {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login: authLogin, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/dashboard";

    // Единое состояние для сообщения (текст и тип)
    const [message, setMessage] = useState({ text: '', type: '' }); // type: 'error' | 'success'
    const [isMessageVisible, setIsMessageVisible] = useState(false);

    const messageTimerRef = useRef(null);

    // Очистка таймера при размонтировании
    useEffect(() => {
        return () => {
            if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
        };
    }, []);

    // Эффект для управления видимостью сообщения
    useEffect(() => {
        if (message.text) {
            setIsMessageVisible(true); // Показываем (запускаем анимацию появления)

            // Если уже есть таймер, очищаем его
            if (messageTimerRef.current) {
                clearTimeout(messageTimerRef.current);
            }

            // Таймер на скрытие сообщения
            messageTimerRef.current = setTimeout(() => {
                setIsMessageVisible(false); // Скрываем (запускаем анимацию исчезновения)
                // Даем время на анимацию исчезновения перед очисткой текста
                // и редиректом (для success)
                setTimeout(() => {
                    if (message.type === 'success') {
                        navigate(from, { replace: true });
                    }
                    setMessage({ text: '', type: '' }); // Очищаем сообщение после анимации
                }, ANIMATION_DURATION_MS);
            }, MESSAGE_VISIBLE_DURATION_MS);
        } else {
            // Если текст сообщения пуст, убеждаемся, что оно скрыто
            setIsMessageVisible(false);
        }
    }, [message, navigate, from]);


    useEffect(() => {
        // Редирект, если аутентифицирован и нет активного сообщения об успехе
        if (isAuthenticated && message.type !== 'success') {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from, message.type]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Перед новым запросом - очищаем предыдущее сообщение немедленно, если нужно
        if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
        setMessage({ text: '', type: '' }); // Это скроет сообщение без анимации, если оно было
        setIsMessageVisible(false);         // Убедимся, что оно скрыто

        setIsLoading(true);

        if (!loginInput || !password) {
            setMessage({ text: 'Логин и пароль обязательны.', type: 'error' });
            setIsLoading(false);
            return;
        }

        try {
            const result = await authLogin({ login: loginInput, password });
            if (result.success) {
                setMessage({ text: 'Вход выполнен успешно! Перенаправление...', type: 'success' });
                // setIsLoading(false) не здесь, т.к. будет редирект
            } else {
                setMessage({ text: result.error || 'Ошибка входа. Проверьте данные.', type: 'error' });
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Login page submit error:", err);
            setMessage({ text: 'Непредвиденная ошибка на странице.', type: 'error' });
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            <div className="auth-form-wrapper">
                <h1>Вход в систему</h1>

                {/* Блок для сообщений - всегда в DOM, управляется видимостью */}
                <div className="auth-message-placeholder">
                    <p
                        className={`
                            auth-message
                            ${message.type === 'error' ? 'auth-error-message' : ''}
                            ${message.type === 'success' ? 'auth-success-message' : ''}
                            ${isMessageVisible ? 'visible' : ''}
                        `}
                    >
                        {/* Используем   чтобы зарезервировать высоту, если текста нет, но элемент видим */}
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
                            placeholder="Введите ваш логин"
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
                            placeholder="Введите ваш пароль"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? (message.type === 'success' ? 'Перенаправление...' : 'Вход...') : 'Войти'}
                    </button>
                </form>
                <p className="auth-prompt">
                    Нет аккаунта? <Link to="/join" className={isLoading ? 'disabled-link' : ''}>Зарегистрироваться</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;