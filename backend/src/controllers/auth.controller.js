import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import crypto from "crypto";
import dotenv from "dotenv";
import generateKeys from "../utils/generateKeyPair.util.js";
import { encryptPrivateKey } from "../utils/crypto.util.js";
import transporter from "../config/mailer.js"; // Import your mailer

dotenv.config();

export const signup = async (req, res) => {
  const { email, password, username, termsAccepted, captchaToken } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ message: "Missing fields" });
  }
  if (!termsAccepted) {
    return res.status(400).json({ message: "You must accept the Terms and Conditions." });
  }
  if (!captchaToken) {
    return res.status(400).json({ message: "Please complete the CAPTCHA verification." });
  }

  try {
    // 1. Verify CAPTCHA with Google
    const captchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`;
    const captchaRes = await fetch(captchaVerifyUrl, { method: "POST" });
    const captchaData = await captchaRes.json();

    if (!captchaData.success) {
      return res.status(400).json({ message: "CAPTCHA validation failed. Are you a bot?" });
    }

    // 2. Cryptography Prep
    const hashedPassword = await bcrypt.hash(password, 10);
    const keyPair = await generateKeys();
    const encryptedPrivateKey = encryptPrivateKey(keyPair.privateKey, password);

    // 3. Generate Email Verification Token & Expiration (24 hours)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); 

    // 4. Create user in Postgres
    const userResult = await pool.query(
      `INSERT INTO users 
        (email, password, public_key, encrypted_private_key, username, verification_token, verification_expires_at, accepted_terms, is_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false) 
       RETURNING id, email`,
      [email, hashedPassword, keyPair.publicKey, encryptedPrivateKey, username, verificationToken, expiresAt, termsAccepted]
    );

    // 5. Send the Verification Email
    const verifyLink = `http://localhost:5000/api/auth/verify?token=${verificationToken}`;
    await transporter.sendMail({
      from: `"PDF Editor Admin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your PDF Editor Account",
      html: `
        <h2>Welcome to PDF Editor, ${username}!</h2>
        <p>Please verify your email address to activate your account and start signing documents.</p>
        <a href="${verifyLink}" style="padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">Verify My Email</a>
        <p>This link expires in 24 hours.</p>
      `
    });

    res.status(201).json({
      message: "Signup successful. Please check your email to verify your account!",
      privateKey: keyPair.privateKey, // Keeping this here as you had it returning to the UI to copy
    });

  } catch (err) {
    if (err.code === "23505") return res.status(400).json({ message: "User already exists" });
    console.error("Signup error:", err);
    res.status(500).json({ message: "Signup failed" });
  }
};

// NEW: Verification Route Logic
export const verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const result = await pool.query("SELECT id, verification_expires_at FROM users WHERE verification_token = $1", [token]);

    if (result.rows.length === 0) {
      return res.status(400).send("Invalid verification token.");
    }

    const user = result.rows[0];

    // Check if token expired
    if (new Date() > new Date(user.verification_expires_at)) {
      return res.status(400).send("Verification token has expired. Please sign up again.");
    }

    // Update user to verified and wipe the token data
    await pool.query(
      "UPDATE users SET is_verified = true, verification_token = NULL, verification_expires_at = NULL WHERE id = $1",
      [user.id]
    );

    // Redirect the user back to the frontend login page with a success flag
    res.redirect("http://localhost:5173/login?verified=true");

  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).send("Server error during verification.");
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

  if (result.rows.length === 0) return res.status(401).json({ message: "Invalid credentials" });

  const user = result.rows[0];

  // NEW: Block login if they haven't clicked the email link
  if (!user.is_verified) {
    return res.status(403).json({ message: "Please check your email and verify your account before logging in." });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
};