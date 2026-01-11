/**
 * Get XSRF token from cookie (auto-set by Laravel)
 *
 * Laravel automatically sets the XSRF-TOKEN cookie on every response.
 * Using the cookie instead of a meta tag ensures the token stays fresh
 * even after session changes (e.g., login, logout, session regeneration).
 *
 * @see https://inertiajs.com/csrf-protection
 */
export function getXsrfToken(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    if (match) {
        // Laravel URL-encodes the cookie value, so we need to decode it
        return decodeURIComponent(match[1]);
    }
    return '';
}
