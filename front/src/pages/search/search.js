import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './search.css'; // Импорт стилей для SearchPage

const API_BASE_URL = process.env.REACT_APP_API_SERVER_URL;
const PLACEHOLDER_IMG_SRC = '/placeholder-game-cover.png';

const StarRating = ({ rating }) => {
    if (rating === null || rating === undefined || rating <= 0) {
        return <span className="no-rating">Нет рейтинга</span>;
    }
    return (
        <>
            <i className="fas fa-star"></i> {parseFloat(rating).toFixed(1)}
        </>
    );
};

const GameItemCard = React.memo(({ game }) => {
    const [imgSrc, setImgSrc] = useState(`${API_BASE_URL}/api/img/${game.id}.png`);
    
    useEffect(() => {
        setImgSrc(`${API_BASE_URL}/api/img/${game.id}.png`);
    }, [game.id]);

    const handleImageError = () => setImgSrc(PLACEHOLDER_IMG_SRC);

    return (
        <Link to={`/games/${game.id}`} className="game-card">
            <div className="game-card-image-container">
                <img 
                    src={imgSrc} 
                    alt={game.name}
                    className="game-card-image" 
                    onError={handleImageError} 
                />
            </div>
            <div className="game-card-info">
                <h3 className="game-card-title">{game.name}</h3>
                {game.year && <p className="game-card-year">{game.year}</p>}
                <div className="game-card-rating">
                    <StarRating rating={game.rating} />
                </div>
            </div>
        </Link>
    );
});

