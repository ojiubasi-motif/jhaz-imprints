import { prisma } from "@jhaz-imprints/db";
import { RegisterData, LoginData } from "@jhaz-imprints/shared";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

/**
 * Hashes a token with SHA-256 for secure storage.
 * The raw token is returned to the client; only the hash is stored in the DB.
 * On refresh, the incoming token is hashed and compared to the stored hash.
 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export class AuthService {
  /**
   * Registers a new user.
   */
  static async register(data: RegisterData) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Create user in DB
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    // Generate tokens (Quizio pattern: access_token 1d, refresh_token 30m)
    const access_token = this.generateAccessToken(user);
    const refresh_token = this.generateRefreshToken(user);

    // Store hashed refresh token in DB (never store raw tokens)
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashToken(refresh_token) },
    });

    // Remove password and refreshToken from returned user object
    const { password: _, refreshToken: __, ...userData } = user as any;

    return {
      user: userData,
      access_token,
      refresh_token,
    };
  }

  /**
   * Logs in a user.
   */
  static async login(data: LoginData) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const access_token = this.generateAccessToken(user);
    const refresh_token = this.generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashToken(refresh_token) },
    });

    const { password: _, refreshToken: __, ...userData } = user as any;

    return {
      user: userData,
      access_token,
      refresh_token,
    };
  }

  /**
   * Refreshes the access token using a refresh token.
   */
  static async refresh(token: string) {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    if (!secret) throw new Error("REFRESH_TOKEN_SECRET not set");

    try {
      const decoded = jwt.verify(token, secret) as { id: string };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.refreshToken !== hashToken(token)) {
        throw new Error("Invalid refresh token");
      }

      const access_token = this.generateAccessToken(user);
      const new_refresh_token = this.generateRefreshToken(user);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: hashToken(new_refresh_token) },
      });

      const { password: _, refreshToken: __, ...userData } = user as any;

      return {
        user: userData,
        access_token,
        refresh_token: new_refresh_token,
      };
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  /**
   * Invalidates a user's refresh token on logout.
   */
  static async logout(token: string) {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    if (!secret) throw new Error("REFRESH_TOKEN seed not set");

    try {
      const decoded = jwt.verify(token, secret) as { id: string };
      await prisma.user.update({
        where: { id: decoded.id },
        data: { refreshToken: null },
      });
    } catch (error) {
      // Token might be expired or invalid, already effectively logged out
    }
  }

  private static generateAccessToken(user: any) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not set");

    return jwt.sign(
      { email: user.email, role: user.role, id: user.id },
      secret,
      { expiresIn: "15m" }
    );
  }

  private static generateRefreshToken(user: any) {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    if (!secret) throw new Error("REFRESH_TOKEN_SECRET not set");

    return jwt.sign(
      { email: user.email, role: user.role, id: user.id },
      secret,
      { expiresIn: "30m" }
    );
  }
}
