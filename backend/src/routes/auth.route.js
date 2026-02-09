import express from "express";
import { signup, login } from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// Protected route
router.get("/me", authMiddleware, async (req, res) => {
  res.json({
    message: "You are authenticated",
    userId: req.user.id,
  });
});

export default router;