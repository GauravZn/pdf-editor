import fs from "fs";
import path from "path";

const registryPath = path.join(
  process.cwd(),
  "secure",
  "public-key-registry.json"
);

export function addPublicKey({ email, name, publicKey }) {
  // Ensure directory exists
  fs.mkdirSync(path.dirname(registryPath), { recursive: true });

  let registry = { users: [] };

  if (fs.existsSync(registryPath)) {
    registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"));
  }

  registry.users.push({
    email,
    name,
    publicKey,
    createdAt: new Date().toISOString(),
  });

  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), {
    mode: 0o600, // read/write for owner only
  });
}
