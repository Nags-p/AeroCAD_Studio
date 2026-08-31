import { AircraftModel } from '@/types/aircraft';

/**
 * Derives a 256-bit AES-GCM cryptographic key from the user's authenticated identity
 */
async function deriveUserKey(userId: string, email: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawKeyMaterial = enc.encode(`ThermoDESiM_Aero_CAD_Vault:${userId}:${email}`);
  
  // Hash to 256-bit key using SHA-256
  const keyHash = await crypto.subtle.digest('SHA-256', rawKeyMaterial);

  return crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypts an AircraftModel into a single unreadable AES-256-GCM ciphertext string before writing to Supabase
 */
export async function encryptModelForCloud(
  model: AircraftModel,
  userId: string,
  email: string
): Promise<string> {
  const key = await deriveUserKey(userId, email);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(model));

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-256-GCM',
      iv: iv,
    },
    key,
    data
  );

  const ivB64 = bufferToBase64(iv.buffer);
  const cipherB64 = bufferToBase64(encryptedBuffer);

  // Return a single, 100% scrambled ciphertext string
  return `AES256GCM:${ivB64}:${cipherB64}`;
}

/**
 * Decrypts an encrypted ciphertext received from Supabase into an AircraftModel
 */
export async function decryptModelFromCloud(
  payload: any,
  userId: string,
  email: string
): Promise<AircraftModel> {
  if (!payload) {
    throw new Error('Empty payload');
  }

  // Handle single encrypted string format (AES256GCM:iv:ciphertext)
  if (typeof payload === 'string' && payload.startsWith('AES256GCM:')) {
    try {
      const parts = payload.split(':');
      if (parts.length < 3) throw new Error('Invalid ciphertext format');

      const iv = base64ToBuffer(parts[1]);
      const ciphertext = base64ToBuffer(parts[2]);

      const key = await deriveUserKey(userId, email);
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-256-GCM',
          iv: new Uint8Array(iv),
        },
        key,
        ciphertext
      );

      const jsonString = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(jsonString) as AircraftModel;
    } catch (err) {
      console.error('Decryption error:', err);
      throw new Error('Failed to decrypt CAD model from cloud vault.');
    }
  }

  // Handle legacy object payload format if present
  if (typeof payload === 'object' && payload._encrypted && payload.ciphertext) {
    try {
      const key = await deriveUserKey(userId, email);
      const iv = base64ToBuffer(payload.iv);
      const ciphertext = base64ToBuffer(payload.ciphertext);

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-256-GCM',
          iv: new Uint8Array(iv),
        },
        key,
        ciphertext
      );

      const jsonString = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(jsonString) as AircraftModel;
    } catch (err) {
      console.error('Decryption error:', err);
      throw new Error('Failed to decrypt CAD model from cloud vault.');
    }
  }

  // Plaintext legacy fallback
  return payload as AircraftModel;
}
