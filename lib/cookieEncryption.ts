import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

/**
 * Hash a cookie value with bcrypt
 * @param value - The cookie value to hash
 * @returns Hashed cookie value
 */
export async function hashCookieValue(value: string): Promise<string> {
  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(value, saltRounds);
    return hash;
  } catch (error) {
    console.error('❌ Error hashing cookie value:', error);
    throw error;
  }
}

/**
 * Verify a cookie value against its hash
 * @param value - The original cookie value
 * @param hash - The hashed value to compare against
 * @returns true if values match, false otherwise
 */
export async function verifyCookieValue(value: string, hash: string): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(value, hash);
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying cookie value:', error);
    return false;
  }
}

/**
 * Encrypt a cookie value using AES-256-GCM
 * @param value - The cookie value to encrypt
 * @returns Encrypted value in format: iv:encryptedData:authTag
 */
export function encryptCookieValue(value: string): string {
  try {
    const key = crypto
      .createHash('sha256')
      .update(ENCRYPTION_KEY)
      .digest();

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:encryptedData:authTag (all in hex)
    return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
  } catch (error) {
    console.error('❌ Error encrypting cookie value:', error);
    throw error;
  }
}

/**
 * Decrypt a cookie value using AES-256-GCM
 * @param encryptedValue - The encrypted value in format: iv:encryptedData:authTag
 * @returns Decrypted original value
 */
export function decryptCookieValue(encryptedValue: string): string {
  try {
    const key = crypto
      .createHash('sha256')
      .update(ENCRYPTION_KEY)
      .digest();

    const [ivHex, encryptedHex, authTagHex] = encryptedValue.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Error decrypting cookie value:', error);
    throw error;
  }
}
