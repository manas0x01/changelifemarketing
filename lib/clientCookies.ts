'use client';

/**
 * Client-side utility to safely read cookies 
 * Note: Encrypted cookies can only be fully decrypted on the server
 * This utility is for reading plain cookies only
 */

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const nameEQ = name + '=';
  const cookies = document.cookie.split(';');
  
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  
  return null;
}

/**
 * Get all cookies as an object
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  
  const cookies: Record<string, string> = {};
  document.cookie.split(';').forEach((cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name) {
      cookies[name] = decodeURIComponent(value || '');
    }
  });
  
  return cookies;
}

/**
 * Check if user is authenticated (has auth-token)
 */
export function isAuthenticated(): boolean {
  return !!getCookie('auth-token');
}
