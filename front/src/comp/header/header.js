import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Импортируем useNavigate для редиректа после выхода
import { useAuth } from '../context/authContext'; // <-- Импортируем хук useAuth (убедитесь, что путь верный)
import './header.css';
// import logoSrc from '../assets/logo.png';

function Header() {
  // Получаем состояние аутентификации, функцию выхода и флаг загрузки из контекста
  const { isAuthenticated, logout, isLoading } = useAuth();
  const navigate = useNavigate(); // Хук для программной навигации

  // Обработчик для кнопки "Выйти"
  const handleLogout = async () => {
    await logout(); // Вызываем функцию выхода из контекста
    navigate('/login'); // Перенаправляем пользователя на страницу входа после выхода
  };

  // Определяем, куда будет вести иконка пользователя
  const accountLinkTarget = isAuthenticated ? "/profile" : "/login";

  return (
    <header className="app-header">
      <Link className="header-logo" to="/">
        <img src="/logo.png" alt="Логотип Каталога Игр" /> {/* Улучшил alt текст */}
      </Link>

      <nav className="header-navigation">
        <ul>
          {/* Общие ссылки, которые видны всегда */}
          {/* <li><Link to="/">Главная</Link></li>  Можете добавить, если нужно */}

          {/* Показываем разные наборы ссылок в зависимости от статуса аутентификации */}
          {/* Не показываем изменяемые ссылки, пока идет проверка статуса */}
          {!isLoading && (
            isAuthenticated ? (
              // Ссылки для аутентифицированного пользователя
              <>
                <li><Link to="/profile">Профиль</Link></li>
                <li>
                  {/* Используем кнопку для действия выхода */}
                  <button onClick={handleLogout} className="header-logout-button">
                    Выйти
                  </button>
                </li>
              </>
            ) : (
              // Ссылки для неаутентифицированного пользователя
              <>
                <li><Link to="/login">Логин</Link></li>
                <li><Link to="/join">Регистрация</Link></li>
              </>
            )
          )}
           {/* Можно добавить индикатор загрузки, пока isLoading === true */}
           {isLoading && <li>Загрузка...</li>}
        </ul>
      </nav>

      <div className="header-actions">
        {/* Ссылка на иконке аккаунта также зависит от статуса аутентификации */}
        {/* Не рендерим иконку, пока идет проверка, чтобы она не мигала неправильной ссылкой */}
        {!isLoading && (
             <Link className="header-account" to={accountLinkTarget}>
                <i className="fas fa-user-circle"></i>
                {/* Можно добавить текст рядом с иконкой, если нужно */}
                {/* <span className="account-text">{isAuthenticated ? 'Профиль' : 'Войти'}</span> */}
             </Link>
        )}
        {/* Если хотите, чтобы иконка была всегда, но ссылка менялась:
         <Link className="header-account" to={isLoading ? "#" : accountLinkTarget}>
             <i className="fas fa-user-circle"></i>
         </Link>
        */}
      </div>
    </header>
  );
}

export default Header;