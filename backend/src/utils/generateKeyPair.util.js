import { webcrypto } from "crypto";
const { subtle } = webcrypto;

async function generateKeys() {
  const keyPair = await subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );

  const publicKey = await subtle.exportKey("jwk", keyPair.publicKey);
  const privateKey = await subtle.exportKey("jwk", keyPair.privateKey);

  const private_b64Key = Buffer.from(JSON.stringify(privateKey)).toString('base64url');
  // console.log(private_b64Key);
  const public_b64Key = Buffer.from(JSON.stringify(publicKey)).toString('base64url');
  // console.log(public_b64Key);


  return {
    "privateKey":private_b64Key,
    "publicKey":public_b64Key,
    "obj":{publicKey, privateKey}
  }
}


export default generateKeys