import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

/**
 * Decrypts a .env.enc file using a .env.key
 */
export function secureEnvParse(
  encPath: string = path.resolve(__dirname, '../../config/.env.enc'),
  keyPath: string = path.resolve(__dirname, '../../config/.env.key'),
) {
  const encrypted = fs.readFileSync(encPath);
  const keyHex = fs.readFileSync(keyPath, 'utf8').trim();
  const key = Buffer.from(keyHex, 'hex');

  const ivLength = 16; // AES-256-CBC IV length
  const iv = encrypted.slice(0, ivLength);
  const ciphertext = encrypted.slice(ivLength);

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  const decryptedText = decrypted.toString('utf8');

  // Now parse the .env content into process.env
  const parsed = dotenv.parse(decryptedText);
  for (const [envKey, value] of Object.entries(parsed)) {
    process.env[envKey] = value;
  }

  console.log('Secure environment variables loaded.');
}