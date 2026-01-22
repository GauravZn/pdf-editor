import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";

export const signup = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Missing fields" });

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1,$2) RETURNING id,email",
      [email, hashedPassword]
    );

    res.status(201).json(user.rows[0]);
  } catch (err) {
    res.status(400).json({ message: "User already exists" });
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
    { expiresIn: "1d" }
  );

  res.json({ token });
};
