'use client';

export function getCookie(name: string): string | null {
  console.log(`🍪 [getCookie] Searching for cookie: "${name}"`);
  
  if (typeof document === 'undefined') {
    console.warn(`⚠️ [getCookie] Document is undefined - running in server environment`);
    return null;
  }
  
  const nameEQ = name + '=';
  console.log(`  🔍 Looking for cookie prefix: "${nameEQ}"`);
  
  const cookies = document.cookie.split(';');
  console.log(`  📋 Total cookies found: ${cookies.length}`);
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    console.log(`    ⏳ Checking cookie ${i + 1}: "${cookie.substring(0, 30)}${cookie.length > 30 ? '...' : ''}"`);
    
    if (cookie.indexOf(nameEQ) === 0) {
      const cookieValue = decodeURIComponent(cookie.substring(nameEQ.length));
      console.log(`    ✅ Cookie found! Value length: ${cookieValue.length} chars`);
      console.log(`  ✅ [getCookie] Successfully retrieved cookie: "${name}"`);
      return cookieValue;
    }
  }
  
  console.log(`  ❌ [getCookie] Cookie "${name}" not found in any of the ${cookies.length} cookies`);
  return null;
}
export function getAllCookies(): Record<string, string> {
  console.log(`📦 [getAllCookies] Extracting all cookies from document...`);
  
  if (typeof document === 'undefined') {
    console.warn(`⚠️ [getAllCookies] Document is undefined - running in server environment`);
    return {};
  }
  
  const cookies: Record<string, string> = {};
  console.log(`  📋 Raw cookie string: "${document.cookie.substring(0, 50)}${document.cookie.length > 50 ? '...' : ''}"`);
  
  const cookieArray = document.cookie.split(';');
  console.log(`  🔢 Total cookies to process: ${cookieArray.length}`);
  
  cookieArray.forEach((cookie, index) => {
    const trimmedCookie = cookie.trim();
    const [name, value] = trimmedCookie.split('=');
    
    console.log(`    ⏳ Processing cookie ${index + 1}:`);
    console.log(`      📝 Name: "${name}"`);
    
    if (name) {
      const decodedValue = decodeURIComponent(value || '');
      cookies[name] = decodedValue;
      console.log(`      ✅ Added - Value length: ${decodedValue.length} chars`);
    } else {
      console.log(`      ⏭️ Skipped - No name found`);
    }
  });
  
  console.log(`  ✅ [getAllCookies] Total cookies extracted: ${Object.keys(cookies).length}`);
  console.log(`  📊 Cookie names: ${Object.keys(cookies).join(', ')}`);
  
  return cookies;
}
export function isAuthenticated(): boolean {
  console.log(`🔐 [isAuthenticated] Checking authentication status...`);
  
  console.log(`  🔍 Checking for session token: "next-auth.session-token"`);
  const sessionToken = getCookie('next-auth.session-token');
  const hasSessionToken = !!sessionToken;
  console.log(`    ${hasSessionToken ? '✅' : '❌'} Found: ${hasSessionToken}`);
  
  console.log(`  🔍 Checking for secure session token: "__Secure-next-auth.session-token"`);
  const secureSessionToken = getCookie('__Secure-next-auth.session-token');
  const hasSecureToken = !!secureSessionToken;
  console.log(`    ${hasSecureToken ? '✅' : '❌'} Found: ${hasSecureToken}`);
  
  const isAuth = hasSessionToken || hasSecureToken;
  console.log(`  🔐 [isAuthenticated] Result: ${isAuth ? '✅ AUTHENTICATED' : '❌ NOT AUTHENTICATED'}`);
  console.log(`    Session Token: ${hasSessionToken ? '✓' : '✗'}`);
  console.log(`    Secure Token: ${hasSecureToken ? '✓' : '✗'}`);
  
  return isAuth;
}
