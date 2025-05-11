// src/pages/NotFoundPage/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

// App.css должен быть импортирован глобально (например, в App.js или index.js)

const NotFoundPage = () => {
  return (
    <div className="centered-content-page">
      {/* 1. Заголовок ("Страница не найдена") */}
      <h2 className="page-main-title">Страница не найдена</h2>

      {/* 2. Большой текст ("404") */}
      <h1 className="text-hero text-color-light">404</h1>

      {/* 3. Изображение/Иконка */}
      <img
        src="/error.png"
        alt="Декоративное изображение" // Изменено alt для лучшей доступности, если иконка чисто декоративная
        className="content-image content-image-xl image-filter-glow-accent"
      />

      {/* 4. Описательный текст */}
      <p className="page-description-text">
        Ой! Кажется, страница, которую вы ищете, не существует, была перемещена или временно недоступна.
        Пожалуйста, проверьте URL или вернитесь на главную.
      </p>

      {/* 5. Кнопка-ссылка */}
      <Link to="/" className="button-styled-link button-primary-theme">
        Вернуться на главную
      </Link>
    </div>
  );
};

export default NotFoundPage;