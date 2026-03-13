export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5039';
export const API_BASE_URL = `${BASE_URL}/api`;

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

let isRedirecting = false;

async function fetchWithAuth(url: string, options: RequestOptions = {}) {
    const isServer = typeof window === 'undefined';
    const token = isServer ? null : localStorage.getItem('token');
    const companyId = isServer ? null : localStorage.getItem('companyId');

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(companyId && { 'X-Company-Id': companyId }),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });

    if (response.status === 401 && !isServer) {
        // Attempt refresh
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            const oldToken = localStorage.getItem('token');

            if (!refreshToken || !oldToken) {
                throw new Error('No refresh token available');
            }

            const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: oldToken, refreshToken }),
            });

            if (refreshResponse.ok) {
                const data = await refreshResponse.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);

                // Retry original request with new token
                const newHeaders = {
                    ...headers,
                    Authorization: `Bearer ${data.token}`,
                };

                return await fetch(`${API_BASE_URL}${url}`, {
                    ...options,
                    headers: newHeaders,
                });
            } else {
                // Refresh failed, logout
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                if (!isRedirecting && typeof window !== 'undefined' && window.location.pathname !== '/login') {
                    isRedirecting = true;
                    window.location.href = '/login';
                }
                throw new Error('Session expired');
            }
        } catch (refreshError: any) {
            // If refresh fails with 401 specifically, logout
            if (!isRedirecting && typeof window !== 'undefined' && window.location.pathname !== '/login') {
                isRedirecting = true;
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
            }
            throw refreshError;
        }
    }

    return response;
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let errorMsg = res.statusText;
        try {
            const error = await res.json();
            errorMsg = error.message || error.error || res.statusText;
        } catch {
            // Not a JSON error, stick with statusText
        }
        throw new Error(errorMsg);
    }
    // For 204 No Content
    if (res.status === 244) return {} as T;
    
    const text = await res.text();
    return text ? JSON.parse(text) : {} as T;
}

export const api = {
    get: async <T>(url: string): Promise<T> => {
        const res = await fetchWithAuth(url);
        return handleResponse<T>(res);
    },
    post: async <T>(url: string, body: any): Promise<T> => {
        const res = await fetchWithAuth(url, { method: 'POST', body: JSON.stringify(body) });
        return handleResponse<T>(res);
    },
    put: async <T>(url: string, body: any): Promise<T> => {
        const res = await fetchWithAuth(url, { method: 'PUT', body: JSON.stringify(body) });
        return handleResponse<T>(res);
    },
    patch: async <T>(url: string, body: any): Promise<T> => {
        const res = await fetchWithAuth(url, { method: 'PATCH', body: JSON.stringify(body) });
        return handleResponse<T>(res);
    },
    delete: async <T>(url: string): Promise<T> => {
        const res = await fetchWithAuth(url, { method: 'DELETE' });
        return handleResponse<T>(res);
    },
};
