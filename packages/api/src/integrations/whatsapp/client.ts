/**
 * WhatsApp client wrapper using Twilio.
 * Development: Uses Twilio WhatsApp Sandbox (easy testing)
 * Production: Swap to Meta Cloud API (scale-ready, see comments below)
 * 
 * Never throws unhandled exceptions — always returns { success: boolean, error?: string }
 */

import twilio from "twilio";

interface WhatsAppResponse {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Initialize Twilio client.
 * Credentials from env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
 * WhatsApp From: TWILIO_WHATSAPP_FROM (e.g., +19785414919 for sandbox)
 */
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN env vars");
  }

  return twilio(accountSid, authToken);
}

/**
 * Send WhatsApp text message via Twilio.
 * Twilio handles retry internally; we just need to catch errors gracefully.
 */
export async function sendTextMessage(
  to: string,
  body: string
): Promise<WhatsAppResponse> {
  try {
    const client = getTwilioClient();
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (!from) {
      return {
        success: false,
        error: "Missing TWILIO_WHATSAPP_FROM env var",
      };
    }

    const message = await client.messages.create({
      body,
      from: `whatsapp:${from}`,
      to: `whatsapp:${to}`,
    });

    console.log(`[WhatsApp] Message sent to ${to}: ${message.sid}`);
    return {
      success: true,
      messageId: message.sid,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[WhatsApp] Failed to send message to ${to}:`, errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Send WhatsApp template message via Twilio.
 * NOTE: Twilio WhatsApp Sandbox doesn't support pre-approved templates.
 * Use sendTextMessage() instead for development.
 * In production with Meta Cloud API, this would send templated messages.
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  components: Array<{
    type: string;
    parameters?: Array<{ type: string; text?: string }>;
  }> = []
): Promise<WhatsAppResponse> {
  try {
    const client = getTwilioClient();
    const from = process.env.TWILIO_WHATSAPP_FROM;

    if (!from) {
      return {
        success: false,
        error: "Missing TWILIO_WHATSAPP_FROM env var",
      };
    }

    // For Twilio development: convert template to plain text
    // In production with Meta API, this would use actual template sending
    let bodyText = `Template: ${templateName}\n`;
    if (components.length > 0) {
      components.forEach((comp) => {
        if (comp.parameters) {
          comp.parameters.forEach((param) => {
            if (param.text) {
              bodyText += `${param.text}\n`;
            }
          });
        }
      });
    }

    const message = await client.messages.create({
      body: bodyText,
      from: `whatsapp:${from}`,
      to: `whatsapp:${to}`,
    });

    console.log(`[WhatsApp] Template message sent to ${to}: ${message.sid}`);
    return {
      success: true,
      messageId: message.sid,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[WhatsApp] Failed to send template to ${to}:`, errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
