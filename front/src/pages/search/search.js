import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './search.css'; 
import GameCard from '../../components/gameCard/gameCard'; // Import the new component

const API_BASE_URL = process.env.REACT_APP_API_SERVER_URL;
// PLACEHOLDER_IMG_SRC is now handled within GameCard.js

// StarRating is now inside GameCard.js
// GameCard is imported

const CollapsibleCheckboxFilter = ({ title, options, selectedOptions, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const handleCheckboxChange = (optionValue) => {
        const newSelectedOptions = selectedOptions.includes(optionValue)
            ? selectedOptions.filter(item => item !== optionValue)
            : [...selectedOptions, optionValue];
        onChange(newSelectedOptions);
    };
    return (
        <div className="filter-group collapsible-filter">
            <button type="button" className="collapsible-header" onClick={() => setIsOpen(!isOpen)}>
                {title}
                <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
            </button>
            {isOpen && (
                <div className="collapsible-content">
                    {options.map(option => (
                        <label key={option.value} className="checkbox-label">
                            <input
                                type="checkbox"
                                value={option.value}
                                checked={selectedOptions.includes(option.value)}
                                onChange={() => handleCheckboxChange(option.value)}
                            />
                            {option.label}
                        </label>
                    ))}
                    {options.length === 0 && <p className="no-options-message">Нет доступных опций</p>}
                </div>
            )}
        </div>
    );
};

function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [tempMainSearchTerm, setTempMainSearchTerm] = useState(searchParams.get('search') || '');
    const [tempFilterGenres, setTempFilterGenres] = useState(searchParams.getAll('genre') || []);
    const [tempFilterPlatforms, setTempFilterPlatforms] = useState(searchParams.getAll('platform') || []);
    const [tempFilterPublisher, setTempFilterPublisher] = useState(searchParams.get('publisher') || '');
    const [tempFilterDeveloper, setTempFilterDeveloper] = useState(searchParams.get('developer') || '');
    const [tempMinRating, setTempMinRating] = useState(searchParams.get('minRating') || '0');
    const [tempMaxRating, setTempMaxRating] = useState(searchParams.get('maxRating') || '10');
    const [tempSortBy, setTempSortBy] = useState(searchParams.get('sortBy') || 'g.name');
    const [tempSortOrder, setTempSortOrder] = useState(searchParams.get('sortOrder') || 'ASC');

    const [games, setGames] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [totalPages, setTotalPages] = useState(0);
    const [totalGames, setTotalGames] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const [availableGenres, setAvailableGenres] = useState([]);
    const [availablePlatforms, setAvailablePlatforms] = useState([]);
    const itemsPerPage = 12;

    useEffect(() => {
        setTempMainSearchTerm(searchParams.get('search') || '');
        setTempFilterGenres(searchParams.getAll('genre') || []);
        setTempFilterPlatforms(searchParams.getAll('platform') || []);
        setTempFilterPublisher(searchParams.get('publisher') || '');
        setTempFilterDeveloper(searchParams.get('developer') || '');
        setTempMinRating(searchParams.get('minRating') || '0');
        setTempMaxRating(searchParams.get('maxRating') || '10');
        setTempSortBy(searchParams.get('sortBy') || 'g.name');
        setTempSortOrder(searchParams.get('sortOrder') || 'ASC');
    }, [searchParams]);

    useEffect(() => {
        const fetchGamesData = async () => {
            setIsLoading(true);
            setError('');

            const query = new URLSearchParams(searchParams);
            if (!query.has('page')) query.set('page', '1'); 
            query.set('limit', itemsPerPage.toString());


            try {
                const response = await fetch(`${API_BASE_URL}/api/games?${query.toString()}`);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `Ошибка загрузки игр: ${response.status}`);
                }
                const data = await response.json();
                setGames(data.games || []);
                setTotalGames(data.totalGames || 0);
                setTotalPages(data.totalPages || 0);
                setCurrentPage(data.currentPage || 1);
            } catch (err) {
                console.error("Error fetching games:", err);
                setError(err.message);
                setGames([]);
                setTotalGames(0);
                setTotalPages(0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGamesData();

        const fetchFilterOptions = async () => {
             setAvailableGenres([
                { value: 'Action', label: 'Экшн' }, { value: 'RPG', label: 'RPG' },
                { value: 'Strategy', label: 'Стратегия' }, { value: 'Shooter', label: 'Шутер' },
                { value: 'Adventure', label: 'Приключение' }, { value: 'Simulator', label: 'Симулятор' },
                { value: 'Fighting', label: 'Файтинг'}, { value: 'Stealth', label: 'Стелс'}
            ]);
            setAvailablePlatforms([
                { value: 'PC', label: 'ПК' }, { value: 'PlayStation 5', label: 'PlayStation 5' },
                { value: 'Xbox Series X/S', label: 'Xbox Series X/S' }, { value: 'Nintendo Switch', label: 'Nintendo Switch' }
            ]);
        };
        if (availableGenres.length === 0 && availablePlatforms.length === 0) { 
            fetchFilterOptions();
        }

    }, [searchParams, itemsPerPage]); 

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
            const newQueryParams = new URLSearchParams(searchParams);
            newQueryParams.set('page', newPage.toString());
            setSearchParams(newQueryParams, { replace: true });
        }
    };
    
    const handleInputChange = (setter) => (e) => setter(e.target.value);
    const handleCheckboxGroupChange = (setter) => (newSelectedValues) => setter(newSelectedValues);
    
    const applyAllFilters = () => {
        const newQueryParams = new URLSearchParams();
        if (tempMainSearchTerm) newQueryParams.set('search', tempMainSearchTerm);
        tempFilterGenres.forEach(g => newQueryParams.append('genre', g));
        tempFilterPlatforms.forEach(p => newQueryParams.append('platform', p));
        if (tempFilterPublisher) newQueryParams.set('publisher', tempFilterPublisher);
        if (tempFilterDeveloper) newQueryParams.set('developer', tempFilterDeveloper);
        if (tempMinRating && tempMinRating !== "0") newQueryParams.set('minRating', tempMinRating);
        if (tempMaxRating && tempMaxRating !== "10") newQueryParams.set('maxRating', tempMaxRating);
        if (tempSortBy && tempSortBy !== 'g.name') newQueryParams.set('sortBy', tempSortBy);
        if (tempSortOrder && tempSortOrder !== 'ASC') newQueryParams.set('sortOrder', tempSortOrder);
        newQueryParams.set('page', '1'); 
        
        setSearchParams(newQueryParams, { replace: true });
    };
    
    const handleMainSearchEnter = (e) => {
        if (e.key === 'Enter') applyAllFilters();
    };

    const resetAllFilters = () => {
        setTempMainSearchTerm('');
        setTempFilterGenres([]);
        setTempFilterPlatforms([]);
        setTempFilterPublisher('');
        setTempFilterDeveloper('');
        setTempMinRating('0');
        setTempMaxRating('10');
        setTempSortBy('g.name');
        setTempSortOrder('ASC');
        
        setSearchParams({ page: '1' }, { replace: true });
    };

    return (
        <div className="games-list-page-container">
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
                                {games.map(game => <GameCard key={game.id} game={game} />)}
                            </div>
                            {totalPages > 1 && (
                                <div className="pagination-container">
                                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                                        « Назад
                                    </button>
                                    <span>Страница <span className="current-page">{currentPage}</span> из {totalPages}</span>
                                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
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
                        <CollapsibleCheckboxFilter
                            title="Жанры"
                            options={availableGenres}
                            selectedOptions={tempFilterGenres}
                            onChange={handleCheckboxGroupChange(setTempFilterGenres)}
                        />
                        <CollapsibleCheckboxFilter
                            title="Платформы"
                            options={availablePlatforms}
                            selectedOptions={tempFilterPlatforms}
                            onChange={handleCheckboxGroupChange(setTempFilterPlatforms)}
                        />
                        <div className="filter-group">
                            <label htmlFor="publisher">Издатель (название):</label>
                            <input type="text" id="publisher" value={tempFilterPublisher} onChange={handleInputChange(setTempFilterPublisher)} placeholder="Название издателя" />
                        </div>
                        <div className="filter-group">
                            <label htmlFor="developer">Разработчик (название):</label>
                            <input type="text" id="developer" value={tempFilterDeveloper} onChange={handleInputChange(setTempFilterDeveloper)} placeholder="Название разработчика" />
                        </div>
                        <div className="filter-group range-filter">
                            <label>Рейтинг:</label>
                            <div className="range-slider-labels">
                                <span>От: {tempMinRating}</span>
                                <span>До: {tempMaxRating}</span>
                            </div>
                            <input 
                                type="range" id="minRating" min="0" max="10" step="0.5" value={tempMinRating} 
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (val <= parseFloat(tempMaxRating)) setTempMinRating(e.target.value);
                                }}
                            />
                            <input 
                                type="range" id="maxRating" min="0" max="10" step="0.5" value={tempMaxRating} 
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (val >= parseFloat(tempMinRating)) setTempMaxRating(e.target.value);
                                }} 
                            />
                        </div>
                        <div className="filter-group">
                            <label htmlFor="sortBy">Сортировать по:</label>
                            <select id="sortBy" value={tempSortBy} onChange={handleInputChange(setTempSortBy)}>
                                <option value="g.name">Названию</option>
                                <option value="g.rating">Рейтингу</option>
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