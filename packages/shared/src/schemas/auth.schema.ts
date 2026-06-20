import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email format").min(5).max(255),
  password: z
    .string()
    // SECURITY (NIST SP800-63B §5.1.1 compliance):
    // ✓ Minimum length of 8 characters (NIST minimum).
    // ✓ Maximum of 128 characters (NIST requires allowing ≥ 64; we use 128).
    // ✗ NO composition rules (uppercase/lowercase/number/symbol requirements).
    //   NIST explicitly states verifiers SHOULD NOT impose composition rules —
    //   they reduce entropy by forcing predictable patterns and frustrate users
    //   into weak-but-compliant choices (e.g. "Password1").
    // ✗ NO complexity hints here — UX password-strength feedback belongs in
    //   the frontend (password entropy meter), not in the validation schema.
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50),
});

export type RegisterData = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof LoginSchema>;

// ── Forgot Password ────────────────────────────────────────────────────────────
// SECURITY (OWASP Forgot Password CS — Forgot Password Request):
//   The endpoint must return a consistent message for both existent and non-existent
//   accounts to prevent user enumeration attacks.

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(5)
    .max(255),
});

export type ForgotPasswordData = z.infer<typeof ForgotPasswordSchema>;

// ── Reset Password ─────────────────────────────────────────────────────────────
// SECURITY (OWASP Forgot Password CS — User Resets Password):
//   - Require the user to confirm password (typed twice) to prevent typos.
//   - Enforce the same password policy used everywhere in the app.
//   - Token is validated server-side: CSPRNG-generated, hashed in DB, single-use,
//     15-minute TTL.
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must not exceed 128 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ResetPasswordData = z.infer<typeof ResetPasswordSchema>;

