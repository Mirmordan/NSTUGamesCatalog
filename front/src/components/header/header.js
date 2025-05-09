import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext';
import './header.css';

// Хук для debounce (ВОЗВРАЩЕН)
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}


const API_BASE_URL = process.env.REACT_APP_API_SERVER_URL;
const PLACEHOLDER_IMG_SRC = '/placeholder-game-cover.png';

function Header() {
    const { isAuthenticated, logout, isLoading: authIsLoading } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    const debouncedSearchQuery = useDebounce(searchQuery, 500); // Теперь useDebounce определен
    const searchInputRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const handleFullSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/games?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            setIsDropdownVisible(false);
        }
    };

    const fetchSearchResults = useCallback(async (query) => {
        if (!query.trim() || query.trim().length < 2) {
            setSearchResults([]);
            if (query.trim().length < 2 && query.trim().length > 0) {
                 setIsDropdownVisible(true);
            } else {
                 setIsDropdownVisible(false);
            }
            return;
        }
        setIsSearchLoading(true);
        setIsDropdownVisible(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/games?search=${encodeURIComponent(query)}&limit=5&page=1`);
            if (!response.ok) {
                throw new Error('Network response was not ok for search');
            }
            const data = await response.json();
            setSearchResults(data.games || []);
        } catch (error) {
            console.error("Failed to fetch search results:", error);
            setSearchResults([]);
        } finally {
            setIsSearchLoading(false);
        }
    }, []); // API_BASE_URL не меняется, поэтому его можно не включать в зависимости useCallback, если он не меняется во время жизни компонента

    useEffect(() => {
        if (debouncedSearchQuery.trim().length >= 2) {
            fetchSearchResults(debouncedSearchQuery);
        } else {
            setSearchResults([]);
            if (searchInputRef.current && document.activeElement === searchInputRef.current.querySelector('input')) {
                 setIsDropdownVisible(debouncedSearchQuery.trim().length > 0);
            } else {
                 setIsDropdownVisible(false);
            }
        }
    }, [debouncedSearchQuery, fetchSearchResults]);


    useEffect(() => {
        function handleClickOutside(event) {
            if (searchInputRef.current && !searchInputRef.current.contains(event.target)) {
                setIsDropdownVisible(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [searchInputRef]);

    const handleInputFocus = () => {
        if (searchQuery.trim().length >= 2 || (searchQuery.trim().length > 0 && searchResults.length > 0) || isSearchLoading) {
            setIsDropdownVisible(true);
        } else if (searchQuery.trim().length > 0) {
             setIsDropdownVisible(true);
        }
    };

    const handleInputChange = (e) => {
        const newQuery = e.target.value;
        setSearchQuery(newQuery);
        if (newQuery.trim().length > 0) {
            setIsDropdownVisible(true);
        } else {
            setIsDropdownVisible(false);
        }
    };

    const accountLinkTarget = isAuthenticated ? "/profile" : "/login";
    const pageIsEffectivelyLoading = authIsLoading;

    const SearchResultItem = ({ game }) => {
        const [currentSrc, setCurrentSrc] = useState(`${API_BASE_URL}/api/img/${game.id}.png`);
        const [hasError, setHasError] = useState(false);

        useEffect(() => {
            setCurrentSrc(`${API_BASE_URL}/api/img/${game.id}.png`);
            setHasError(false);
        }, [game.id]); // API_BASE_URL можно опустить из зависимостей, если он статичен

        const handleError = () => {
            if (currentSrc !== PLACEHOLDER_IMG_SRC) {
                setCurrentSrc(PLACEHOLDER_IMG_SRC);
            } else {
                setHasError(true);
            }
        };

        return (
            <li className="search-dropdown-item">
                <Link to={`/games/${game.id}`} onClick={() => {
                    setSearchQuery('');
                    setIsDropdownVisible(false);
                }}>
                    <img
                        src={currentSrc}
                        alt={game.name}
                        className={`search-dropdown-item-image ${hasError ? 'has-error' : ''}`}
                        onError={handleError}
                    />
                    <div className="search-dropdown-item-details">
                        <div className="search-dropdown-item-title-line">
                            <span className="search-dropdown-item-name">{game.name}</span>
                            {game.year && <span className="search-dropdown-item-year">({game.year})</span>}
                        </div>
                    </div>
                </Link>
            </li>
        );
    };

    return (
        <header className="app-header">
            <Link className="header-logo" to="/">
                <img src="/logo.png" alt="Логотип Каталога Игр" />
            </Link>

            <nav className="header-navigation" ref={searchInputRef}>
                <form onSubmit={handleFullSearchSubmit} className="header-search-form">
                    <input
                        type="text"
                        className="header-search-input"
                        placeholder="Поиск игр..."
                        value={searchQuery}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        disabled={pageIsEffectivelyLoading}
                    />
                    <button type="submit" className="header-search-button" disabled={pageIsEffectivelyLoading || !searchQuery.trim()}>
                        <i className="fas fa-search"></i>
                    </button>
                </form>
                {isDropdownVisible && (searchQuery.trim().length > 0 || isSearchLoading) && (
                    <ul className="header-search-dropdown">
                        {isSearchLoading && <li className="search-dropdown-item loading">Загрузка...</li>}
                        {!isSearchLoading && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                             <li className="search-dropdown-item no-results">Ничего не найдено.</li>
                        )}
                        {!isSearchLoading && searchResults.map(game => (
                            <SearchResultItem key={game.id} game={game} />
                        ))}
                    </ul>
                )}
            </nav>

            <div className="header-actions">
                {!pageIsEffectivelyLoading && (
                    <Link className="header-account" to={accountLinkTarget} title={isAuthenticated ? "Профиль" : "Войти"}>
                        <i className="fas fa-user-circle"></i>
                    </Link>
                )}
                {isAuthenticated && !pageIsEffectivelyLoading && (
                    <button onClick={handleLogout} className="header-action-logout-button" title="Выйти">
                        <i className="fas fa-sign-out-alt"></i>
                    </button>
                )}
                {pageIsEffectivelyLoading && <div className="header-loading-indicator">Загрузка...</div>}
            </div>
        </header>
    );
}

export default Header;