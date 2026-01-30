import bcrypt from "bcrypt"; // import the bcrypt library for hashing and comparing passwords
import pool from "../../db.js"; // import the connection pool to run Database queries.
import jwt from "jsonwebtoken";

export const loginHandler = async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  if (result.rows.length === 0)
    return res.status(401).json({ message: "Invalid credentials" });

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password);

  // return if the password do not match
  if (!match)
    return res.status(401).json({ message: "Invalid credentials" });
  
  
  // sign the jwt token with our payload.
  const token = jwt.sign(
    { id: user.id , email:user.email},
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
};