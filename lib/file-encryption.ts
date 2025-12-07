import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}

export async function encryptFile(
  filePath: string,
  encryptionKey?: string
): Promise<{
  encryptedPath: string;
  encryptionKey: string;
  originalFileName: string;
}> {
  const key = encryptionKey
    ? Buffer.from(encryptionKey, 'base64')
    : crypto.randomBytes(KEY_LENGTH);

  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const fileContent = await fs.promises.readFile(filePath);

  const encrypted = Buffer.concat([
    cipher.update(fileContent),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  const encryptedContent = Buffer.concat([
    iv,
    authTag,
    encrypted,
  ]);

  const encryptedFileName = `${crypto.randomBytes(16).toString('hex')}.enc`;
  const uploadsDir = path.join(process.cwd(), 'uploads', 'encrypted');

  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const encryptedPath = path.join(uploadsDir, encryptedFileName);

  await fs.promises.writeFile(encryptedPath, encryptedContent);

  return {
    encryptedPath,
    encryptionKey: key.toString('base64'),
    originalFileName: path.basename(filePath),
  };
}

export async function decryptFile(
  encryptedPath: string,
  encryptionKey: string,
  outputPath?: string
): Promise<Buffer> {
  const key = Buffer.from(encryptionKey, 'base64');

  const encryptedContent = await fs.promises.readFile(encryptedPath);

  const iv = encryptedContent.subarray(0, IV_LENGTH);
  const authTag = encryptedContent.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = encryptedContent.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  if (outputPath) {
    await fs.promises.writeFile(outputPath, decrypted);
  }

  return decrypted;
}

export async function encryptBuffer(
  buffer: Buffer,
  encryptionKey?: string
): Promise<{
  encrypted: Buffer;
  encryptionKey: string;
}> {
  const key = encryptionKey
    ? Buffer.from(encryptionKey, 'base64')
    : crypto.randomBytes(KEY_LENGTH);

  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  const encryptedContent = Buffer.concat([
    iv,
    authTag,
    encrypted,
  ]);

  return {
    encrypted: encryptedContent,
    encryptionKey: key.toString('base64'),
  };
}

export async function decryptBuffer(
  encryptedBuffer: Buffer,
  encryptionKey: string
): Promise<Buffer> {
  const key = Buffer.from(encryptionKey, 'base64');

  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const authTag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = encryptedBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted;
}

export function validateEncryptionKey(key: string): boolean {
  try {
    const buffer = Buffer.from(key, 'base64');
    return buffer.length === KEY_LENGTH;
  } catch {
    return false;
  }
}

export async function secureDeleteFile(filePath: string): Promise<void> {
  const stats = await fs.promises.stat(filePath);
  const fileSize = stats.size;

  const randomData = crypto.randomBytes(fileSize);
  await fs.promises.writeFile(filePath, randomData);

  await fs.promises.unlink(filePath);
}
