import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext'; // Correct path assumed
import './header.css';

// --- Import React Icons ---
import { IoSearch, IoPersonCircleOutline, IoLogOutOutline, IoListOutline } from 'react-icons/io5'; // Using Io5 icons
import { ImSpinner2 } from 'react-icons/im'; // Using ImSpinner for loading

// Хук для debounce
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
    const { isAuthenticated, logout, isLoading: authIsLoading, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    // --- Ref change: Point ref to the form itself for click outside logic ---
    const searchFormRef = useRef(null);

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

    // useCallback dependency Optimization: API_BASE_URL is constant
    const fetchSearchResults = useCallback(async (query) => {
        if (!API_BASE_URL) {
             console.error("API Base URL is not configured for search.");
             setSearchResults([]);
             setIsDropdownVisible(false);
             return;
        }
        // Trim query check before proceeding
        const trimmedQuery = query.trim();
        if (!trimmedQuery || trimmedQuery.length < 2) {
            setSearchResults([]);
            // Only show dropdown if focused and input has content (even < 2 chars)
            setIsDropdownVisible(trimmedQuery.length > 0 && document.activeElement === searchFormRef.current?.querySelector('input'));
            return;
        }

        setIsSearchLoading(true);
        setIsDropdownVisible(true); // Show dropdown when loading starts

        try {
            const response = await fetch(`${API_BASE_URL}/api/games?search=${encodeURIComponent(trimmedQuery)}&limit=5&page=1`);
            if (!response.ok) {
                // Basic error handling
                console.error(`Search fetch failed: ${response.status}`);
                 throw new Error('Network response was not ok for search');
            }
            const data = await response.json();
            setSearchResults(data.games || []);
        } catch (error) {
            console.error("Failed to fetch search results:", error);
            setSearchResults([]); // Clear results on error
        } finally {
            setIsSearchLoading(false);
            // Re-evaluate visibility after fetch completes
            const stillHasFocus = document.activeElement === searchFormRef.current?.querySelector('input');
            const hasResultsOrStillLoading = searchResults.length > 0 || isSearchLoading; // isSearchLoading check redundant here, but safe
             // Keep visible if focused and has content OR if results were found (even if focus is lost somehow)
            setIsDropdownVisible(prev => prev && ( (stillHasFocus && searchQuery.trim().length > 0) || hasResultsOrStillLoading));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]); // Keep searchQuery dependency


    useEffect(() => {
        // Trigger fetch only on debounced query changes >= 2 chars
        if (debouncedSearchQuery.trim().length >= 2) {
            fetchSearchResults(debouncedSearchQuery);
        } else {
             // Clear results if query is too short
            setSearchResults([]);
             // Update visibility based on non-debounced query and focus
             const inputElement = searchFormRef.current?.querySelector('input');
             const shouldBeVisible = searchQuery.trim().length > 0 && document.activeElement === inputElement;
             setIsDropdownVisible(shouldBeVisible);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearchQuery]); // Depend only on debounced value for fetch trigger


    // --- Updated useEffect for click outside using searchFormRef ---
    useEffect(() => {
        function handleClickOutside(event) {
            // Close dropdown if click is outside the form element
            if (searchFormRef.current && !searchFormRef.current.contains(event.target)) {
                setIsDropdownVisible(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []); // No dependencies needed here

    const handleInputFocus = () => {
         // Show dropdown on focus only if there's text already
        if (searchQuery.trim().length > 0) {
            setIsDropdownVisible(true);
        }
    };

    const handleInputChange = (e) => {
        const newQuery = e.target.value;
        setSearchQuery(newQuery);
         // Show dropdown immediately if input is not empty, hide if empty
         setIsDropdownVisible(newQuery.trim().length > 0);
         // Fetch is handled by the debounced useEffect
    };

    const pageIsEffectivelyLoading = authIsLoading;

    const SearchResultItem = ({ game }) => {
        const [currentSrc, setCurrentSrc] = useState(API_BASE_URL ? `${API_BASE_URL}/api/img/${game.id}.png` : PLACEHOLDER_IMG_SRC);
        const [hasError, setHasError] = useState(false);

        useEffect(() => {
            if (API_BASE_URL) {
                setCurrentSrc(`${API_BASE_URL}/api/img/${game.id}.png`);
                setHasError(false);
            }
        }, [game.id]);

        const handleError = () => {
            if (currentSrc !== PLACEHOLDER_IMG_SRC) {
                setCurrentSrc(PLACEHOLDER_IMG_SRC);
            } else {
                setHasError(true);
            }
        };

        if (!API_BASE_URL && !PLACEHOLDER_IMG_SRC) return null;

        return (
            <li className="search-dropdown-item">
                <Link to={`/games/${game.id}`} onClick={() => {
                    setSearchQuery('');
                    setIsDropdownVisible(false); // Hide dropdown on selection
                }}>
                    <img
                        src={!API_BASE_URL ? PLACEHOLDER_IMG_SRC : currentSrc}
                        alt={game.name || 'Game cover'}
                        className={`search-dropdown-item-image ${hasError ? 'has-error' : ''}`}
                        onError={handleError}
                        loading="lazy"
                    />
                    <div className="search-dropdown-item-details">
                        <div className="search-dropdown-item-title-line">
                            <span className="search-dropdown-item-name">{game.name || 'Игра без имени'}</span>
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

            {/* NAV remains for layout, but ref moves to FORM */}
            <nav className="header-navigation">
                {/* --- FORM now has the ref and contains the dropdown --- */}
                <form
                    onSubmit={handleFullSearchSubmit}
                    className="header-search-form"
                    ref={searchFormRef} // Ref attached to the form
                 >
                    <input
                        type="text"
                        className="header-search-input"
                        placeholder="Поиск игр..."
                        value={searchQuery}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        disabled={pageIsEffectivelyLoading}
                        aria-label="Поиск игр"
                    />
                    <button
                        type="submit"
                        className="header-search-button"
                        disabled={pageIsEffectivelyLoading || !searchQuery.trim()}
                        aria-label="Начать поиск"
                     >
                        <IoSearch />
                    </button>

                    {/* --- Search Dropdown moved INSIDE the form --- */}
                    {isDropdownVisible && (
                        <ul className="header-search-dropdown" role="listbox">
                            {isSearchLoading && (
                                 <li className="search-dropdown-item loading" role="option" aria-busy="true">
                                     <ImSpinner2 className="spinner-icon" /> Загрузка...
                                 </li>
                            )}
                            {!isSearchLoading && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                                 <li className="search-dropdown-item no-results" role="option">Ничего не найдено.</li>
                            )}
                             {/* Hint for short query */}
                             {!isSearchLoading && searchResults.length === 0 && searchQuery.trim().length === 1 && (
                                <li className="search-dropdown-item no-results" role="option">Введите больше символов...</li>
                             )}
                            {!isSearchLoading && searchResults.length > 0 && searchResults.map(game => (
                                <SearchResultItem key={game.id} game={game} />
                            ))}
                        </ul>
                    )}
                    {/* --- End of Search Dropdown --- */}

                </form>
                {/* --- End of Form --- */}
            </nav>

            {/* User Actions Area (No changes needed here) */}
            <div className="header-actions">
                {pageIsEffectivelyLoading ? (
                    <div className="header-loading-indicator">
                        <ImSpinner2 className="spinner-icon" /> Загрузка...
                    </div>
                ) : (
                    <>
                        {!isAuthenticated && (
                            <Link className="header-action-link header-login-link" to="/login" title="Войти">
                                <IoPersonCircleOutline />
                            </Link>
                        )}

                        {isAuthenticated && (
                            <>
                                {isAdmin && (
                                    <Link className="header-action-link header-admin-link" to="/admin" title="Админ панель">
                                        <IoListOutline />
                                    </Link>
                                )}
                                <button onClick={handleLogout} className="header-action-button header-logout-button" title="Выйти">
                                    <IoLogOutOutline />
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
        </header>
    );
}

export default Header;