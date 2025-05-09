import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// import './index.css'; // Если у вас есть глобальный index.css для базовых стилей
// Или импортируйте ваш основной файл глобальных стилей, если он другой:
import './styles/App.css'; // Пример пути к вашим глобальным стилям

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);