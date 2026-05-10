import type { Request, Response } from "express";
import { RegisterSchema, LoginSchema } from "@jhaz-imprints/shared";
import { AuthService } from "../services/authService";
import type { AuthenticatedRequest } from "../middleware/authenticate";

/**
 * Handles user registration.
 */
export const registerHandler = async (req: Request, res: Response) => {
  try {
    const validatedData = RegisterSchema.parse(req.body);
    const result = await AuthService.register(validatedData);
    
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "User with this email already exists") {
      res.status(409).json({ error: error.message });
    } else if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

/**
 * Handles user login.
 */
export const loginHandler = async (req: Request, res: Response) => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    const result = await AuthService.login(validatedData);
    
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid email or password") {
      res.status(401).json({ error: error.message });
    } else if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

/**
 * Returns current authenticated user details.
 */
export const meHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
