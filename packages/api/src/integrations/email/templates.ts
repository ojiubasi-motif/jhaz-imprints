/**
 * Email template generators with inline CSS for email client compatibility.
 * All HTML is tested against dark-mode email clients (Gmail, Apple Mail, Outlook).
 */

interface Order {
  id: string;
  productName: string;
  deliveryDate: Date;
  measurement?: {
    chest?: number;
    waist?: number;
    hip?: number;
    shoulder?: number;
    armLength?: number;
    length?: number;
  };
  totalPrice: number;
  fabricOption?: string;
  colorOption?: string;
  styleOption?: string;
  customerName?: string;
  customerEmail?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

/** Safe HTML escaping helper to prevent HTML injection and Cross-Site Scripting (XSS) */
function escapeHtml(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Safe price formatter — never throws on undefined/null */
function formatPrice(price?: number | null): string {
  return (price ?? 0).toLocaleString("en-NG");
}

/** Safe date formatter — never throws on invalid/missing date */
function formatDate(date?: Date | null, options?: Intl.DateTimeFormatOptions): string {
  const defaults: Intl.DateTimeFormatOptions = {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  };
  try {
    const d = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
    return d.toLocaleDateString("en-NG", options || defaults);
  } catch {
    return new Date().toLocaleDateString("en-NG", options || defaults);
  }
}

/**
 * Order confirmation email template.
 * Displays order details with inline CSS for email client compatibility.
 * Tested for dark-mode rendering in Gmail, Apple Mail, Outlook.
 */
export function orderConfirmedEmail(order: Order): EmailTemplate {
  const formattedDate = formatDate(order.deliveryDate);

  const m = order.measurement;
  const measurementHtml = m
    ? `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <strong>Measurements:</strong>
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; text-align: right;">
        Chest: ${m.chest ?? "—"}cm | Waist: ${m.waist ?? "—"}cm | Hip: ${m.hip ?? "—"}cm<br/>
        Shoulder: ${m.shoulder ?? "—"}cm | Arm Length: ${m.armLength ?? "—"}cm | Length: ${m.length ?? "—"}cm
      </td>
    </tr>
    `
    : "";

  const styleHtml = order.styleOption
    ? `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <strong>Style:</strong>
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; text-align: right;">
        ${escapeHtml(order.styleOption)}
      </td>
    </tr>
    `
    : "";

  const fabricColorHtml = order.fabricOption || order.colorOption
    ? `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <strong>Fabric & Color:</strong>
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; text-align: right;">
        ${escapeHtml(order.fabricOption || "Standard")} — ${escapeHtml(order.colorOption || "Default")}
      </td>
    </tr>
    `
    : "";

  return {
    subject: `Your ${escapeHtml(order.productName)} is confirmed! 🎉`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmed</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb;">
          <tr>
            <td style="padding: 20px;">
              <!-- Container -->
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <td style="padding: 40px 20px; text-align: center; color: #ffffff;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">
                      Order Confirmed! ✓
                    </h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">
                      Your custom outfit is on the way
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 30px 20px;">
                    <!-- Greeting -->
                    <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px;">
                      Thank you for choosing Jhaz-imprints! Your custom ${escapeHtml(order.productName)} has been confirmed and is being prepared with care.
                    </p>

                    <!-- Order Details Card -->
                    <div style="background-color: #f3f4f6; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                            <strong>Order ID:</strong>
                          </td>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; text-align: right;">
                            <code style="background: #ffffff; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${escapeHtml(order.id)}</code>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                            <strong>Outfit:</strong>
                          </td>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; text-align: right;">
                            ${escapeHtml(order.productName)}
                          </td>
                        </tr>
                        ${fabricColorHtml}
                        ${styleHtml}
                        ${measurementHtml}
                        <tr>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                            <strong>Estimated Delivery:</strong>
                          </td>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; text-align: right;">
                            ${formattedDate}
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">
                            <strong>Total Amount:</strong>
                          </td>
                          <td style="padding: 12px 0; color: #1f2937; font-size: 18px; font-weight: 700; text-align: right;">
                            ₦${formatPrice(order.totalPrice)}
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Next Steps -->
                    <h2 style="margin: 30px 0 15px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
                      What Happens Next
                    </h2>
                    <ol style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px;">
                      <li style="margin-bottom: 10px;">We'll measure and prepare your outfit with precision</li>
                      <li style="margin-bottom: 10px;">You'll receive email updates at each stage</li>
                      <li style="margin-bottom: 10px;">Upon completion, we'll arrange delivery to your location</li>
                    </ol>

                    <!-- Contact Info -->
                    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #1e40af; font-size: 14px;">
                        <strong>Have questions?</strong><br/>
                        Reach out to us via email for real-time updates and support.
                      </p>
                    </div>

                    <!-- Closing -->
                    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
                      Looking forward to creating something beautiful for you!<br/>
                      <strong>— The Jhaz-imprints Team</strong>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr style="background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <td style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                    <p style="margin: 0;">
                      Jhaz-imprints | Nigerian Traditional Dress Tailoring
                    </p>
                    <p style="margin: 5px 0 0 0;">
                      Precision craftsmanship meets cultural heritage
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}

/**
 * Status update email template.
 * Notifies customer of order status changes.
 */
export function statusUpdateEmail(
  order: Order,
  newStatus: string
): EmailTemplate {
  return {
    subject: `Order ${escapeHtml(order.id)} — ${escapeHtml(newStatus)}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Update</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb;">
          <tr>
            <td style="padding: 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <td style="padding: 30px 20px; text-align: center; color: #ffffff;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700;">
                      Order Update
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 20px;">
                    <p style="margin: 0 0 15px 0; color: #1f2937; font-size: 16px;">
                      Your order <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${escapeHtml(order.id)}</code> status has been updated to:
                    </p>
                    <div style="background-color: #10b981; color: #ffffff; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; font-size: 18px; font-weight: 600;">
                      ${escapeHtml(newStatus)}
                    </div>
                    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
                      We'll keep you updated every step of the way via email and SMS.
                    </p>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}

/**
 * Admin / Tailor order alert email.
 * Sent to the admin/tailor when a new order is confirmed.
 * Includes full customer details, measurements, and specifications.
 */
export function adminOrderAlertEmail(order: Order): EmailTemplate {
  const formattedDate = formatDate(order.deliveryDate);
  const m = order.measurement;

  const measurementRows = m
    ? `
    <tr><td style="padding: 6px 12px; border: 1px solid #e5e7eb; color: #6b7280;">Chest</td><td style="padding: 6px 12px; border: 1px solid #e5e7eb; color: #1f2937; text-align: right;">${m.chest ?? "—"} cm</td></tr>
    <tr><td style="padding: 6px 12px; border: 1px solid #e5e7eb; color: #6b7280;">Waist</td><td style="padding: 6px 12px; border: 1px solid #e5e7eb; color: #1f2937; text-align: right;">${m.waist ?? "—"} cm</td></tr>
    <tr><td style="padding: 6px 12px; border: 1px solid #e5e7eb; color: #6b7280;">Hip</td><td style="padding: 6px 12px; border: 1px solid #e5e7eb; color: #1f2937; text-align: right;">${m.hip ?? "—"} cm</td></tr>
    <tr><td style="padding: 6px 12px; border: 1px solid #e5e7eb; color: #6b7280;">Shoulder</td><td style="padding: 6px 12px; border: 1px solid #e5e7eb; color: #1f2937; text-align: right;">${m.shoulder ?? "—"} cm</td></tr>
    <tr><td style="padding: 6px 12px; border: 1px solid #e5e7eb; color: #6b7280;">Arm Length</td><td style="padding: 6px 12px; border: 1px solid #e5e7eb; color: #1f2937; text-align: right;">${m.armLength ?? "—"} cm</td></tr>
    <tr><td style="padding: 6px 12px; border: 1px solid #e5e7eb; color: #6b7280;">Length</td><td style="padding: 6px 12px; border: 1px solid #e5e7eb; color: #1f2937; text-align: right;">${m.length ?? "—"} cm</td></tr>
    `
    : `<tr><td colspan="2" style="padding: 12px; border: 1px solid #e5e7eb; color: #9ca3af; text-align: center;">No measurements provided</td></tr>`;

  return {
    subject: `🔔 New Order: ${escapeHtml(order.productName)} — ${escapeHtml(order.customerName || "Customer")}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Alert</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb;">
          <tr>
            <td style="padding: 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                  <td style="padding: 30px 20px; text-align: center; color: #ffffff;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 700;">
                      🔔 New Order Received
                    </h1>
                    <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">
                      Action required — review measurements and begin production
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 25px 20px;">
                    <!-- Customer & Order Info -->
                    <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937;">Order Details</h2>
                    <div style="background-color: #f3f4f6; border-left: 4px solid #f59e0b; padding: 15px; margin: 0 0 20px 0; border-radius: 4px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 6px 0; color: #6b7280; font-size: 14px;"><strong>Order ID:</strong></td>
                          <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right;"><code style="background: #fff; padding: 2px 6px; border-radius: 3px;">${escapeHtml(order.id)}</code></td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #6b7280; font-size: 14px;"><strong>Customer:</strong></td>
                          <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right;">${escapeHtml(order.customerName || "—")}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #6b7280; font-size: 14px;"><strong>Email:</strong></td>
                          <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right;">${escapeHtml(order.customerEmail || "—")}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #6b7280; font-size: 14px;"><strong>Outfit:</strong></td>
                          <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right;">${escapeHtml(order.productName)}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #6b7280; font-size: 14px;"><strong>Style:</strong></td>
                          <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right;">${escapeHtml(order.styleOption || "Classic")}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #6b7280; font-size: 14px;"><strong>Fabric:</strong></td>
                          <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right;">${escapeHtml(order.fabricOption || "Standard")}</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #6b7280; font-size: 14px;"><strong>Delivery Target:</strong></td>
                          <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right;">${formattedDate}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;"><strong>Total:</strong></td>
                          <td style="padding: 8px 0; color: #1f2937; font-size: 18px; font-weight: 700; text-align: right;">₦${formatPrice(order.totalPrice)}</td>
                        </tr>
                      </table>
                    </div>

                    <!-- Measurements -->
                    <h2 style="margin: 0 0 12px 0; font-size: 16px; color: #1f2937;">📐 Customer Measurements</h2>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 0 0 20px 0;">
                      ${measurementRows}
                    </table>

                    <!-- Action -->
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #92400e; font-size: 14px;">
                        <strong>Next Step:</strong> Review the measurements above and confirm production readiness.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr style="background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                  <td style="padding: 15px 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                    <p style="margin: 0;">Jhaz-imprints Admin Notification</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}

/**
 * Password reset request email template.
 * SECURITY (OWASP Forgot Password CS — URL Tokens):
 * - resetUrl is constructed from FRONTEND_URL env var, never from req.headers.host
 *   (prevents Host Header Injection attacks).
 */
export function passwordResetEmail(resetUrl: string, expiryMinutes = 15): EmailTemplate {
  const escapedUrl = escapeHtml(resetUrl);
  return {
    subject: "Reset Your Jhaz-imprints Password",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;line-height:1.6;color:#1f2937;background-color:#f9fafb;margin:0;padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
          <tr>
            <td style="padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <tr style="background:linear-gradient(135deg,#C8521A 0%,#9a3e14 100%);">
                  <td style="padding:40px 20px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:700;">🔐 Password Reset Request</h1>
                    <p style="margin:10px 0 0 0;font-size:15px;opacity:0.9;">We received a request to reset your password</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 28px;">
                    <p style="margin:0 0 20px 0;font-size:15px;">Someone requested a password reset for your Jhaz-imprints account. If this was you, click the button below.</p>
                    <div style="text-align:center;margin:32px 0;">
                      <a href="${escapedUrl}" style="display:inline-block;background-color:#C8521A;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">Reset My Password</a>
                    </div>
                    <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:14px 16px;border-radius:4px;margin:20px 0;">
                      <p style="margin:0;color:#92400e;font-size:13px;">⏱ <strong>This link expires in ${expiryMinutes} minutes.</strong></p>
                    </div>
                    <p style="margin:20px 0 4px 0;color:#6b7280;font-size:13px;">If the button does not work, copy this link into your browser:</p>
                    <p style="margin:0;word-break:break-all;font-size:12px;color:#4b5563;background:#f3f4f6;padding:10px 12px;border-radius:4px;font-family:monospace;">${escapedUrl}</p>
                    <div style="background-color:#eff6ff;border-left:4px solid #3b82f6;padding:14px 16px;border-radius:4px;margin:24px 0 0 0;">
                      <p style="margin:0;color:#1e40af;font-size:13px;"><strong>Did not request this?</strong><br/>Safely ignore this email — your password has not been changed.</p>
                    </div>
                  </td>
                </tr>
                <tr style="background-color:#f9fafb;border-top:1px solid #e5e7eb;">
                  <td style="padding:20px;text-align:center;color:#9ca3af;font-size:12px;">
                    <p style="margin:0;">Jhaz-imprints | Nigerian Traditional Dress Tailoring</p>
                    <p style="margin:4px 0 0 0;">This is an automated security email. Please do not reply.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}

/**
 * Password changed confirmation email.
 * SECURITY (OWASP Forgot Password CS — User Resets Password):
 * Inform the user their password was changed WITHOUT including the new password.
 */
export function passwordChangedEmail(userName?: string): EmailTemplate {
  return {
    subject: "Your Jhaz-imprints Password Has Been Changed",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed</title>
      </head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;line-height:1.6;color:#1f2937;background-color:#f9fafb;margin:0;padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
          <tr>
            <td style="padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <tr style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);">
                  <td style="padding:40px 20px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:700;">✅ Password Successfully Changed</h1>
                    <p style="margin:10px 0 0 0;font-size:15px;opacity:0.9;">Your account password has been updated</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 28px;">
                    <p style="margin:0 0 16px 0;font-size:15px;">Hi ${escapeHtml(userName || "there")},</p>
                    <p style="margin:0 0 20px 0;font-size:15px;">Your Jhaz-imprints account password was successfully changed. You have been signed out of all active sessions for your security.</p>
                    <p style="margin:0 0 24px 0;font-size:15px;">You can now <strong>sign in</strong> with your new password.</p>
                    <div style="background-color:#fef2f2;border-left:4px solid #ef4444;padding:14px 16px;border-radius:4px;">
                      <p style="margin:0;color:#991b1b;font-size:13px;"><strong>Was not you?</strong><br/>Contact support at <a href="mailto:support@jhaz-imprints.com" style="color:#991b1b;">support@jhaz-imprints.com</a> immediately.</p>
                    </div>
                  </td>
                </tr>
                <tr style="background-color:#f9fafb;border-top:1px solid #e5e7eb;">
                  <td style="padding:20px;text-align:center;color:#9ca3af;font-size:12px;">
                    <p style="margin:0;">Jhaz-imprints | Nigerian Traditional Dress Tailoring</p>
                    <p style="margin:4px 0 0 0;">This is an automated security email. Please do not reply.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}

/**
 * Admin OTP login email template.
 */
export function adminOtpEmail(otp: string): EmailTemplate {
  return {
    subject: "Your Admin Login OTP — Jhaz-imprints",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin MFA OTP</title>
      </head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;line-height:1.6;color:#1f2937;background-color:#f9fafb;margin:0;padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
          <tr>
            <td style="padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                <tr style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);">
                  <td style="padding:40px 20px;text-align:center;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;font-weight:700;">🔐 Admin OTP Verification</h1>
                    <p style="margin:10px 0 0 0;font-size:15px;opacity:0.9;">Multi-Factor Authentication Required</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 28px;">
                    <p style="margin:0 0 20px 0;font-size:15px;">You are logging in to the admin panel from a new IP address. Please enter the following 6-digit OTP code to verify your identity:</p>
                    <div style="text-align:center;margin:32px 0;">
                      <div style="display:inline-block;background-color:#f3f4f6;color:#1f2937;letter-spacing:6px;font-size:32px;font-weight:700;padding:12px 24px;border-radius:8px;border:1px solid #e5e7eb;font-family:monospace;">${escapeHtml(otp)}</div>
                    </div>
                    <div style="background-color:#fef3c7;border-left:4px solid #f59e0b;padding:14px 16px;border-radius:4px;margin:20px 0;">
                      <p style="margin:0;color:#92400e;font-size:13px;">⏱ <strong>This code is valid for 5 minutes.</strong></p>
                    </div>
                    <p style="margin:20px 0 0 0;color:#6b7280;font-size:13px;">If you did not initiate this login request, please contact support and update your password immediately.</p>
                  </td>
                </tr>
                <tr style="background-color:#f9fafb;border-top:1px solid #e5e7eb;">
                  <td style="padding:20px;text-align:center;color:#9ca3af;font-size:12px;">
                    <p style="margin:0;">Jhaz-imprints | Nigerian Traditional Dress Tailoring</p>
                    <p style="margin:4px 0 0 0;">This is an automated security email. Please do not reply.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
}
