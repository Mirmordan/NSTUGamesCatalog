import React, { useState, useEffect } from 'react';
import GameCard from '../../components/gameCard/gameCard';
import './home.css'; // Импортируем еще более сокращенные стили

const API_BASE_URL = process.env.REACT_APP_API_SERVER_URL;

function HomePage() {
    const [topGames, setTopGames] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTopGames = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await fetch(`${API_BASE_URL}/api/games?sortBy=g.rating&sortOrder=DESC&limit=10&page=1`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `Ошибка загрузки топ игр: ${response.status}` }));
                    throw new Error(errorData.message || `Ошибка загрузки топ игр: ${response.status}`);
                }
                const data = await response.json();
                setTopGames(data.games || []);
            } catch (err) {
                console.error("Error fetching top games:", err);
                setError(err.message);
                setTopGames([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTopGames();
    }, []);

    const messageBlockStyle = {
        textAlign: 'center',
        paddingTop: '20px', // Добавим отступ сверху для блоков сообщений
        paddingBottom: '20px'
    };

    return (
        // Используем новый общий класс .content-container из App.css
        <div className="content-container">
            {/* Приветственное сообщение */}
            <div style={{ textAlign: 'center', marginBottom: '30px', marginTop: '0' /* Явно указываем отступ */ }}>
                <h1 className="text-color-light" style={{ marginBottom: '10px' }}>
                    Добро пожаловать!
                </h1>
                <p className="page-description-text" style={{ marginBottom: '0' }}>
                    Здесь вы найдете подборку лучших игр, основанных на оценках пользователей. Приятного времяпровождения!
                </p>
            </div>

            {/* Заголовок для списка игр */}
            <h2 className="text-color-light" style={{ textAlign: 'center', marginBottom: '30px' }}>
                Лучшие игры
            </h2>

            {/* Отображение игр или сообщений */}
            {isLoading ? (
                <p className="page-description-text" style={messageBlockStyle}>
                    Загрузка лучших игр...
                </p>
            ) : error ? (
                <p className="page-description-text home-message-error" style={messageBlockStyle}>
                    {error}
                </p>
            ) : topGames.length > 0 ? (
                <div className="home-games-grid"> {/* Отступ сверху для сетки теперь не нужен, т.к. есть отступ от заголовка h2 */}
                    {topGames.map(game => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>
            ) : (
                <p className="page-description-text" style={messageBlockStyle}>
                    Не удалось загрузить топ игры или список пуст.
                </p>
            )}
        </div>
    );
}

export default HomePage;