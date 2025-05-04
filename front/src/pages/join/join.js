import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './join.css'; // Убедитесь, что путь правильный

// Получаем базовый URL API из переменных окружения
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function JoinPage() {
  // --- Состояния для полей формы, ошибок и сообщений ---
  const [login, setLogin] = useState(''); // Используем 'login' вместо 'email'
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(''); // Для ошибок
  const [successMessage, setSuccessMessage] = useState(''); // Для сообщения об успехе
  const [loading, setLoading] = useState(false); // Для состояния загрузки

  const navigate = useNavigate(); // Для редиректа после успеха

  const handleRegister = async (event) => {
    event.preventDefault(); // Предотвращаем стандартную отправку
    setError(''); // Сбрасываем ошибки
    setSuccessMessage(''); // Сбрасываем сообщения об успехе
    setLoading(true); // Начинаем загрузку

    // --- 1. Клиентская валидация ---
    if (password !== confirmPassword) {
      setError('Пароли не совпадают!');
      setLoading(false);
      return; // Прерываем отправку
    }
    if (password.length < 6) { // Пример минимальной длины
        setError('Пароль должен быть не менее 6 символов.');
        setLoading(false);
        return;
    }
    // Добавьте другие проверки при необходимости (например, сложность пароля)

    // --- 2. Проверка URL API ---
    if (!API_BASE_URL) {
        setError("Ошибка конфигурации: не найден URL API. Проверьте файл .env и перезапустите сервер.");
        setLoading(false);
        return;
    }

    console.log('Попытка регистрации с данными:', { login, password: '***' }); // Не логгируем пароль
    console.log('Целевой API:', `${API_BASE_URL}/api/auth/join`);

    try {
        // --- 3. Отправка запроса на бэкенд ---
        const response = await fetch(`${API_BASE_URL}/api/auth/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Отправляем только 'login' и 'password', как ожидает бэкенд
            body: JSON.stringify({ login: login, password: password }),
        });

        const data = await response.json(); // Получаем ответ

        if (response.ok) { // Статус 201 Created считается ok
            console.log('Успешная регистрация (ответ сервера):', data);
            setSuccessMessage(data.message || 'Регистрация прошла успешно! Теперь вы можете войти.');
            // Очистка формы после успеха (опционально)
            setLogin('');
            setPassword('');
            setConfirmPassword('');
            // Можно добавить небольшой таймаут перед редиректом, чтобы пользователь увидел сообщение
            setTimeout(() => {
                navigate('/login'); // Перенаправляем на страницу входа
            }, 2000); // Задержка 2 секунды

        } else {
            // Ошибка от сервера (400, 409, 500 и т.д.)
            console.error('Ошибка регистрации (ответ сервера):', data);
            setError(data.message || 'Произошла ошибка при регистрации.');
        }

    } catch (err) {
        // Ошибка сети или JSON
        console.error('Ошибка сети или выполнения запроса:', err);
        setError(`Не удалось подключиться к серверу по адресу ${API_BASE_URL}. Проверьте адрес, запущен ли сервер и настройки CORS.`);
    } finally {
        setLoading(false); // Завершаем загрузку в любом случае
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        <h1>Создать аккаунт</h1>
        <form onSubmit={handleRegister}>

          {/* Отображение ошибки */}
          {error && <p className="auth-error-message">{error}</p>}
          {/* Отображение сообщения об успехе */}
          {successMessage && <p className="auth-success-message">{successMessage}</p>}

          {/* --- Поле для Логина --- */}
          <div className="auth-input-group">
            <label htmlFor="join-login">Логин</label> {/* Изменено */}
            <input
              type="text" // Изменено
              id="join-login" // Изменено
              className="auth-input"
              placeholder="Придумайте логин" // Изменено
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {/* --- Поле для Пароля --- */}
          <div className="auth-input-group">
            <label htmlFor="join-password">Пароль</label>
            <input
              type="password"
              id="join-password"
              className="auth-input"
              placeholder="Создайте пароль (мин. 6 символов)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
              disabled={loading}
            />
          </div>
          {/* --- Поле для Подтверждения Пароля --- */}
          <div className="auth-input-group">
            <label htmlFor="join-confirm-password">Подтвердите пароль</label>
            <input
              type="password"
              id="join-confirm-password"
              className="auth-input"
              placeholder="Повторите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          {/* --- Кнопка Отправки --- */}
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="auth-prompt">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}

// Добавьте стили для success message, если нужно (аналогично error message)
/*
.auth-success-message {
  color: #2ecc71; // Зеленый
  background-color: #e8f8ef;
  border: 1px solid #2ecc71;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
  margin-bottom: 15px;
  font-size: 0.9em;
}
*/


export default JoinPage;