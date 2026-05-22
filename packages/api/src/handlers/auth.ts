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
    const { user, access_token, refresh_token } = await AuthService.register(validatedData);
    
    // Set HTTP-only cookie with Refresh Token (Named 'jwt' to match Quizio)
    res.cookie("jwt", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Quizio uses None
      maxAge: 30 * 60 * 1000, // 30m (matches refresh_token expiration)
    });

    const full_name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const { password: _, refreshToken: __, createdAt: ___, updatedAt: ____, ...sanitizedUser } = user;

    res.status(201).json({
      msg: "registration success",
      data: {
        user: { ...sanitizedUser, full_name },
        access_token
      },
      type: "SUCCESS",
      code: 600
    });
  } catch (error: any) {
    res.status(400).json({
      msg: error.message || "Registration failed",
      type: "FAILED",
      code: 602
    });
  }
};

/**
 * Handles user login.
 */
export const loginHandler = async (req: Request, res: Response) => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    const { user, access_token, refresh_token } = await AuthService.login(validatedData);
    
    // Set HTTP-only cookie with Refresh Token (Named 'jwt' to match Quizio)
    res.cookie("jwt", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Quizio uses None
      maxAge: 30 * 60 * 1000, // 30m (matches refresh_token expiration)
    });

    const full_name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const { password: _, refreshToken: __, createdAt: ___, updatedAt: ____, ...sanitizedUser } = user;

    res.status(200).json({
      msg: "login success",
      data: {
        user: { ...sanitizedUser, full_name },
        access_token
      },
      type: "SUCCESS",
      code: 600
    });
  } catch (error: any) {
    res.status(401).json({
      msg: error.message || "wrong login credentials",
      type: "WRONG_OR_MISSING_PAYLOAD",
      code: 605
    });
  }
};

/**
 * Handles token refresh.
 */
export const refreshHandler = async (req: Request, res: Response) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) {
      return res.status(401).json({ msg: "No refresh token", type: "FAILED", code: 602 });
    }

    const { user, access_token, refresh_token: new_refresh_token } = await AuthService.refresh(cookies.jwt);

    // Set new HTTP-only cookie (token rotation)
    res.cookie("jwt", new_refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 30 * 60 * 1000,
    });

    const full_name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const { password: _, refreshToken: __, createdAt: ___, updatedAt: ____, ...sanitizedUser } = user;

    res.status(200).json({
      msg: "token refreshed",
      data: {
        user: { ...sanitizedUser, full_name },
        access_token
      },
      type: "SUCCESS",
      code: 600
    });
  } catch (error: any) {
    res.status(401).json({ msg: error.message, type: "FAILED", code: 602 });
  }
};

/**
 * Handles user logout by clearing the cookie.
 */
export const logoutHandler = async (req: Request, res: Response) => {
  const token = req.cookies.jwt;
  if (token) {
    await AuthService.logout(token);
  }
  
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ msg: "signout success", type: "SUCCESS", code: 600 });
};

/**
 * Returns current authenticated user details.
 */
export const meHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ msg: "Unauthorized", type: "FAILED", code: 602 });
    }
    
    res.status(200).json({
      msg: "user profile",
      data: { user },
      type: "SUCCESS",
      code: 600
    });
  } catch (error) {
    res.status(500).json({ msg: "Internal server error", type: "FAILED", code: 602 });
  }
};
