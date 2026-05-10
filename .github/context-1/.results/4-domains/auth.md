# Auth Domain — Deep Dive

## Overview
Authentication uses JWT Bearer tokens with three user roles (CUSTOMER, ADMIN, TAILOR). Passwords are hashed with bcryptjs. Auth endpoints are rate-limited.

## Authentication Middleware

The `authenticate` middleware extracts and verifies JWT from the `Authorization: Bearer <token>` header:

```typescript
// packages/api/src/middleware/authenticate.ts
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "CUSTOMER" | "ADMIN" | "TAILOR";
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string; role: string };
  req.user = { id: decoded.id, email: decoded.email, role: decoded.role as any };
  next();
}
```

## Authorization Middleware

Role-based access control via `authorize()` factory function. Must be chained after `authenticate`:

```typescript
// packages/api/src/middleware/authorize.ts
export const authorize = (...allowedRoles: Array<"CUSTOMER" | "ADMIN" | "TAILOR">) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
};
```

## AuthService (Static Class Pattern)

The `AuthService` uses a static class pattern — all methods are static, no instantiation:

```typescript
// packages/api/src/services/authService.ts
export class AuthService {
  static async register(data: RegisterData) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({ data: { email: data.email, password: hashedPassword, ... } });
    const token = this.generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  static async login(data: LoginData) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    const isValid = await bcrypt.compare(data.password, user.password);
    // ...
  }

  private static generateToken(user: { id: string; email: string; role: string }) {
    return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "7d" });
  }
}
```

## Rate Limiting

Auth endpoints have dedicated rate limiting:

```typescript
// packages/api/src/routes/auth.ts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
});

router.post("/register", authLimiter, registerHandler);
router.post("/login", authLimiter, loginHandler);
```

## Client-Side Auth Storage

Both frontend apps store auth data in localStorage:

```typescript
const token = localStorage.getItem("auth_token");
const userRole = localStorage.getItem("user_role");
```

API calls include the token as `Authorization: Bearer ${token}` header.

## Schema Validation

Auth requests are validated using shared Zod schemas:

```typescript
// packages/shared/src/schemas/auth.schema.ts
export const RegisterSchema = z.object({
  email: z.string().email().min(5).max(255),
  password: z.string().min(8).max(100)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain number"),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
});
```
