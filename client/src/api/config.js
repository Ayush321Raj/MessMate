const apiOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const apiBaseUrl = apiOrigin ? `${apiOrigin}/api` : '/api';
export const socketUrl = apiOrigin || '/';
