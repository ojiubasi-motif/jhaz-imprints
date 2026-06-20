/**
 * Paystack payment service
 * Handles communication with Paystack API for payment initialization and verification
 * 
 * Paystack Payment Flow:
 * 1. Initialize Transaction: POST /transaction/initialize
 *    - Returns: authorization_url (for frontend redirect), access_code, reference
 * 2. Complete Transaction: Customer completes payment on Paystack checkout
 * 3. Verify Transaction: GET /transaction/verify/{reference}
 *    - Confirms payment status and details
 */

import crypto from "crypto";

interface InitializePaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface VerifyPaymentResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    paid_at: string;
    status: "success" | "failed" | "abandoned";
    customer: {
      id: number;
      email: string;
    };
    metadata?: Record<string, any>;
  };
}

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_BASE_URL = "https://api.paystack.co";

if (!PAYSTACK_SECRET_KEY) {
  throw new Error("PAYSTACK_SECRET_KEY environment variable is not set");
}

/**
 * Initialize a payment transaction with Paystack
 * Step 1 of Paystack payment flow
 * 
 * @param email - Customer email
 * @param amount - Amount in Naira (will be converted to kobo)
 * @param reference - Unique reference for idempotency
 * @param metadata - Additional metadata to attach to the transaction
 * @returns Payment authorization URL and transaction reference
 */
export async function initializePayment(
  email: string,
  amount: number,
  reference: string,
  metadata?: Record<string, any>
): Promise<{
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}> {
  try {
    const response = await fetch(
      `${PAYSTACK_API_BASE_URL}/transaction/initialize`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: amount * 100, // Convert Naira to kobo (1 Naira = 100 kobo)
          reference,
          metadata: metadata || {},
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Paystack API error: ${error.message || response.statusText}`);
    }

    const data = (await response.json()) as InitializePaymentResponse;

    if (!data.status) {
      throw new Error(`Paystack initialization failed: ${data.message}`);
    }

    return {
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  } catch (error) {
    console.error("Error initializing Paystack payment:", error);
    throw error;
  }
}

/**
 * Verify a payment transaction with Paystack
 * Step 3 of Paystack payment flow
 * 
 * @param reference - Payment reference to verify
 * @returns Transaction details including status and amount
 */
export async function verifyPayment(reference: string): Promise<{
  status: "success" | "failed" | "abandoned";
  amount: number;
  paidAt: string;
  email: string;
  customerId: number;
}> {
  try {
    const response = await fetch(
      `${PAYSTACK_API_BASE_URL}/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Paystack API error: ${error.message || response.statusText}`);
    }

    const data = (await response.json()) as VerifyPaymentResponse;

    if (!data.status) {
      throw new Error(`Paystack verification failed: ${data.message}`);
    }

    return {
      status: data.data.status,
      amount: data.data.amount / 100, // Convert kobo back to Naira
      paidAt: data.data.paid_at,
      email: data.data.customer.email,
      customerId: data.data.customer.id,
    };
  } catch (error) {
    console.error("Error verifying Paystack payment:", error);
    throw error;
  }
}

/**
 * Fetch a transaction by reference (for dashboard/admin purposes)
 * 
 * @param reference - Payment reference
 * @returns Full transaction details
 */
export async function fetchTransaction(reference: string): Promise<any> {
  try {
    const response = await fetch(
      `${PAYSTACK_API_BASE_URL}/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch transaction: ${response.statusText}`);
    }

    const data = (await response.json()) as VerifyPaymentResponse;
    return data.data;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
}
/**
 * Verify Paystack webhook signature
 * 
 * @param payload - Raw request body
 * @param signature - Signature from x-paystack-signature header
 * @returns boolean - Whether the signature is valid
 */
export function verifyWebhookSignature(payload: any, signature: string): boolean {
  if (!PAYSTACK_SECRET_KEY || !signature) return false;
  
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(typeof payload === "string" ? payload : JSON.stringify(payload))
    .digest("hex");
    
  try {
    const a = Buffer.from(hash, "utf-8");
    const b = Buffer.from(signature, "utf-8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
