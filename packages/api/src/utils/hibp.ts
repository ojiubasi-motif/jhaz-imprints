import crypto from "crypto";

/**
 * Checks if a password has been pwned using the Have I Been Pwned API (k-anonymity).
 * Returns true if the password has appeared in breaches, false otherwise.
 * Fails open (returns false and logs error) if HIBP API is unreachable/errors.
 */
export async function checkPwnedPassword(password: string): Promise<boolean> {
  try {
    const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    // Call the HIBP API with k-anonymity
    // Timeout in 3 seconds to avoid blocking login flow
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        "Add-Padding": "true",
        "User-Agent": "jhaz-imprints-security-check",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`HIBP API returned non-OK status: ${response.status}`);
      return false; // Fail open
    }

    const text = await response.text();
    const lines = text.split("\r\n");

    for (const line of lines) {
      const [lineSuffix, countStr] = line.split(":");
      if (lineSuffix === suffix) {
        const count = parseInt(countStr, 10);
        if (count > 0) {
          console.warn(`Password check: SHA-1 prefix ${prefix} matched pwned suffix. Breach count: ${count}`);
          return true;
        }
      }
    }

    return false;
  } catch (error: any) {
    console.error(`HIBP API check failed: ${error.message || error}`);
    return false; // Fail open
  }
}
