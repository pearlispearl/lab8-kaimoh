export const ACCESS_TOKEN_KEY = 'AuthToken';
export const setAccessToken = (token) => {
    try {
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
    catch (e) {
        console.error("Error setting access token in localStorage", e);
    }
};
export const getAccessToken = () => {
    try {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    catch (e) {
        console.error("Error getting access token from localStorage", e);
        return null;
    }
};
export const removeAccessToken = () => {
    try {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    catch (e) {
        console.error("Error removing access token from localStorage", e);
    }
};
