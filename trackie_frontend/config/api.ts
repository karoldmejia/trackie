const API_URL = 'https://trackie-296r.onrender.com';

console.log('API URL:', API_URL);

export const API_CONFIG = {
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
};