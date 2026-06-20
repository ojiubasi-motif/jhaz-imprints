import crypto from "crypto";

/**
 * Generates a stateless, HMAC-signed CSRF token valid for 10 minutes.
 */
export function generateCsrfToken(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET not set");
  }
  const ts = Date.now().toString();
  const hmac = crypto.createHmac("sha256", secret).update(ts).digest("hex");
  const rawToken = `${ts}.${hmac}`;
  return Buffer.from(rawToken).toString("base64url");
}

/**
 * Verifies if a given CSRF token is valid and not expired (10 minutes).
 */
export function verifyCsrfToken(token: string): boolean {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return false;
  }
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const [ts, hmac] = decoded.split(".");
    if (!ts || !hmac) {
      return false;
    }

    const timestamp = parseInt(ts, 10);
    // Token expires in 10 minutes
    if (isNaN(timestamp) || Date.now() - timestamp > 10 * 60 * 1000 || Date.now() - timestamp < -60 * 1000) {
      return false;
    }

    const expectedHmac = crypto.createHmac("sha256", secret).update(ts).digest("hex");
    
    const a = Buffer.from(hmac);
    const b = Buffer.from(expectedHmac);
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    return false;
  }
}
