import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import dotenv from "dotenv"
import generateKeys from "../utils/generateKeyPair.util.js";

dotenv.config()

export const signup = async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const keyPair = await generateKeys();

    // Create user
    const userResult = await pool.query(
      "INSERT INTO users (email, password, public_key, username) VALUES ($1, $2, $3, $4) RETURNING id, email, public_key",
      [email, hashedPassword, keyPair.publicKey, username]
    );

    // Generate the public and private keys, and send them in the response.

    res.status(201).json({
      message: "Signup successful",
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      obj:keyPair.obj
    });

  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "User already exists" });
    }

    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed" });
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
  console.log('we definitely reached here')

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password);

  if (!match)
    return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );


  res.json({ token });
};