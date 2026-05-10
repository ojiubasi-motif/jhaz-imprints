import { prisma } from "@jhaz-imprints/db";
import { RegisterData, LoginData } from "@jhaz-imprints/shared";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export class AuthService {
  /**
   * Registers a new user.
   * Hashes password and generates a JWT.
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
        // Role defaults to CUSTOMER
      },
    });

    // Generate JWT
    const token = this.generateToken(user);

    // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Logs in a user.
   * Verifies password and generates a JWT.
   */
  static async login(data: LoginData) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT
    const token = this.generateToken(user);

    // Remove password from returned user object
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Generates a JWT for the given user.
   */
  private static generateToken(user: { id: string; email: string; role: string }) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    // Token expires in 7 days
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      secret,
      { expiresIn: "7d" }
    );
  }
}