function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [activeMainSearchTerm, setActiveMainSearchTerm] = useState(searchParams.get('search') || '');
    const [activeFilterYear, setActiveFilterYear] = useState(searchParams.get('year') || '');
    const [activeFilterGenre, setActiveFilterGenre] = useState(searchParams.get('genre') || '');
    const [activeFilterPublisher, setActiveFilterPublisher] = useState(searchParams.get('publisher') || '');
    const [activeFilterDeveloper, setActiveFilterDeveloper] = useState(searchParams.get('developer') || '');
    const [activeFilterMinRating, setActiveFilterMinRating] = useState(searchParams.get('minRating') || '');
    const [activeSortBy, setActiveSortBy] = useState(searchParams.get('sortBy') || 'g.name');
    const [activeSortOrder, setActiveSortOrder] = useState(searchParams.get('sortOrder') || 'ASC');
    const [activePage, setActivePage] = useState(parseInt(searchParams.get('page')) || 1);

    const [tempMainSearchTerm, setTempMainSearchTerm] = useState(activeMainSearchTerm);
    const [tempFilterYear, setTempFilterYear] = useState(activeFilterYear);
    const [tempFilterGenre, setTempFilterGenre] = useState(activeFilterGenre);
    const [tempFilterPublisher, setTempFilterPublisher] = useState(activeFilterPublisher);
    const [tempFilterDeveloper, setTempFilterDeveloper] = useState(activeFilterDeveloper);
    const [tempFilterMinRating, setTempFilterMinRating] = useState(activeFilterMinRating);
    const [tempSortBy, setTempSortBy] = useState(activeSortBy);
    const [tempSortOrder, setTempSortOrder] = useState(activeSortOrder);

    const [games, setGames] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalPages, setTotalPages] = useState(0);
    const [totalGames, setTotalGames] = useState(0);
    const itemsPerPage = 12;

    const fetchGames = useCallback(async (pageToFetch) => {
        setIsLoading(true);
        setError('');

        const queryParams = new URLSearchParams();
        queryParams.append('page', pageToFetch.toString());
        queryParams.append('limit', itemsPerPage.toString());

        if (activeMainSearchTerm) queryParams.append('search', activeMainSearchTerm);
        if (activeFilterYear) queryParams.append('year', activeFilterYear);
        if (activeFilterGenre) queryParams.append('genre', activeFilterGenre);
        if (activeFilterPublisher) queryParams.append('publisher', activeFilterPublisher);
        if (activeFilterDeveloper) queryParams.append('developer', activeFilterDeveloper);
        if (activeFilterMinRating) queryParams.append('minRating', activeFilterMinRating);
        if (activeSortBy) queryParams.append('sortBy', activeSortBy);
        if (activeSortOrder) queryParams.append('sortOrder', activeSortOrder);
        
        const currentSearchParamsString = new URLSearchParams(searchParams).toString();
        const nextQueryParamsString = queryParams.toString();

        // Обновляем URL только если параметры действительно изменились (исключая сам page для этого сравнения)
        // или если это первая загрузка и searchParams еще не установлены корректно.
        const stripPage = (str) => str.replace(/&?page=\d+/, '').replace(/^page=\d+&?/, '');
        if (stripPage(nextQueryParamsString) !== stripPage(currentSearchParamsString) || pageToFetch.toString() !== searchParams.get('page')) {
           setSearchParams(queryParams, { replace: true });
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/games?${queryParams.toString()}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Ошибка загрузки игр: ${response.status}`);
            }
            const data = await response.json();
            setGames(data.games || []);
            setTotalGames(data.totalGames || 0);
            setTotalPages(data.totalPages || 0);
            setActivePage(data.currentPage || 1);
        } catch (err) {
            console.error("Error fetching games:", err);
            setError(err.message);
            setGames([]);
            setTotalGames(0);
            setTotalPages(0);
        } finally {
            setIsLoading(false);
        }
    }, [ 
        activeMainSearchTerm, activeFilterYear, activeFilterGenre, activeFilterPublisher,
        activeFilterDeveloper, activeFilterMinRating, activeSortBy, activeSortOrder, 
        itemsPerPage, setSearchParams, searchParams // searchParams для сравнения
    ]);

    useEffect(() => {
        const pageFromUrl = parseInt(searchParams.get('page')) || 1;
        const searchFromUrl = searchParams.get('search') || '';
        const yearFromUrl = searchParams.get('year') || '';
        const genreFromUrl = searchParams.get('genre') || '';
        const publisherFromUrl = searchParams.get('publisher') || '';
        const developerFromUrl = searchParams.get('developer') || '';
        const minRatingFromUrl = searchParams.get('minRating') || '';
        const sortByFromUrl = searchParams.get('sortBy') || 'g.name';
        const sortOrderFromUrl = searchParams.get('sortOrder') || 'ASC';

        setActiveMainSearchTerm(searchFromUrl);
        setActiveFilterYear(yearFromUrl);
        setActiveFilterGenre(genreFromUrl);
        setActiveFilterPublisher(publisherFromUrl);
        setActiveFilterDeveloper(developerFromUrl);
        setActiveFilterMinRating(minRatingFromUrl);
        setActiveSortBy(sortByFromUrl);
        setActiveSortOrder(sortOrderFromUrl);
        setActivePage(pageFromUrl);

        setTempMainSearchTerm(searchFromUrl);
        setTempFilterYear(yearFromUrl);
        setTempFilterGenre(genreFromUrl);
        setTempFilterPublisher(publisherFromUrl);
        setTempFilterDeveloper(developerFromUrl);
        setTempFilterMinRating(minRatingFromUrl);
        setTempSortBy(sortByFromUrl);
        setTempSortOrder(sortOrderFromUrl);
    }, [searchParams]);

    useEffect(() => {
        fetchGames(activePage);
    }, [
        activeMainSearchTerm, activeFilterYear, activeFilterGenre, activeFilterPublisher,
        activeFilterDeveloper, activeFilterMinRating, activeSortBy, activeSortOrder,
        activePage, fetchGames
    ]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== activePage) {
            setActivePage(newPage);
        }
    };
    
    const handleInputChange = (setter) => (e) => {
        setter(e.target.value);
    };

    const applyAllFilters = () => {
        setActiveMainSearchTerm(tempMainSearchTerm);
        setActiveFilterYear(tempFilterYear);
        setActiveFilterGenre(tempFilterGenre);
        setActiveFilterPublisher(tempFilterPublisher);
        setActiveFilterDeveloper(tempFilterDeveloper);
        setActiveFilterMinRating(tempFilterMinRating);
        setActiveSortBy(tempSortBy);
        setActiveSortOrder(tempSortOrder);
        
        // Если активная страница не 1, сбрасываем ее. Это вызовет useEffect для загрузки.
        // Если уже 1, нужно будет явно вызвать fetchGames или убедиться, что другие active состояния изменились.
        if (activePage !== 1) {
            setActivePage(1);
        } else {
            // Если страница уже первая, но другие фильтры изменились,
            // а fetchGames зависит от active... состояний, то он вызовется.
            // Однако, чтобы гарантировать обновление URL, сделаем это здесь.
            const newQueryParams = new URLSearchParams();
            if (tempMainSearchTerm) newQueryParams.set('search', tempMainSearchTerm);
            if (tempFilterYear) newQueryParams.set('year', tempFilterYear);
            // ... (добавить все temp фильтры)
            if (tempFilterGenre) newQueryParams.set('genre', tempFilterGenre);
            if (tempFilterPublisher) newQueryParams.set('publisher', tempFilterPublisher);
            if (tempFilterDeveloper) newQueryParams.set('developer', tempFilterDeveloper);
            if (tempFilterMinRating) newQueryParams.set('minRating', tempFilterMinRating);
            if (tempSortBy && tempSortBy !== 'g.name') newQueryParams.set('sortBy', tempSortBy);
            if (tempSortOrder && tempSortOrder !== 'ASC') newQueryParams.set('sortOrder', tempSortOrder);
            newQueryParams.set('page', '1');
            setSearchParams(newQueryParams, { replace: true });
            // Если useEffect для activePage=1 не сработает из-за того, что activePage не изменился,
            // а другие active* состояния уже были такими же, как temp*, то fetchGames не вызовется.
            // В таком случае, можно либо добавить в зависимости fetchGames searchParams,
            // либо здесь явно вызвать fetchGames(1), если другие active* не изменились.
            // Текущая логика с useEffect должна сработать, так как active* состояния обновляются перед этим.
        }
    };
    
    const handleMainSearchEnter = (e) => {
        if (e.key === 'Enter') {
            applyAllFilters();
        }
    };

    const resetAllFilters = () => {
        setTempMainSearchTerm('');
        setTempFilterYear('');
        setTempFilterGenre('');
        setTempFilterPublisher('');
        setTempFilterDeveloper('');
        setTempFilterMinRating('');
        setTempSortBy('g.name');
        setTempSortOrder('ASC');
        
        setActiveMainSearchTerm('');
        setActiveFilterYear('');
        setActiveFilterGenre('');
        setActiveFilterPublisher('');
        setActiveFilterDeveloper('');
        setActiveFilterMinRating('');
        setActiveSortBy('g.name');
        setActiveSortOrder('ASC');
        
        if (activePage !== 1) {
            setActivePage(1);
        } else {
            // Если уже на первой странице, нужно обновить URL и, возможно, вызвать fetch
            setSearchParams({ page: '1' }, { replace: true });
             // Если active состояния не изменились, fetchGames не вызовется сам по себе
             // Можно вызвать fetchGames(1) явно, если уверены, что это нужно
             // Однако, так как active* состояния сбрасываются, useEffect [active*, activePage, fetchGames] должен сработать.
        }
    };

    return (
        <div className="games-list-page-container"> {/* Используем класс из CSS */}
            <h1 className="page-title">Поиск игр</h1>
            <div className="games-list-layout">
                <div className="games-main-content">
                    <div className="search-bar-container">
                        <input
                            type="text"
                            value={tempMainSearchTerm}
                            onChange={handleInputChange(setTempMainSearchTerm)}
                            onKeyPress={handleMainSearchEnter}
                            placeholder="Поиск по названию или описанию..."
                        />
                    </div>

                    {isLoading ? (
                        <div className="games-list-loader">Загрузка игр...</div>
                    ) : error ? (
                        <div className="games-list-message games-list-error-message">{error}</div>
                    ) : games.length > 0 ? (
                        <>
                            <p className="games-list-message">Найдено игр: {totalGames}</p>
                            <div className="games-grid">
                                {games.map(game => <GameItemCard key={game.id} game={game} />)}
                            </div>
                            {totalPages > 1 && (
                                <div className="pagination-container">
                                    <button onClick={() => handlePageChange(activePage - 1)} disabled={activePage === 1}>
                                        « Назад
                                    </button>
                                    <span>Страница <span className="current-page">{activePage}</span> из {totalPages}</span>
                                    <button onClick={() => handlePageChange(activePage + 1)} disabled={activePage === totalPages}>
                                        Вперед »
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="games-list-message">Игры по вашему запросу не найдены. Попробуйте изменить фильтры.</div>
                    )}
                </div>

                <aside className="filters-sidebar">
                    <h2>Фильтры</h2>
                    <form onSubmit={(e) => { e.preventDefault(); applyAllFilters(); }}>
                        <div className="filter-group">
                            <label htmlFor="year">Год выхода:</label>
                            <input type="number" id="year" value={tempFilterYear} onChange={handleInputChange(setTempFilterYear)} placeholder="Напр. 2023" />
                        </div>
                        <div className="filter-group">
                            <label htmlFor="genre">Жанр:</label>
                            <input type="text" id="genre" value={tempFilterGenre} onChange={handleInputChange(setTempFilterGenre)} placeholder="Напр. RPG" />
                        </div>
                        <div className="filter-group">
                            <label htmlFor="publisher">Издатель:</label>
                            <input type="text" id="publisher" value={tempFilterPublisher} onChange={handleInputChange(setTempFilterPublisher)} placeholder="Имя или ID" />
                        </div>
                        <div className="filter-group">
                            <label htmlFor="developer">Разработчик:</label>
                            <input type="text" id="developer" value={tempFilterDeveloper} onChange={handleInputChange(setTempFilterDeveloper)} placeholder="Имя или ID" />
                        </div>
                        <div className="filter-group">
                            <label htmlFor="minRating">Мин. рейтинг (0-10):</label>
                            <input type="number" id="minRating" value={tempFilterMinRating} onChange={handleInputChange(setTempFilterMinRating)} placeholder="Напр. 7.5" step="0.1" min="0" max="10" />
                        </div>
                        <div className="filter-group">
                            <label htmlFor="sortBy">Сортировать по:</label>
                            <select id="sortBy" value={tempSortBy} onChange={handleInputChange(setTempSortBy)}>
                                <option value="g.name">Названию</option>
                                <option value="g.year">Году</option>
                                <option value="g.rating">Рейтингу</option>
                                <option value="publisher_name">Издателю</option>
                                <option value="developer_name">Разработчику</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="sortOrder">Порядок:</label>
                            <select id="sortOrder" value={tempSortOrder} onChange={handleInputChange(setTempSortOrder)}>
                                <option value="ASC">По возрастанию</option>
                                <option value="DESC">По убыванию</option>
                            </select>
                        </div>
                        <div className="filters-actions">
                            <button type="submit" className="auth-button">Применить фильтры</button>
                            <button type="button" onClick={resetAllFilters} className="auth-button" style={{background: 'var(--color-bg-element)', border: '1px solid var(--color-border-primary)'}}>Сбросить фильтры</button>
                        </div>
                    </form>
                </aside>
            </div>
        </div>
    );
}

export default SearchPage;