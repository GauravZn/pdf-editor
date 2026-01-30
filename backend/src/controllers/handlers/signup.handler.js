import bcrypt from "bcrypt"; // import the bcrypt library for hashing and comparing passwords
import pool from "../../db.js";  // import the connection pool to run Database queries.

export const signupHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1,$2) RETURNING id,email",
      [email, hashedPassword]
    );

    //  Success
    res.status(201).json({
      message: "Signup successful",
    });

  } catch (err) {
    // user already exist.
    if (err.code === "23505") {
      return res.status(400).json({ message: "User already exists" });
    }

    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed" });
  }
};