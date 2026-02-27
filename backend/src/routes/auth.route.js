import express from "express";
import { signup, login, verifyEmail } from "../controllers/auth.controller.js"; // <-- Add verifyEmail here
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/verify", verifyEmail); // <-- Add this new route

router.get("/me", authMiddleware, async (req, res) => {
  res.json({ message: "You are authenticated", userId: req.user.id });
});

export default router;