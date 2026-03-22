export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
export const API_BASE_URL = (BASE_URL.toLowerCase().endsWith('/api') || BASE_URL.toLowerCase().includes('/api/'))
    ? BASE_URL.replace(/\/$/, '')
    : `/api/api`; 

console.log(`[API] Base URL: ${BASE_URL || '(relative)'}`);
console.log(`[API] API Base URL: ${API_BASE_URL}`);

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

let isRedirecting = false;

async function fetchWithAuth(url: string, options: RequestOptions = {}) {
    const isServer = typeof window === 'undefined';
    const token = isServer ? null : localStorage.getItem('token');
    const storedId = isServer ? null : localStorage.getItem('companyId');
    const companyId = (storedId && storedId !== "null" && storedId !== "undefined") ? storedId : null;

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(companyId && { 'X-Company-Id': companyId }),
        ...options.headers,
    };

    const fullUrl = `${API_BASE_URL}${url}`;
    if (!isServer) {
        console.log(`[API] [${options.method || 'GET'}] ${fullUrl}`, { 
            hasToken: !!token, 
            companyId 
        });
    }

    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers,
            credentials: 'include',
        });

        if (!isServer) {
            console.log(`[API] Response ${response.status} for ${url}`);
        }

        if (response.status === 401 && !isServer) {
            // Don't intercept 401s on auth routes, let the component handle the specific active/unauthorized message
            const lowerUrl = url.toLowerCase();
            if (lowerUrl.includes('/auth/login') || lowerUrl.includes('/auth/register') || lowerUrl.includes('/auth/activate')) {
                return response;
            }

            try {
                const oldToken = localStorage.getItem('token');
                const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(oldToken && { Authorization: `Bearer ${oldToken}` }),
                    },
                    credentials: 'include',
                    body: JSON.stringify({ token: oldToken }),
                });

                if (refreshResponse.ok) {
                    const data = await refreshResponse.json();
                    localStorage.setItem('token', data.token);
                    const newHeaders = { ...headers, Authorization: `Bearer ${data.token}` };
                    return await fetch(`${API_BASE_URL}${url}`, { ...options, headers: newHeaders, credentials: 'include' });
                } else {
                    handleLogout();
                    throw new Error('Session expired');
                }
            } catch (refreshError) {
                handleLogout();
                throw refreshError;
            }
        }

        return response;
    } catch (error: any) {
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            console.error("CRITICAL: API is unreachable. Please ensure the backend server is running.");
        }
        throw error;
    }
}

function handleLogout() {
    if (isRedirecting || typeof window === 'undefined') return;
    isRedirecting = true;
    localStorage.removeItem('token');
    localStorage.removeItem('companyId');
    // Force a small delay to ensure state is cleared before redirect
    setTimeout(() => {
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
    }, 100);
}

async function handleResponse<T>(res: Response): Promise<T> {
    const text = await res.text();
    if (typeof window !== 'undefined') {
        console.log(`[API] Raw response from ${res.url}:`, text.substring(0, 500) + (text.length > 500 ? '...' : ''));
    }

    if (!res.ok) {
        let errorMsg = res.statusText;
        let responseData: any = {};
        try {
            responseData = JSON.parse(text);
            errorMsg = responseData.message || responseData.error || res.statusText;
        } catch { }

        // If it's a 403, we don't logout, but we throw a clear error for the UI
        if (res.status === 403) {
            console.error("FORBIDDEN: You do not have permission to access this resource.");
            throw new Error(`Access Denied (403): ${errorMsg}`);
        }

        throw new Error(errorMsg);
    }
    if (res.status === 204 || res.status === 244) return {} as T;
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
