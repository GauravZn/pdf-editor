import { webcrypto } from "crypto";
const { subtle } = webcrypto;

export const signDocument = async (base64urlPrivateKey, documentBuffer) => {
  // 1. Decode the base64url string back into a JWK string, then parse the JSON
  const jwkString = Buffer.from(base64urlPrivateKey, 'base64url').toString('utf8');
  const jwk = JSON.parse(jwkString);

  // 2. Import the key back into WebCrypto format
  const privateKey = await subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    true, // extractable
    ["sign"]
  );

  // 3. Sign the document. WebCrypto hashes the documentBuffer using SHA-256 automatically here.
  const signatureArrayBuffer = await subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    privateKey,
    documentBuffer
  );

  // 4. Return the signature as a base64 string so it's easy to store in Postgres
  return Buffer.from(signatureArrayBuffer).toString('base64');
};