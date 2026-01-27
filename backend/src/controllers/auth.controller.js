import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import crypto from "crypto";
import { addPublicKey } from "../utils/publicKeyRegistry.js";

export const signup = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // 1️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2️⃣ Insert user
    await pool.query(
      "INSERT INTO users (email, password) VALUES ($1,$2)",
      [email, hashedPassword]
    );

  } catch (err) {
    // UNIQUE constraint violation (Postgres)
    if (err.code === "23505") {
      return res.status(400).json({ message: "User already exists" });
    }

    console.error("DB error:", err);
    return res.status(500).json({ message: "Signup failed" });
  }

  try {
  console.log("Generating key pair...");

  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  console.log("Key pair generated");

  console.log("Adding public key to registry...");
  addPublicKey({
    email,
    name: email.split("@")[0],
    publicKey,
  });

  console.log("Public key stored successfully");

  return res.status(201).json({
    message: "Signup successful",
    privateKey,
  });

} catch (err) {
  console.error("KEY STEP FAILED ❌", err);
  return res.status(500).json({
    message: "User created but key generation failed",
    error: err.message,
  });
}

};


export const login = async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  if (result.rows.length === 0)
    return res.status(401).json({ message: "Invalid credentials" });

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password);

  if (!match)
    return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
};
