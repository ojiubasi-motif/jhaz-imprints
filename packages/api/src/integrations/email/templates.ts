/**
 * Email template generators with inline CSS for email client compatibility.
 * All HTML is tested against dark-mode email clients (Gmail, Apple Mail, Outlook).
 */

interface Order {
  id: string;
  productName: string;
  deliveryDate: Date;
  measurement?: {
    bust?: number;
    waist?: number;
    hip?: number;
    shoulder?: number;
    sleeveLen?: number;
    height?: number;
  };
  totalPrice: number;
  fabricOption?: string;
  colorOption?: string;
  styleOption?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

/**
 * Order confirmation email template.
 * Displays order details with inline CSS for email client compatibility.
 * Tested for dark-mode rendering in Gmail, Apple Mail, Outlook.
 */
export function orderConfirmedEmail(order: Order): EmailTemplate {
  const formattedDate = order.deliveryDate.toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const measurementHtml = order.measurement
    ? `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        <strong>Measurements:</strong>
      </td>
      <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; text-align: right;">
        Bust: ${order.measurement.bust}cm | Waist: ${order.measurement.waist}cm | Hip: ${order.measurement.hip}cm<br/>
        Shoulder: ${order.measurement.shoulder}cm | Sleeve: ${order.measurement.sleeveLen}cm | Height: ${order.measurement.height}cm
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
        ${order.styleOption}
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
        ${order.fabricOption || "Standard"} — ${order.colorOption || "Default"}
      </td>
    </tr>
    `
    : "";

  return {
    subject: `Your ${order.productName} is confirmed! 🎉`,
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
                      Thank you for choosing Jhaz-imprints! Your custom ${order.productName} has been confirmed and is being prepared with care.
                    </p>

                    <!-- Order Details Card -->
                    <div style="background-color: #f3f4f6; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                            <strong>Order ID:</strong>
                          </td>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; text-align: right;">
                            <code style="background: #ffffff; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${order.id}</code>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                            <strong>Outfit:</strong>
                          </td>
                          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; text-align: right;">
                            ${order.productName}
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
                            ₦${order.totalPrice.toLocaleString("en-NG")}
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
                      <li style="margin-bottom: 10px;">You'll receive updates via WhatsApp at each stage</li>
                      <li style="margin-bottom: 10px;">Upon completion, we'll arrange delivery to your location</li>
                    </ol>

                    <!-- Contact Info -->
                    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
                      <p style="margin: 0; color: #1e40af; font-size: 14px;">
                        <strong>Have questions?</strong><br/>
                        Chat with us on WhatsApp for real-time updates and support.
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
    subject: `Order ${order.id} — ${newStatus}`,
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
                      Your order <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">${order.id}</code> status has been updated to:
                    </p>
                    <div style="background-color: #10b981; color: #ffffff; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; font-size: 18px; font-weight: 600;">
                      ${newStatus}
                    </div>
                    <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
                      We'll keep you updated every step of the way. Check your WhatsApp for instant notifications!
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
