export const ACCESS_TOKEN_KEY = 'AuthToken';
export const setAccessToken = (token: string): void => {
    try{
        localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
    catch(e){
        console.error("Error setting access token in localStorage", e);
    }
};

export const getAccessToken = (): string | null => {
    try{
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    catch(e){
        console.error("Error getting access token from localStorage", e);
        return null;
    }
};

export const removeAccessToken = (): void => {
    try{
        localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    catch(e){
        console.error("Error removing access token from localStorage", e);
    }
};
