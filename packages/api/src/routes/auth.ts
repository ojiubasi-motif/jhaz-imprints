import { Router } from "express";
import rateLimit from "express-rate-limit";
import { registerHandler, loginHandler, meHandler } from "../handlers/auth";
import { authenticate } from "../middleware/authenticate";

const router = Router();

// Rate limiter for auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
});

// Apply rate limiter to register and login
router.post("/register", authLimiter, registerHandler);
router.post("/login", authLimiter, loginHandler);

// Protected route to get current user details
router.get("/me", authenticate, meHandler);

export default router;
