import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const ITERATIONS = 100000;
const KEY_LEN = 32; // 256 bits for AES-256
const DIGEST = "sha256";

export const encryptPrivateKey = (privateKeyString, password) => {
  // 1. Generate a random salt for key derivation
  const salt = crypto.randomBytes(16);
  
  // 2. Derive the Key Encryption Key (KEK) from the password
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST);
  
  // 3. Generate a random Initialization Vector (IV)
  const iv = crypto.randomBytes(12);
  
  // 4. Encrypt the private key
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(privateKeyString, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  
  // 5. Get the Authentication Tag (prevents tampering)
  const authTag = cipher.getAuthTag().toString('hex');
  
  // 6. Pack everything into a single string for Postgres
  // Format: salt:iv:authTag:ciphertext
  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${ciphertext}`;
};

export const decryptPrivateKey = (encryptedData, password) => {
  // 1. Split the packed string back into components
  const parts = encryptedData.split(':');
  if (parts.length !== 4) throw new Error("Invalid encrypted data format");
  
  const [saltHex, ivHex, authTagHex, ciphertext] = parts;
  
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  // 2. Derive the exact same key using the stored salt
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST);
  
  // 3. Decrypt back to plaintext
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};