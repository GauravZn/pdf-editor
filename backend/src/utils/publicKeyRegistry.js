import fs from "fs";
import path from "path";

const registryPath = path.join(
  process.cwd(),
  "secure",
  "public-key-registry.json"
);


export function addPublicKey({ email, name, publicKey }) {
  // Read existing registry
  const raw = fs.readFileSync(registryPath, "utf8");
  const data = JSON.parse(raw);

  // Append new public key entry
  data.keys.push({
    email,
    name,
    publicKey,
    createdAt: new Date().toISOString(),
  });

  // Write back to file (backend only)
  fs.writeFileSync(registryPath, JSON.stringify(data, null, 2));
}
