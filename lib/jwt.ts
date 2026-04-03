import jwt from 'jsonwebtoken';

const secret = process.env.NEXTAUTH_SECRET || 'your-secret-key-change-this';

export interface TokenPayload {
  username: string;
  userId: string;
  email?: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, secret, { expiresIn: '30d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('❌ JWT verification failed:', error);
    return null;
  }
}

export function extractTokenFromCookie(cookieString: string | undefined): string | null {
  if (!cookieString) return null;
  const match = cookieString.match(/auth-token=([^;]+)/);
  return match ? match[1] : null;
}
