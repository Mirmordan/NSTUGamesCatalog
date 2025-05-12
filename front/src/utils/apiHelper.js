// src/utils/apiHelper.js

const API_BASE_URL = process.env.REACT_APP_API_SERVER_URL; // Get base URL from env

if (!API_BASE_URL && process.env.NODE_ENV !== 'test') {
    console.error("CRITICAL ERROR: REACT_APP_API_SERVER_URL is not defined in the environment. API calls will fail.");
}

/**
 * Makes an API request.
 * @param {string} endpoint - The API endpoint (e.g., '/api/games'). Should start with '/'.
 * @param {object} [options={}] - Fetch options (method, headers, body, etc.).
 * @returns {Promise<any>} - A promise that resolves with the JSON response body.
 * @throws {Error} - Throws an error if the request fails or the response is not ok, including the status code and message from the server if possible.
 */
const apiHelper = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`; // Construct full URL

    const defaultHeaders = {
        'Accept': 'application/json',
        // 'Content-Type': 'application/json' // Add this only if options.body exists and is JSON
    };

    if (options.body && typeof options.body === 'string' && !options.headers?.['Content-Type']) {
       // If body is a JSON string, set Content-Type if not already set
       defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers, // Allow overriding default headers
        },
    };

    console.log(`[apiHelper] Making ${config.method || 'GET'} request to: ${url}`); // Log request

    try {
        const response = await fetch(url, config);

        console.log(`[apiHelper] Response Status from ${url}: ${response.status}`); // Log status

        // Check if the response is successful (status code 2xx)
        if (!response.ok) {
            let errorData = { message: `HTTP error! Status: ${response.status}` };
            try {
                // Try to parse error details from the response body
                const body = await response.json();
                 console.error(`[apiHelper] Error Body from ${url}:`, body); // Log error body
                errorData = body || errorData; // Use parsed body if available
            } catch (e) {
                // If parsing fails, use the default message
                console.warn(`[apiHelper] Could not parse error JSON from ${url}. Status: ${response.status}`);
                // You could try response.text() here as a fallback
            }
            // Throw an error with details
            const error = new Error(errorData.message || `Request failed with status ${response.status}`);
            error.status = response.status;
            error.data = errorData; // Attach full error data if needed
            throw error;
        }

        // Handle responses with no content (e.g., 204 No Content)
        if (response.status === 204) {
            console.log(`[apiHelper] Received 204 No Content from ${url}`);
            return null; // Or return an empty object/undefined as appropriate
        }

        // Parse the JSON response body for successful requests
        const data = await response.json();
        console.log(`[apiHelper] Success Data from ${url}:`, data); // Log success data
        return data;

    } catch (error) {
        // Catch network errors or errors thrown from response handling
        console.error(`[apiHelper] Fetch error for ${url}:`, error);

        // Re-throw the error to be caught by the calling component
        // If it's not already an error object with status, create one
        if (!error.status) {
             const networkError = new Error(error.message || 'Network error or failed to fetch');
             networkError.isNetworkError = true; // Add a flag for network errors
             throw networkError;
        } else {
             throw error; // Re-throw the error from response handling
        }
    }
};

export default apiHelper;