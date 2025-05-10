import React, { useState, useEffect } from 'react';
import GameCard from '../../components/gameCard/gameCard';
import './home.css';

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
                // Fetch top 10 games, sorted by rating in descending order
                // Assuming your API supports sortBy=g.rating (or similar) and sortOrder=DESC
                const response = await fetch(`${API_BASE_URL}/api/games?sortBy=g.rating&sortOrder=DESC&limit=10&page=1`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `Ошибка загрузки топ игр: ${response.status}` }));
                    throw new Error(errorData.message || `Ошибка загрузки топ игр: ${response.status}`);
                }
                const data = await response.json();
                setTopGames(data.games || []); // Assuming the API returns { games: [...] }
            } catch (err) {
                console.error("Error fetching top games:", err);
                setError(err.message);
                setTopGames([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTopGames();
    }, []); // Empty dependency array to run once on mount

    return (
        <div className="home-page-container">
            <h1 className="home-page-title">Добро пожаловать на гравную страницу</h1>
            <h1 className="home-page-title">Лучшие игры</h1>
            {isLoading ? (
                <div className="home-page-loader">Загрузка лучших игр...</div>
            ) : error ? (
                <div className="home-page-message home-page-error-message">{error}</div>
            ) : topGames.length > 0 ? (
                <div className="home-games-grid">
                    {topGames.map(game => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>
            ) : (
                <div className="home-page-message">Не удалось загрузить топ игры или список пуст.</div>
            )}
        </div>
    );
}

export default HomePage;